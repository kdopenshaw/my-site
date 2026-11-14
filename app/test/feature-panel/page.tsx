import type { Metadata } from "next";

import styles from "./feature-panel.module.css";

export const metadata: Metadata = {
  title: "Feature panel | Keith Openshaw",
  description: "Test of a title, description, and fading image panel.",
};

export default function FeaturePanelTestPage() {
  return (
    <div className={styles.page}>
      <a className={styles.panel} href="/projects/fractal-generator">
        <p className={styles.copy}>
          <span className={styles.title}>Fractal Generator</span>
          <span className={styles.description}>
            Explore and render escape-time fractals from their mathematical parameters.
          </span>
        </p>
        <div className={styles.media} aria-hidden="true">
          <img
            className={styles.light}
            src="/fractals/julia-growth-light-last.png"
            alt=""
            width={1000}
            height={1000}
          />
          <img
            className={styles.dark}
            src="/fractals/julia-growth-dark-last.png"
            alt=""
            width={1000}
            height={1000}
          />
        </div>
      </a>
    </div>
  );
}
