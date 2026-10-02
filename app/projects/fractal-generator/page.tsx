// Fractal generator. URL: /fractals
// The studio is a client component because drawing happens in the browser.

import styles from "./page.module.css";
import FractalStudio from "./fractal-studio";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fractal Generator | Keith Openshaw",
  description: "Explore and render escape-time fractals from their mathematical parameters.",
};

export default function FractalsPage() {
  return (
    <div className={styles.page}>
      <h1>Fractal Generator</h1>
      <FractalStudio />
    </div>
  );
}
