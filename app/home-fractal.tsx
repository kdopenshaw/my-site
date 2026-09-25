"use client";

// Draw the growth GIF ourselves, one frame at a time, and stop on the last frame.
// An img element cannot: Chromium loops a GIF forever when the Netscape loop
// block is missing. ImageDecoder cannot either on a phone: it retains every
// decoded frame, and these files are dozens of full-size frames.

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
type GifFrame = {
  delay: number;
  left: number;
  top: number;
  width: number;
  height: number;
  minCodeSize: number;
  compressed: Uint8Array;
  palette: Uint8Array;
};
type GifAnimation = { width: number; height: number; frames: GifFrame[] };

function skipBlocks(bytes: Uint8Array, start: number) {
  let cursor = start;
  while (cursor < bytes.length) {
    const size = bytes[cursor];
    cursor += 1;
    if (size === 0) return cursor;
    cursor += size;
  }
  return bytes.length + 1;
}

function readGif(buffer: ArrayBuffer): GifAnimation | null {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 13) return null;
  const header = String.fromCharCode(...bytes.subarray(0, 6));
  if (header !== "GIF87a" && header !== "GIF89a") return null;

  const width = bytes[6] | (bytes[7] << 8);
  const height = bytes[8] | (bytes[9] << 8);
  let offset = 13;
  const globalCount = bytes[10] & 0x80 ? 2 << (bytes[10] & 0x07) : 0;
  const globalPalette = globalCount ? bytes.subarray(offset, offset + globalCount * 3) : null;
  if (globalCount) offset += globalCount * 3;
  if (offset > bytes.length || !globalPalette) return null;

  const frames: GifFrame[] = [];
  let pending = 100;

  while (offset < bytes.length) {
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0x3b) return frames.length > 1 ? { width, height, frames } : null;
    if (marker === 0x21) {
      if (offset >= bytes.length) return null;
      const label = bytes[offset];
      offset += 1;
      if (label === 0xf9 && offset + 4 < bytes.length && bytes[offset] === 4) {
        const centiseconds = bytes[offset + 2] | (bytes[offset + 3] << 8);
        // A stored delay of 0 is defined as 100ms by browsers.
        pending = centiseconds === 0 ? 100 : centiseconds * 10;
      }
      offset = skipBlocks(bytes, offset);
      if (offset > bytes.length) return null;
      continue;
    }
    if (marker !== 0x2c || offset + 9 > bytes.length) return null;

    const left = bytes[offset] | (bytes[offset + 1] << 8);
    const top = bytes[offset + 2] | (bytes[offset + 3] << 8);
    const frameWidth = bytes[offset + 4] | (bytes[offset + 5] << 8);
    const frameHeight = bytes[offset + 6] | (bytes[offset + 7] << 8);
    const packed = bytes[offset + 8];
    offset += 9;
    let palette = globalPalette;
    if (packed & 0x80) {
      const count = 2 << (packed & 0x07);
      if (offset + count * 3 > bytes.length) return null;
      palette = bytes.subarray(offset, offset + count * 3);
      offset += count * 3;
    }
    if (
      (packed & 0x40) ||
      offset >= bytes.length ||
      frameWidth === 0 ||
      frameHeight === 0 ||
      left + frameWidth > width ||
      top + frameHeight > height
    ) return null;
    const minCodeSize = bytes[offset];
    offset += 1;
    const dataStart = offset;
    offset = skipBlocks(bytes, offset);
    if (offset > bytes.length || minCodeSize < 2 || minCodeSize > 8) return null;

    const parts: Uint8Array[] = [];
    let cursor = dataStart;
    let length = 0;
    while (cursor < offset - 1) {
      const size = bytes[cursor];
      cursor += 1;
      if (size === 0) break;
      parts.push(bytes.subarray(cursor, cursor + size));
      length += size;
      cursor += size;
    }
    const compressed = new Uint8Array(length);
    let at = 0;
    for (const part of parts) {
      compressed.set(part, at);
      at += part.length;
    }
    frames.push({
      delay: pending,
      left,
      top,
      width: frameWidth,
      height: frameHeight,
      minCodeSize,
      compressed,
      palette,
    });
    pending = 100;
  }

  return null;
}

function lzwDecode(minCodeSize: number, data: Uint8Array, pixelCount: number) {
  const clearCode = 1 << minCodeSize;
  const eoiCode = clearCode + 1;
  const prefix = new Int16Array(4096);
  const suffix = new Uint8Array(4096);
  const output = new Uint8Array(pixelCount);
  const stack = new Uint8Array(4096);
  let out = 0;
  let codeSize = minCodeSize + 1;
  let nextCode = eoiCode + 1;
  let prev = -1;
  let bitBuffer = 0;
  let bitCount = 0;
  let cursor = 0;

  const readCode = () => {
    while (bitCount < codeSize) {
      if (cursor >= data.length) return -1;
      bitBuffer |= data[cursor] << bitCount;
      cursor += 1;
      bitCount += 8;
    }
    const code = bitBuffer & ((1 << codeSize) - 1);
    bitBuffer >>= codeSize;
    bitCount -= codeSize;
    return code;
  };

  while (out < pixelCount) {
    const code = readCode();
    if (code < 0 || code === eoiCode) break;
    if (code === clearCode) {
      codeSize = minCodeSize + 1;
      nextCode = eoiCode + 1;
      prev = -1;
      continue;
    }

    const special = code === nextCode;
    const walk = special ? prev : code;
    if (walk < 0 || (!special && code > nextCode)) return null;
    let stackPos = 0;
    let current = walk;
    while (current >= clearCode) {
      stack[stackPos] = suffix[current];
      stackPos += 1;
      current = prefix[current];
    }
    const root = current;
    stack[stackPos] = root;
    stackPos += 1;

    if (prev >= 0 && nextCode < 4096) {
      prefix[nextCode] = prev;
      suffix[nextCode] = root;
      nextCode += 1;
      if (nextCode === (1 << codeSize) && codeSize < 12) codeSize += 1;
    }
    prev = special ? nextCode - 1 : code;

    for (let index = stackPos - 1; index >= 0 && out < pixelCount; index -= 1) {
      output[out] = stack[index];
      out += 1;
    }
    if (special && out < pixelCount) {
      output[out] = root;
      out += 1;
    }
  }

  return out === pixelCount ? output : null;
}

function paintFrame(pixels: Uint8ClampedArray, canvasWidth: number, frame: GifFrame, indexes: Uint8Array) {
  const { palette, left, top, width, height } = frame;
  for (let y = 0; y < height; y += 1) {
    const row = (top + y) * canvasWidth + left;
    for (let x = 0; x < width; x += 1) {
      const color = indexes[y * width + x] * 3;
      const pixel = (row + x) * 4;
      pixels[pixel] = palette[color];
      pixels[pixel + 1] = palette[color + 1];
      pixels[pixel + 2] = palette[color + 2];
      pixels[pixel + 3] = 255;
    }
  }
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
    let active = true;
    let timeoutId = 0;
    let finishWait = () => {};

    const wait = (ms: number) => new Promise<void>((resolve) => {
      finishWait = resolve;
      timeoutId = window.setTimeout(resolve, ms);
    });

    async function play(surface: HTMLCanvasElement, drawing: CanvasRenderingContext2D) {
      const response = await fetch(image.gif, { signal: controller.signal });
      if (!response.ok) throw new Error("Unable to load the fractal animation");
      const bytes = await response.arrayBuffer();
      if (!active) return;

      const animation = readGif(bytes);
      if (!animation || animation.width !== surface.width || animation.height !== surface.height) {
        throw new Error("The fractal animation did not decode completely");
      }

      const bitmap = drawing.createImageData(surface.width, surface.height);
      let elapsed = 0;
      let origin = 0;
      for (let index = 0; index < animation.frames.length; index += 1) {
        if (!active) return;
        const frame = animation.frames[index];
        const indexes = lzwDecode(frame.minCodeSize, frame.compressed, frame.width * frame.height);
        if (!indexes) throw new Error("The fractal animation did not decode completely");
        paintFrame(bitmap.data, surface.width, frame, indexes);
        drawing.putImageData(bitmap, 0, 0);
        if (index === 0) {
          origin = performance.now();
          setPaintedTheme(theme);
        }
        if (index === animation.frames.length - 1) {
          heldThemeRef.current = theme;
          onPlaybackComplete?.();
          break;
        }
        elapsed += frame.delay;
        const remaining = elapsed - (performance.now() - origin);
        if (!active) return;
        if (remaining > 0) await wait(remaining);
      }
    }

    play(canvas, context).catch(() => {
      if (!active) return;
      setUseStill(true);
    });

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      finishWait();
      controller.abort();
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
