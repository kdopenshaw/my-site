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
  ];
  const [activePreset, setActivePreset] = useState(0);

  const canvasRef = useRef(null);

  const handlePresetClick = (preset, index) => {
    setColors(preset.colors);
    setActivePreset(index);
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
                <input
                  type="color"
                  className={s.colorInput}
                  value={colors.color1}
                  onChange={(e) =>
                    setColors({ ...colors, color1: e.target.value })
                  }
                  title="Inner Color"
                />
                <input
                  type="color"
                  className={s.colorInput}
                  value={colors.color2}
                  onChange={(e) =>
                    setColors({ ...colors, color2: e.target.value })
                  }
                  title="Color 2"
                />

                <input
                  type="color"
                  className={s.colorInput}
                  value={colors.color3}
                  onChange={(e) =>
                    setColors({ ...colors, color3: e.target.value })
                  }
                  title="Color 3"
                />

                <input
                  type="color"
                  className={s.colorInput}
                  value={colors.color4}
                  onChange={(e) =>
                    setColors({ ...colors, color4: e.target.value })
                  }
                  title="Color 4"
                />
              </div>
              <div>
                <div className={s.presetRow}>
                  {presets.map((preset, index) => (
                    <button
                      key={index}
                      className={
                        activePreset === index ? s.presetBtnActive : s.presetBtn
                      }
                      onClick={() => handlePresetClick(preset, index)}
                    >
                      {preset.name}
                    </button>
                  ))}
                  ;
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: Canvas */}
            <div className={s.canvasContainer}>
              <canvas
                ref={canvasRef}
                className={s.fractalCanvas}
                width={600}
                height={400}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
