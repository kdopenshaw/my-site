import type { ReactNode } from "react";

import HomeFractal from "./home-fractal";
import styles from "./home.module.css";

type HomeExperienceProps = {
  children: ReactNode;
};

export default function HomeExperience({ children }: HomeExperienceProps) {
  return (
    <div className={styles.homeExperience}>
      <section className={styles.fractalOpening} aria-label="Animated Julia fractal">
        <div className={styles.fractalMedia} aria-hidden="true">
          <HomeFractal />
        </div>
      </section>

      <section
        className={styles.introduction}
        id="introduction"
        aria-labelledby="home-heading"
      >
        <div className={styles.introductionContent}>{children}</div>
      </section>
    </div>
  );
}
