"use client";

import { useEffect, useState } from "react";

import styles from "./navigation.module.css";

type Theme = "dark" | "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem("site-theme");
      } catch {
        // Storage may be unavailable; the system preference still applies.
      }
      const nextTheme = saved === "light" || saved === "dark"
        ? saved
        : systemPreference.matches ? "dark" : "light";
      document.documentElement.dataset.theme = nextTheme;
      setTheme(nextTheme);
      window.dispatchEvent(new Event("site-theme-change"));
    };

    syncTheme();
    systemPreference.addEventListener("change", syncTheme);
    return () => systemPreference.removeEventListener("change", syncTheme);
  }, []);

  const switchTheme = () => {
    const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    try {
      localStorage.setItem("site-theme", nextTheme);
    } catch {
      // The theme still works when storage is disabled.
    }
    setTheme(nextTheme);
    window.dispatchEvent(new Event("site-theme-change"));
  };

  return (
    <button
      type="button"
      className={styles.themeToggle}
      onClick={switchTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.5 14.1A8.5 8.5 0 0 1 9.9 3.5 8.5 8.5 0 1 0 20.5 14.1Z" />
        </svg>
      )}
    </button>
  );
}
