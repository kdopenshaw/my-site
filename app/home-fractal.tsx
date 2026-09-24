"use client";

// Draw the growth GIF ourselves and stop. An img element cannot: Chromium loops
// a GIF forever when the Netscape loop block is missing, a loop count of 1 plays
// twice there, disposal method 2 clears the picture at the end of each pass, and
// a new src (or unmounting the image) starts the file over from frame one.

import { useEffect, useRef, useState } from "react";

import styles from "./home.module.css";

const FRACTALS = {
  dark: {
    gif: "/fractals/julia-growth-dark.gif",
    still: "/fractals/julia-growth-dark-last.png",
    width: 1000,
    height: 1000,
  },
  light: {
    gif: "/fractals/julia_0.2841_0.01_20260921-154313_growth.gif",
    still: "/fractals/julia_0.2841_0.01_20260921-154313_growth_last.png",
    width: 610,
    height: 784,
  },
};

type Theme = keyof typeof FRACTALS;
type DecodedFrame = { close(): void; duration: number | null };
type GifDecoder = {
  tracks: { ready: Promise<void>; selectedTrack: { frameCount: number } | null };
  completed: Promise<void>;
  decode(options: { frameIndex: number; completeFramesOnly: boolean }): Promise<{ image: DecodedFrame }>;
  close(): void;
};

function gifFrameDelays(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 13) return [];
  const header = String.fromCharCode(...bytes.subarray(0, 6));
  if (header !== "GIF87a" && header !== "GIF89a") return [];

  let offset = 13;
  if (bytes[10] & 0x80) offset += 3 * (2 << (bytes[10] & 0x07));
  if (offset > bytes.length) return [];

  const delays: number[] = [];
  let pending = 100;

  const skipBlocks = (start: number) => {
    let cursor = start;
    while (cursor < bytes.length) {
      const size = bytes[cursor];
      cursor += 1;
      if (size === 0) return cursor;
      cursor += size;
    }
    return bytes.length + 1;
  };

  while (offset < bytes.length) {
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0x3b) return delays;
    if (marker === 0x21) {
      if (offset >= bytes.length) return [];
      const label = bytes[offset];
      offset += 1;
      if (label === 0xf9 && offset + 3 < bytes.length && bytes[offset] === 4) {
        const centiseconds = bytes[offset + 2] | (bytes[offset + 3] << 8);
        // A stored delay of 0 is defined as 100ms by browsers.
        pending = centiseconds === 0 ? 100 : centiseconds * 10;
      }
      offset = skipBlocks(offset);
      if (offset > bytes.length) return [];
      continue;
    }
    if (marker === 0x2c) {
      if (offset + 9 > bytes.length) return [];
      const packed = bytes[offset + 8];
      offset += 9;
      if (packed & 0x80) offset += 3 * (2 << (packed & 0x07));
      if (offset >= bytes.length) return [];
      offset += 1;
      offset = skipBlocks(offset);
      if (offset > bytes.length) return [];
      delays.push(pending);
      pending = 100;
      continue;
    }
    return [];
  }

  return [];
}

function frameDelay(duration: number | null, parsed: number | undefined) {
  if (parsed !== undefined) return parsed;
  if (duration !== null && duration > 0) return duration / 1000;
  return 100;
}

type HomeFractalProps = {
  onPlaybackComplete?: () => void;
};

export default function HomeFractal({ onPlaybackComplete }: HomeFractalProps) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [useStill, setUseStill] = useState(false);
  const [paintedTheme, setPaintedTheme] = useState<Theme | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Set only after the final frame is on the canvas. A repeat run for the same
  // theme must not draw again; the bitmap is already the frame we need to keep.
  const heldThemeRef = useRef<Theme | null>(null);
  // Theme or motion changes have to drop a failed decode and hide the previous
  // picture in the same render that resizes the canvas. Otherwise the cleared
  // bitmap flashes, or a fallback still keeps the canvas unmounted.
  const playbackKey = theme === null ? null : `${theme}:${reducedMotion ? "still" : "play"}`;
  const [trackedPlayback, setTrackedPlayback] = useState<string | null>(null);
  if (playbackKey !== trackedPlayback) {
    setTrackedPlayback(playbackKey);
    setUseStill(false);
    setPaintedTheme(null);
  }

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const refresh = () => {
      const nextTheme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
      const nextReduced = motionPreference.matches;
      setTheme((current) => current === nextTheme ? current : nextTheme);
      setReducedMotion((current) => current === nextReduced ? current : nextReduced);
    };

    refresh();
    window.addEventListener("site-theme-change", refresh);
    motionPreference.addEventListener("change", refresh);
    return () => {
      window.removeEventListener("site-theme-change", refresh);
      motionPreference.removeEventListener("change", refresh);
    };
  }, []);

  useEffect(() => {
    if (!theme || reducedMotion || useStill) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const image = FRACTALS[theme];
    if (heldThemeRef.current === theme && canvas.width === image.width && canvas.height === image.height) {
      setPaintedTheme(theme);
      onPlaybackComplete?.();
      return;
    }
    // Assigning the same canvas size clears its bitmap, so only write a change.
    if (canvas.width !== image.width) canvas.width = image.width;
    if (canvas.height !== image.height) canvas.height = image.height;
    const controller = new AbortController();
    const session: { decoder?: GifDecoder } = {};
    let active = true;
    let timeoutId = 0;
    let finishWait = () => {};

    const closeDecoder = () => {
      const decoder = session.decoder;
      session.decoder = undefined;
      try {
        decoder?.close();
      } catch {
        // Closing an already-closed decoder is how a cancelled draw stops.
      }
    };

    const wait = (ms: number) => new Promise<void>((resolve) => {
      finishWait = resolve;
      timeoutId = window.setTimeout(resolve, ms);
    });

    async function play(surface: HTMLCanvasElement, drawing: CanvasRenderingContext2D) {
      const Decoder = (window as Window & { ImageDecoder?: new (init: { data: ArrayBuffer; type: string; preferAnimation: boolean }) => GifDecoder }).ImageDecoder;
      if (!Decoder) throw new Error("This browser cannot decode the fractal animation");

      const response = await fetch(image.gif, { signal: controller.signal });
      if (!response.ok) throw new Error("Unable to load the fractal animation");
      const bytes = await response.arrayBuffer();
      if (!active) return;

      const delays = gifFrameDelays(bytes);
      const decoder = new Decoder({ data: bytes, type: "image/gif", preferAnimation: true });
      session.decoder = decoder;
      await decoder.tracks.ready;
      await decoder.completed;
      if (!active) return;

      const count = decoder.tracks.selectedTrack?.frameCount ?? 0;
      if (count < 2 || (delays.length > 1 && delays.length !== count)) {
        throw new Error("The fractal animation did not decode completely");
      }

      let elapsed = 0;
      let origin = 0;
      for (let index = 0; index < count; index += 1) {
        if (!active) return;
        const { image: frame } = await decoder.decode({ frameIndex: index, completeFramesOnly: true });
        if (!active) {
          frame.close();
          return;
        }
        drawing.drawImage(frame as CanvasImageSource, 0, 0, surface.width, surface.height);
        const delay = frameDelay(frame.duration, delays.length === count ? delays[index] : undefined);
        frame.close();
        if (index === 0) {
          origin = performance.now();
          setPaintedTheme(theme);
        }
        if (index === count - 1) {
          heldThemeRef.current = theme;
          onPlaybackComplete?.();
          break;
        }
        elapsed += delay;
        const remaining = elapsed - (performance.now() - origin);
        if (!active) return;
        if (remaining > 0) await wait(remaining);
      }
    }

    play(canvas, context).then(() => {
      if (active) closeDecoder();
    }).catch(() => {
      if (!active) return;
      closeDecoder();
      setUseStill(true);
    });

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      finishWait();
      controller.abort();
      closeDecoder();
    };
  }, [onPlaybackComplete, reducedMotion, theme, useStill]);

  const image = FRACTALS[theme ?? "light"];
  const showStill = Boolean(theme) && (reducedMotion || useStill);

  return (
    <div className={styles.fractal}>
      <div className={styles.fractalClip}>
        {showStill && (
          <img
            src={image.still}
            alt=""
            width={image.width}
            height={image.height}
            className={`${theme === "dark" ? styles.darkFractalImage : ""} ${styles.fractalImageReady}`}
          />
        )}
        {theme && !showStill && (
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className={`${theme === "dark" ? styles.darkFractalImage : ""} ${paintedTheme === theme ? styles.fractalImageReady : ""}`}
          />
        )}
      </div>
    </div>
  );
}
