"use client";

// Plays the growth GIF once, then holds the last frame.
// Visitors who prefer reduced motion see the still image immediately.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import styles from "./home.module.css";

const GIF_SRC = "/fractals/julia_0.2841_0.01_20260921-154313_growth.gif";
const LAST_FRAME_SRC = "/fractals/julia_0.2841_0.01_20260921-154313_growth_last.png";
const PLAY_ONCE_MS = 4_950;

export default function HomeFractal() {
  const [src, setSrc] = useState(GIF_SRC);
  const freezeTimer = useRef<number>(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setSrc(LAST_FRAME_SRC);
      return;
    }

    setSrc(`${GIF_SRC}?play=${Date.now()}`);

    return () => window.clearTimeout(freezeTimer.current);
  }, []);

  return (
    <div className={styles.fractal}>
      <Link href="/fractals" className={styles.fractalClip} aria-label="Open the fractal generator">
        <img
          src={src}
          alt=""
          width={610}
          height={784}
          onLoad={(event) => {
            if (!event.currentTarget.src.includes(GIF_SRC)) return;
            window.clearTimeout(freezeTimer.current);
            freezeTimer.current = window.setTimeout(() => {
              setSrc(LAST_FRAME_SRC);
            }, PLAY_ONCE_MS);
          }}
        />
      </Link>
    </div>
  );
}
