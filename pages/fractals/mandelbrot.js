// pages/fractals/mandelbrot.js
import Navigation from "../../components/Navigation";
import FractalNav from "../../components/FractalNav";
import s from "../../styles/fractals.module.css";
import { useState, useEffect, useRef } from "react";
import chroma from "chroma-js";

export default function Mandelbrot() {
  const [colors, setColors] = useState({
    color1: "#000000",
    color2: "#2a4d69",
    color3: "#b0c4de",
    color4: "#ffd700",
  });

  const presets = [
    { name: "🌫️ Dark Mist", colors: { color1: "#111111", color2: "#2a4d69", color3: "#b0c4de", color4: "#ffd700" } },
    { name: "🌅 Sunset", colors: { color1: "#200000", color2: "#ff4500", color3: "#ffd700", color4: "#ffffff" } },
    { name: "🌊 Ocean", colors: { color1: "#000000", color2: "#006666", color3: "#66ffff", color4: "#ffffff" } },
    { name: "🌲 Forest", colors: { color1: "#000000", color2: "#004d00", color3: "#66ff66", color4: "#ffffff" } },
    { name: "🔥 Fire", colors: { color1: "#000000", color2: "#8B0000", color3: "#FF4500", color4: "#FFD700" } },
  ];
  const [activePreset, setActivePreset] = useState(0);

  const [quality, setQuality] = useState("normal");
  const [maxIterations, setMaxIterations] = useState(500);
  const canvasRef = useRef(null);
  const [isRendering, setIsRendering] = useState(false);

  const handlePresetClick = (preset, index) => {
    setColors(preset.colors);
    setActivePreset(index);
  };

  const getCanvasDimensions = (quality, userMaxIter) => {
    switch (quality) {
      case "high":
        return { width: 1800, height: 1200, displayWidth: 750, displayHeight: 500, maxIter: userMaxIter };
      case "4k":
        return { width: 3000, height: 2000, displayWidth: 900, displayHeight: 600, maxIter: userMaxIter };
      default: // normal
        return { width: 600, height: 400, displayWidth: 600, displayHeight: 400, maxIter: userMaxIter };
    }
  };

  // Smooth Mandelbrot escape calculation
  const mandelbrotPoint = (cx, cy, maxIterations, bailout = 4.0) => {
    let x = 0,
      y = 0;
    let x2 = 0,
      y2 = 0;
    let iteration = 0;

    while (iteration < maxIterations && x2 + y2 <= bailout) {
      y = 2 * x * y + cy;
      x = x2 - y2 + cx;
      x2 = x * x;
      y2 = y * y;
      iteration++;
    }

    if (iteration === maxIterations) {
      return 0; // inside set
    }

    const magnitude = Math.sqrt(x2 + y2);
    const logMag = Math.log(magnitude);
    return iteration + 1 - Math.log(logMag / Math.log(2)) / Math.log(2);
  };

  // Normalize with 98th percentile + gamma
  const normalizeData = (divTime, gamma = 0.85) => {
    const sorted = divTime.filter((v) => v > 0).sort((a, b) => a - b);
    if (sorted.length === 0) return divTime.map(() => 0);

    const q98 = sorted[Math.floor(sorted.length * 0.98)];
    const range = q98;

    return divTime.map((val) => {
      if (val === 0) return 0;
      return Math.pow(Math.min(1, val / range), gamma);
    });
  };

  const createColorScale = (colors, steps = 2048) => {
    return chroma.scale([colors.color1, colors.color2, colors.color3, colors.color4]).mode("lch").correctLightness(true).colors(steps);
  };

  const pixelToComplex = (px, py, width, height) => {
    const cx = -2.5 + (px / width) * 3.5;
    const cy = -1.25 + (py / height) * 2.5;
    return { cx, cy };
  };

  const handleRender = () => {
    setIsRendering(true);

    // Let React update the button/spinner first
    setTimeout(() => {
      if (!canvasRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const { width, height, displayWidth, displayHeight, maxIter } = getCanvasDimensions(quality, maxIterations);

      // Internal resolution (high pixel density)
      canvas.width = width;
      canvas.height = height;

      // Display size (small on screen)
      canvas.style.width = displayWidth + "px";
      canvas.style.height = displayHeight + "px";

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Compute escape values
      const divTime = new Float64Array(width * height);
      for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
          const { cx, cy } = pixelToComplex(px, py, width, height);
          divTime[py * width + px] = mandelbrotPoint(cx, cy, maxIterations);
        }
      }

      // Normalize + build color scale
      const normalized = normalizeData(Array.from(divTime));
      const colorScale = createColorScale(colors);

      // Write pixels
      for (let i = 0; i < normalized.length; i++) {
        const colorIndex = Math.floor(normalized[i] * (colorScale.length - 1));
        const rgb = chroma(colorScale[colorIndex]).rgb();
        const pixelIndex = i * 4;
        data[pixelIndex] = rgb[0];
        data[pixelIndex + 1] = rgb[1];
        data[pixelIndex + 2] = rgb[2];
        data[pixelIndex + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);

      // Overlay info
      const overlay = document.getElementById("infoOverlay");
      if (overlay) {
        overlay.textContent = `Mandelbrot | ${width}×${height} | ${maxIterations} iter`;
      }
      setIsRendering(false);
    }, 0); // yield to event loop
  };

  const handleDownload = () => {
    if (!canvasRef.current) {
      alert("Please render a fractal first!");
      return;
    }
    const canvas = canvasRef.current;
    const dataURL = canvas.toDataURL("image/png", 1.0);
    const downloadLink = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadLink.download = `mandelbrot-${timestamp}.png`;
    downloadLink.href = dataURL;
    downloadLink.click();
  };

  useEffect(() => {
    handleRender();
  }, []); // render once on mount

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
            <div className={s.fractalControls}>
              {/* Colors */}
              <div>
                <h3 className={s.heading3}>Colors</h3>
                <div className={s.colorRow}>
                  <input type="color" className={s.colorInput} value={colors.color1} onChange={(e) => setColors({ ...colors, color1: e.target.value })} title="Inner Color" />
                  <input type="color" className={s.colorInput} value={colors.color2} onChange={(e) => setColors({ ...colors, color2: e.target.value })} title="Color 2" />
                  <input type="color" className={s.colorInput} value={colors.color3} onChange={(e) => setColors({ ...colors, color3: e.target.value })} title="Color 3" />
                  <input type="color" className={s.colorInput} value={colors.color4} onChange={(e) => setColors({ ...colors, color4: e.target.value })} title="Color 4" />
                </div>
                <div className={s.presetRow}>
                  {presets.map((preset, index) => (
                    <button key={index} className={activePreset === index ? s.presetBtnActive : s.presetBtn} onClick={() => handlePresetClick(preset, index)}>
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameters */}
              <div>
                <h3 className={s.heading3}>Parameters</h3>
                <label className={s.fractalControlsLabel}>
                  Quality
                  <select
                    value={quality}
                    onChange={(e) => {
                      const q = e.target.value;
                      setQuality(q);

                      if (q === "high") setMaxIterations(800);
                      else if (q === "4k") setMaxIterations(2500);
                      else setMaxIterations(500); // normal
                    }}
                    className={s.fractalControlsSelect}
                  >
                    <option value="normal">Normal (600×400)</option>
                    <option value="high">High (1800×1200)</option>
                    <option value="4k">4K (3000×2000)</option>
                  </select>
                </label>

                <label className={s.fractalControlsLabel}>
                  Iterations
                  <input type="number" value={maxIterations} onChange={(e) => setMaxIterations(parseInt(e.target.value))} min="100" max="5000" className={s.fractalControlsNumber} />
                </label>
              </div>

              {/* Actions */}
              <div className={s.fractalActions}>
                <button onClick={handleRender} className={s.fractalButton} disabled={isRendering}>
                  {isRendering && <span className={s.spinner}></span>}
                  {isRendering ? "" : "Render"}
                </button>
                <button onClick={handleDownload} className={s.fractalButton}>
                  Download
                </button>
              </div>
            </div>

            {/* RIGHT SIDE: Canvas */}
            <div className={s.canvasContainer} style={{ position: "relative" }}>
              <canvas ref={canvasRef} className={s.fractalCanvas} />
              <div id="infoOverlay" className={s.infoOverlay}></div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
