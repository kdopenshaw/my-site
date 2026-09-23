"use client";

// Plays the growth GIF once, then holds the last frame.
// Visitors who prefer reduced motion see the still image immediately.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./home.module.css";

const FRACTALS = {
  dark: {
    gif: "/fractals/julia-growth-dark.gif",
    still: "/fractals/julia-growth-dark-last.png",
    duration: 3_960,
    width: 1000,
    height: 1000,
  },
  light: {
    gif: "/fractals/julia_0.2841_0.01_20260921-154313_growth.gif",
    still: "/fractals/julia_0.2841_0.01_20260921-154313_growth_last.png",
    duration: 4_950,
    width: 610,
    height: 784,
  },
};

type Theme = keyof typeof FRACTALS;

export default function HomeFractal() {
  const [theme, setTheme] = useState<Theme>("light");
  const [src, setSrc] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const freezeTimer = useRef<number>(0);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const refresh = () => {
      window.clearTimeout(freezeTimer.current);
      setReady(false);
      const currentTheme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
      setTheme(currentTheme);
      const image = FRACTALS[currentTheme];
      setSrc(motionPreference.matches ? image.still : `${image.gif}?play=${Date.now()}`);
    };

    refresh();
    window.addEventListener("site-theme-change", refresh);
    motionPreference.addEventListener("change", refresh);
    return () => {
      window.clearTimeout(freezeTimer.current);
      window.removeEventListener("site-theme-change", refresh);
      motionPreference.removeEventListener("change", refresh);
    };
  }, []);

  const image = FRACTALS[theme];

  return (
    <div className={styles.fractal}>
      <Link href="/fractals" className={styles.fractalClip} aria-label="Open the fractal generator">
        {src && (
          <img
            src={src}
            alt=""
            width={image.width}
            height={image.height}
            className={`${theme === "dark" ? styles.darkFractalImage : ""} ${ready ? styles.fractalImageReady : ""}`}
            onLoad={(event) => {
              setReady(true);
              if (!event.currentTarget.src.includes(image.gif)) return;
              window.clearTimeout(freezeTimer.current);
              freezeTimer.current = window.setTimeout(() => {
                setSrc(image.still);
              }, image.duration);
            }}
          />
        )}
      </Link>
    </div>
  );
}
