// pages/fractals/mandelbrot.js
import Navigation from "../../components/Navigation";
import FractalNav from "../../components/FractalNav";
import s from "../../styles/fractals.module.css";
import { useState, useEffect, useRef } from "react";

export default function Mandelbrot() {
  const [colors, setColors] = useState({
    color1: "#000000",
    color2: "#2a4d69",
    color3: "#b0c4de",
    color4: "#ffd700",
  });

  // prettier-ignore
  const presets = [
  { name: '🌫️ Dark Mist', colors: { color1: '#111111', color2: '#2a4d69', color3: '#b0c4de', color4: '#ffd700' } },
  { name: '🌅 Sunset', colors: { color1: '#200000', color2: '#ff4500', color3: '#ffd700', color4: '#ffffff' } },
  { name: '🌊 Ocean', colors: { color1: '#000000', color2: '#006666', color3: '#66ffff', color4: '#ffffff' } },
  { name: '🌲 Forest', colors: { color1: '#000000', color2: '#004d00', color3: '#66ff66', color4: '#ffffff' } },
  { name: '🔥 Fire', colors: { color1: '#000000', color2: '#8B0000', color3: '#FF4500', color4: '#FFD700' } }
  ]
  const [activePreset, setActivePreset] = useState(0);

  const [quality, setQuality] = useState("normal");
  const [maxIterations, setMaxIterations] = useState(500);

  const canvasRef = useRef(null);

  const handlePresetClick = (preset, index) => {
    setColors(preset.colors);
    setActivePreset(index);
  };

  // Calculate if a point is in the Mandelbrot set
  const mandelbrotPoint = (cx, cy, maxIterations) => {
    // z starts at 0 + 0i (the origin)
    let x = 0,
      y = 0;
    let iteration = 0;

    // Keep iterating until we escape or hit max iterations
    while (iteration < maxIterations && x * x + y * y <= 4) {
      // Apply the Mandelbrot formula: z = z² + c
      // z² = (x + yi)² = x² - y² + 2xyi
      let xTemp = x * x - y * y + cx; // Real part
      y = 2 * x * y + cy; // Imaginary part
      x = xTemp;

      iteration++;
    }

    // Return number of iterations (higher = closer to the set)
    return iteration;
  };

  // Convert pixel coordinates to complex plane coordinates
  const pixelToComplex = (px, py, width, height) => {
    // Map canvas pixels to complex plane (centered on interesting area)
    const cx = -2.5 + (px / width) * 3.5; // Real axis: -2.5 to 1
    const cy = -1.25 + (py / height) * 2.5; // Imaginary axis: -1.25 to 1.25
    return { cx, cy };
  };

  // Convert iteration count to RGB color using our 4-color gradient
  const iterationsToColor = (iterations, maxIterations, colors) => {
    if (iterations === maxIterations) {
      // Point is in the set - use first color (usually black)
      return hexToRgb(colors.color1);
    }

    // Normalize iterations to 0-1 range
    const normalized = iterations / maxIterations;

    // Map to color stops: 0-0.33-0.66-1.0
    if (normalized < 0.33) {
      // Blend between color1 and color2
      const t = normalized / 0.33;
      return blendColors(hexToRgb(colors.color1), hexToRgb(colors.color2), t);
    } else if (normalized < 0.66) {
      // Blend between color2 and color3
      const t = (normalized - 0.33) / 0.33;
      return blendColors(hexToRgb(colors.color2), hexToRgb(colors.color3), t);
    } else {
      // Blend between color3 and color4
      const t = (normalized - 0.66) / 0.34;
      return blendColors(hexToRgb(colors.color3), hexToRgb(colors.color4), t);
    }
  };

  // Convert hex color to RGB object
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  };

  // Blend between two RGB colors
  const blendColors = (color1, color2, t) => {
    return {
      r: Math.round(color1.r + (color2.r - color1.r) * t),
      g: Math.round(color1.g + (color2.g - color1.g) * t),
      b: Math.round(color1.b + (color2.b - color1.b) * t),
    };
  };

  useEffect(() => {
    // Just run the initial render when component loads
    handleRender();
  }, []); // Still empty - only run once

  const handleRender = () => {
    console.log("Rendering fractal with:", { colors, quality, maxIterations });

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const width = canvas.width;
      const height = canvas.height;

      // Create an ImageData object (empty pixel grid in memory)
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data; // This is a flat array of RGBA values to edit

      // Loop through every pixel on the canvas
      for (let py = 0; py < height; py++) {
        // rows
        for (let px = 0; px < width; px++) {
          // columns
          // Convert pixel coordinates to complex plane coordinates
          const { cx, cy } = pixelToComplex(px, py, width, height);

          // Calculate Mandelbrot iterations for this point
          const iterations = mandelbrotPoint(cx, cy, maxIterations);

          // Convert iterations to a color (black and white for now)
          const rgbColor = iterationsToColor(iterations, maxIterations, colors);

          // Calculate position in the flat data array
          // Each pixel has 4 values: Red, Green, Blue, Alpha
          const pixelIndex = (py * width + px) * 4;

          // Set RGBA values
          data[pixelIndex] = rgbColor.r; // Red
          data[pixelIndex + 1] = rgbColor.g; // Green
          data[pixelIndex + 2] = rgbColor.b; // Blue
          data[pixelIndex + 3] = 255; // Alpha (fully opaque)
        }
      }

      // Draw the completed image data to the canvas
      ctx.putImageData(imageData, 0, 0);
    }
  };

  const handleDownload = () => {
    console.log("Download clicked!");
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <Navigation />

      <div className={s.page}>
        <header className={s.mainHeader}>
          <h1 className={s.heading1}>Fractal Explorer</h1>
          <FractalNav />
        </header>
        <main className={s.main}>
          <div className={s.fractalLayout}>
            {/* LEFT SIDE: Controls */}
            <div>
              <h3 className={s.heading3}>Colors</h3>
              <div className={s.colorRow}>
                <input type="color" className={s.colorInput} value={colors.color1} onChange={(e) => setColors({ ...colors, color1: e.target.value })} title="Inner Color" />
                <input type="color" className={s.colorInput} value={colors.color2} onChange={(e) => setColors({ ...colors, color2: e.target.value })} title="Color 2" />
                <input type="color" className={s.colorInput} value={colors.color3} onChange={(e) => setColors({ ...colors, color3: e.target.value })} title="Color 3" />
                <input type="color" className={s.colorInput} value={colors.color4} onChange={(e) => setColors({ ...colors, color4: e.target.value })} title="Color 4" />
              </div>
              <div>
                <div className={s.presetRow}>
                  {presets.map((preset, index) => (
                    <button key={index} className={activePreset === index ? s.presetBtnActive : s.presetBtn} onClick={() => handlePresetClick(preset, index)}>
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className={s.heading3}>Parameters</h3>

                <label className={s.fractalControlsLabel}>
                  Quality
                  <select value={quality} onChange={(e) => setQuality(e.target.value)} className={s.fractalControlsSelect}>
                    <option value="normal">Normal (1200×800)</option>
                    <option value="high">High (1920x1280)</option>
                    <option value="4k">4K (3840x2160)</option>
                  </select>
                </label>

                <label className={s.fractalControlsLabel}>
                  Iterations
                  <input type="number" value={maxIterations} onChange={(e) => setMaxIterations(parseInt(e.target.value))} min="100" max="5000" className={s.fractalControlsNumber} />
                </label>
              </div>
              <div className={s.fractalActions}>
                <button onClick={handleRender} className={s.fractalButton}>
                  Render
                </button>

                <button onClick={handleDownload} className={s.fractalButton}>
                  Download
                </button>
              </div>
            </div>

            {/* RIGHT SIDE: Canvas */}
            <div className={s.canvasContainer}>
              <canvas ref={canvasRef} className={s.fractalCanvas} width={600} height={400} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
