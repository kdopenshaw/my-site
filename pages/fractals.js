// pages/fractals.js - Interactive page that calls your Python backend
import { useState } from "react";

export default function Fractals() {
  const [fractalData, setFractalData] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateFractal = async () => {
    setLoading(true);
    // This calls your Python function
    const response = await fetch("/api/generate-fractal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        iterations: 100,
        zoom: 1.0,
        centerX: 0,
        centerY: 0,
      }),
    });
    const data = await response.json();
    setFractalData(data);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <h1>Fractal Generator</h1>
      <button onClick={generateFractal} disabled={loading}>
        {loading ? "Generating..." : "Generate Mandelbrot Set"}
      </button>

      {fractalData && (
        <div>
          <h3>Generated Fractal</h3>
          <img
            src={`data:image/png;base64,${fractalData.image}`}
            alt="fractal"
          />
        </div>
      )}
    </div>
  );
}
