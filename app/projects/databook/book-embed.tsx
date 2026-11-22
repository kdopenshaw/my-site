"use client";

import { useEffect, useRef } from "react";

const palette = {
  "--dbk-fg": "--color-heading",
  "--dbk-muted": "--color-text",
  "--dbk-surface": "--color-surface",
  "--dbk-border": "--color-border",
  "--dbk-grid": "--color-border",
  "--dbk-accent": "--color-primary",
  "--dbk-series-1": "--color-primary",
} as const;

export function BookEmbed({ src }: { src: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    let resize: ResizeObserver | undefined;

    const syncTheme = () => {
      const parent = document.documentElement;
      const child = frame.contentDocument?.documentElement;
      if (!child) return;
      const styles = getComputedStyle(parent);
      for (const [target, source] of Object.entries(palette)) {
        child.style.setProperty(target, styles.getPropertyValue(source));
      }
      child.classList.toggle("dark", parent.dataset.theme === "dark");
    };

    const connect = () => {
      resize?.disconnect();
      syncTheme();
      const root = frame.contentDocument?.getElementById("root");
      if (!root) return;
      resize = new ResizeObserver(([entry]) => {
        const height = Math.ceil(entry.contentRect.height);
        if (height > 0) frame.style.height = `${height}px`;
      });
      resize.observe(root);
    };

    connect();
    frame.addEventListener("load", connect);
    window.addEventListener("site-theme-change", syncTheme);
    return () => {
      resize?.disconnect();
      frame.removeEventListener("load", connect);
      window.removeEventListener("site-theme-change", syncTheme);
    };
  }, []);

  return <iframe ref={frameRef} src={src} title="Pokémon by the numbers, an interactive DataBook" />;
}
