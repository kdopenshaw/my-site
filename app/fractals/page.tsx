import FractalStudio from "./fractal-studio";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fractal Generator | Keith Openshaw",
  description: "Explore and render escape-time fractals from their mathematical parameters.",
};

export default function FractalsPage() {
  return (
    <main className="fractal-page">
      <h1>Fractal Generator</h1>
      <FractalStudio />
    </main>
  );
}
