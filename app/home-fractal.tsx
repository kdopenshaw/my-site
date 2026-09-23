"use client";

// The GIF assets have no loop extension: the browser holds their final frame.
// Visitors who prefer reduced motion see the still image immediately.

import Link from "next/link";
import { useEffect, useState } from "react";

import styles from "./home.module.css";

const FRACTALS = {
  dark: {
    gif: "/fractals/julia-growth-dark.gif?version=retain-frames",
    still: "/fractals/julia-growth-dark-last.png",
    width: 1000,
    height: 1000,
  },
  light: {
    gif: "/fractals/julia_0.2841_0.01_20260921-154313_growth.gif?version=retain-frames",
    still: "/fractals/julia_0.2841_0.01_20260921-154313_growth_last.png",
    width: 610,
    height: 784,
  },
};

type Theme = keyof typeof FRACTALS;
type Selection = { theme: Theme; reducedMotion: boolean };

export default function HomeFractal() {
  const [selection, setSelection] = useState<Selection | null>(null);
  const [loaded, setLoaded] = useState<{ selection: Selection; src: string } | null>(null);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const refresh = () => {
      const theme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
      const reducedMotion = motionPreference.matches;
      // Repeated theme notifications must not restart an existing animation.
      setSelection((previous) => previous?.theme === theme && previous.reducedMotion === reducedMotion
        ? previous : { theme, reducedMotion });
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
    if (!selection || selection.reducedMotion) return;
    const controller = new AbortController();
    const image = FRACTALS[selection.theme];

    async function load() {
      try {
        const response = await fetch(image.gif, { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load the fractal animation");
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        // Buffer the entire animation before mounting it. Data URLs are allowed
        // by the site's image policy; blob URLs are not.
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
        if (controller.signal.aborted) return;
        // A unique fragment gives each playback its own image resource.
        setLoaded({ selection: selection!, src: `${dataUrl}#${crypto.randomUUID()}` });
      } catch {
        if (!controller.signal.aborted) setLoaded({ selection: selection!, src: image.still });
      }
    }
    void load();
    return () => {
      controller.abort();
    };
  }, [selection]);

  const image = FRACTALS[selection?.theme ?? "light"];
  const src = selection?.reducedMotion ? image.still : loaded?.selection === selection ? loaded?.src : null;

  return (
    <div className={styles.fractal}>
      <Link href="/fractals" className={styles.fractalClip} aria-label="Open the fractal generator">
        {src && (
          <img
            key={src}
            src={src}
            alt=""
            width={image.width}
            height={image.height}
            className={`${selection?.theme === "dark" ? styles.darkFractalImage : ""} ${styles.fractalImageReady}`}
          />
        )}
      </Link>
    </div>
  );
}
