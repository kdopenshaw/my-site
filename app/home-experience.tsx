"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";

import HomeFractal from "./home-fractal";
import styles from "./home.module.css";

type HomeExperienceProps = {
  children: ReactNode;
};

const CANCEL_KEYS = new Set([
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
  " ",
  "Enter",
  "Tab",
]);

export default function HomeExperience({ children }: HomeExperienceProps) {
  const introductionRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const eligibleRef = useRef(true);
  const completedRef = useRef(false);

  const cancelAutomaticScroll = useCallback(() => {
    eligibleRef.current = false;
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handlePlaybackComplete = useCallback(() => {
    if (!eligibleRef.current || completedRef.current) return;
    completedRef.current = true;

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null;
      if (!eligibleRef.current || window.scrollY > 1 || document.hidden) return;

      eligibleRef.current = false;
      introductionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 2000);
  }, []);

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    eligibleRef.current =
      window.location.hash === "" &&
      window.scrollY <= 1 &&
      !motionPreference.matches;

    const cancelForKey = (event: KeyboardEvent) => {
      if (CANCEL_KEYS.has(event.key)) cancelAutomaticScroll();
    };
    const cancelForScroll = () => {
      if (window.scrollY > 1) cancelAutomaticScroll();
    };
    const cancelForVisibility = () => {
      if (document.hidden) cancelAutomaticScroll();
    };
    const cancelForMotion = () => {
      if (motionPreference.matches) cancelAutomaticScroll();
    };

    window.addEventListener("wheel", cancelAutomaticScroll, { passive: true });
    window.addEventListener("touchstart", cancelAutomaticScroll, { passive: true });
    window.addEventListener("pointerdown", cancelAutomaticScroll, { passive: true });
    window.addEventListener("keydown", cancelForKey);
    window.addEventListener("scroll", cancelForScroll, { passive: true });
    window.addEventListener("homepage-navigation-open", cancelAutomaticScroll);
    document.addEventListener("visibilitychange", cancelForVisibility);
    motionPreference.addEventListener("change", cancelForMotion);

    const restorationCheck = window.requestAnimationFrame(() => {
      if (window.scrollY > 1) cancelAutomaticScroll();
    });

    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      window.cancelAnimationFrame(restorationCheck);
      window.removeEventListener("wheel", cancelAutomaticScroll);
      window.removeEventListener("touchstart", cancelAutomaticScroll);
      window.removeEventListener("pointerdown", cancelAutomaticScroll);
      window.removeEventListener("keydown", cancelForKey);
      window.removeEventListener("scroll", cancelForScroll);
      window.removeEventListener("homepage-navigation-open", cancelAutomaticScroll);
      document.removeEventListener("visibilitychange", cancelForVisibility);
      motionPreference.removeEventListener("change", cancelForMotion);
    };
  }, [cancelAutomaticScroll]);

  return (
    <div className={styles.homeExperience}>
      <section className={styles.fractalOpening} aria-label="Animated Julia fractal">
        <div className={styles.fractalMedia} aria-hidden="true">
          <HomeFractal onPlaybackComplete={handlePlaybackComplete} />
        </div>

        <a className={styles.introductionLink} href="#introduction">
          About me
        </a>
      </section>

      <section
        className={styles.introduction}
        id="introduction"
        ref={introductionRef}
        aria-labelledby="home-heading"
      >
        <div className={styles.introductionContent}>{children}</div>
      </section>
    </div>
  );
}
