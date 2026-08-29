"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";

type Family = "mandelbrot" | "julia";

type FractalState = {
  family: Family;
  power: number;
  cReal: number;
  cImag: number;
  centerX: number;
  centerY: number;
  scale: number;
  iterations: number;
  escapeRadius: number;
  gamma: number;
  width: number;
  height: number;
  palette: string;
  colors: string[];
};

type Preset = {
  label: string;
  detail: string;
  thumbnail: string;
  parameters: FractalState;
};

const PALETTES: Record<string, { label: string; colors: string[] }> = {
  ocean_reef: { label: "Ocean reef", colors: ["#000022", "#004d4d", "#33ffff", "#e0f8e0"] },
  deep_sea_coral: { label: "Deep sea coral", colors: ["#0f2027", "#2c5f5d", "#ff7e67", "#ffa07a"] },
  forest_ember: { label: "Forest ember", colors: ["#0d1b0d", "#1a5d1a", "#ff6b35", "#ffd23f"] },
  cosmic_dust: { label: "Cosmic dust", colors: ["#0b0b1f", "#4b0082", "#c71585", "#ffb6c1"] },
  sunset: { label: "Sunset", colors: ["#200000", "#ff4500", "#ffd700"] },
  volcano_glow: { label: "Volcano glow", colors: ["#111111", "#990000", "#ff4500", "#ffd700"] },
  indigo_magenta_gold: { label: "Indigo, magenta & gold", colors: ["#0b0033", "#3040ff", "#ff40bf", "#ffd800"] },
  forest: { label: "Deep forest", colors: ["#000000", "#004d00", "#66ff66"] },
  forest4: { label: "Forest, lime & gold", colors: ["#000000", "#004d00", "#99cc33", "#ffd700"] },
  ocean: { label: "Teal ocean", colors: ["#000000", "#006666", "#66ffff"] },
  arctic: { label: "Arctic", colors: ["#ffffff", "#a0d8f1", "#001f3f"] },
  gold_white_charcoal: { label: "Gold, white & charcoal", colors: ["#ffffff", "#ffd700", "#333333"] },
  dark_mist: { label: "Dark mist", colors: ["#111111", "#2a4d69", "#b0c4de", "#ffd700"] },
  inferno: { label: "Inferno", colors: ["#000004", "#57106e", "#bc3754", "#f98e09", "#fcffa4"] },
  cividis: { label: "Cividis", colors: ["#00224e", "#495a6d", "#97895e", "#fee838"] },
  cubehelix: { label: "Cubehelix", colors: ["#000000", "#163e5a", "#965691", "#d6c49a", "#ffffff"] },
  gist_ncar: { label: "Spectrum", colors: ["#000080", "#00dcff", "#3cff00", "#ffe600", "#dc0000"] },
  monochrome: { label: "Monochrome", colors: ["#070c16", "#46586e", "#beccd8", "#ffffff"] },
};

const PRESETS = {
  mandelbrot: {
    label: "Mandelbrot",
    detail: "z² + c",
    thumbnail: "/fractals/mandelbrot.svg",
    parameters: { family: "mandelbrot", power: 2, cReal: -0.8, cImag: 0.156, centerX: -0.5, centerY: 0, scale: 3.2, iterations: 120, escapeRadius: 2, gamma: 1, width: 720, height: 440, palette: "ocean_reef", colors: [...PALETTES.ocean_reef.colors] },
  },
  julia: {
    label: "Classic Julia",
    detail: "c = −0.8 + .156i",
    thumbnail: "/fractals/classic-julia.svg",
    parameters: { family: "julia", power: 2, cReal: -0.8, cImag: 0.156, centerX: 0, centerY: 0, scale: 3.2, iterations: 150, escapeRadius: 2, gamma: 1, width: 720, height: 440, palette: "ocean_reef", colors: [...PALETTES.ocean_reef.colors] },
  },
  multibrot3: {
    label: "Cubic Multibrot",
    detail: "z³ + c",
    thumbnail: "/fractals/cubic-multibrot.svg",
    parameters: { family: "mandelbrot", power: 3, cReal: -0.8, cImag: 0.156, centerX: 0, centerY: 0, scale: 3, iterations: 120, escapeRadius: 2, gamma: 0.8, width: 720, height: 440, palette: "indigo_magenta_gold", colors: [...PALETTES.indigo_magenta_gold.colors] },
  },
  rabbit: {
    label: "Douady rabbit",
    detail: "c = −.123 + .745i",
    thumbnail: "/fractals/douady-rabbit.svg",
    parameters: { family: "julia", power: 2, cReal: -0.123, cImag: 0.745, centerX: 0, centerY: 0, scale: 3, iterations: 150, escapeRadius: 2, gamma: 0.85, width: 720, height: 440, palette: "forest_ember", colors: [...PALETTES.forest_ember.colors] },
  },
  dendrite: {
    label: "Dendrite Julia",
    detail: "c = i",
    thumbnail: "/fractals/dendrite-julia.svg",
    parameters: { family: "julia", power: 2, cReal: 0, cImag: 1, centerX: 0, centerY: 0, scale: 3.2, iterations: 150, escapeRadius: 2, gamma: 0.9, width: 720, height: 440, palette: "arctic", colors: [...PALETTES.arctic.colors] },
  },
} satisfies Record<string, Preset>;

type PresetKey = keyof typeof PRESETS;

function NumberField({ label, value, step, min, max, onChange }: {
  label: ReactNode;
  value: number;
  step: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="fractal-number-field">
      <span>{label}</span>
      <input type="number" value={value} step={step} min={min} max={max} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function RangeField({ label, value, step, min, max, digits = 0, onChange }: {
  label: ReactNode;
  value: number;
  step: number;
  min: number;
  max: number;
  digits?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="fractal-range-field">
      <span>{label}<output>{value.toFixed(digits).replace("-", "−")}</output></span>
      <input type="range" value={value} step={step} min={min} max={max} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function stopLabel(index: number, count: number) {
  if (index === 0) return "0";
  if (index === count - 1) return "1";
  if (count === 4) return index === 1 ? "⅓" : "⅔";
  return (index / (count - 1)).toFixed(2);
}

function ConfigHeading({ index, title, help, diagram }: {
  index: string;
  title: ReactNode;
  help: string;
  diagram: string;
}) {
  const helpId = `fractal-help-${index.toLowerCase()}`;
  return (
    <div className="fractal-config-heading" tabIndex={0} aria-describedby={helpId}>
      <span>{index}</span>
      <h2>{title}</h2>
      <div className="fractal-config-help" id={helpId} role="tooltip">
        <img src={diagram} alt="" width="240" height="104" />
        <p>{help}</p>
      </div>
    </div>
  );
}

export default function FractalStudio() {
  const [parameters, setParameters] = useState<FractalState>(() => ({
    ...PRESETS.mandelbrot.parameters,
    colors: [...PRESETS.mandelbrot.parameters.colors],
  }));
  const [presetKey, setPresetKey] = useState<PresetKey>("mandelbrot");
  const [isPresetPickerOpen, setIsPresetPickerOpen] = useState(false);
  const [status, setStatus] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef(0);
  const activeColors = parameters.palette === "custom"
    ? parameters.colors
    : PALETTES[parameters.palette]?.colors ?? parameters.colors;

  const update = <K extends keyof FractalState>(key: K, value: FractalState[K]) => {
    setParameters((current) => ({ ...current, [key]: value }));
  };

  const choosePreset = (key: PresetKey) => {
    setPresetKey(key);
    setParameters({ ...PRESETS[key].parameters, colors: [...PRESETS[key].parameters.colors] });
    setIsPresetPickerOpen(false);
  };

  const choosePalette = (palette: string) => {
    if (palette === "custom") {
      update("palette", palette);
      return;
    }
    const selectedPalette = PALETTES[palette];
    if (!selectedPalette) return;
    setParameters((current) => ({ ...current, palette, colors: [...selectedPalette.colors] }));
  };

  const updateColor = (index: number, color: string) => {
    setParameters((current) => ({
      ...current,
      palette: "custom",
      colors: activeColors.map((currentColor, colorIndex) => colorIndex === index ? color : currentColor),
    }));
  };

  const render = async (event?: FormEvent) => {
    event?.preventDefault();
    const requestId = ++requestRef.current;
    setIsRendering(true);
    setStatus("Calculating orbit paths…");
    const query = new URLSearchParams({
      family: parameters.family,
      power: String(parameters.power),
      c_real: String(parameters.cReal),
      c_imag: String(parameters.cImag),
      center_x: String(parameters.centerX),
      center_y: String(parameters.centerY),
      scale: String(parameters.scale),
      iterations: String(parameters.iterations),
      escape_radius: String(parameters.escapeRadius),
      gamma: String(parameters.gamma),
      width: String(parameters.width),
      height: String(parameters.height),
      palette: parameters.palette === "custom" ? "ocean_reef" : parameters.palette,
      colors: activeColors.join(","),
    });

    try {
      const response = await fetch(`/api/fractal?${query}`);
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        throw new Error(detail?.error ?? "The fractal service is unavailable in this preview.");
      }
      const bitmap = await createImageBitmap(await response.blob());
      if (requestId !== requestRef.current) return;
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) throw new Error("Canvas is unavailable.");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The render could not be completed.");
    } finally {
      if (requestId === requestRef.current) setIsRendering(false);
    }
  };

  useEffect(() => {
    void render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form className="fractal-studio" onSubmit={render}>
      <aside className="fractal-control-panel" aria-label="Fractal configuration">
        <div className="fractal-equation-wrap">
          <div className="fractal-equation-bar">
            <div className="fractal-equation" aria-label={`z sub n plus 1 equals z sub n to the power ${parameters.power} plus c`}>
              <i>z</i><sub>n+1</sub><b>=</b><i>z</i><sub>n</sub>
              <sup>{parameters.power}</sup>
              <b>+</b><i className="fractal-equation-constant">c</i>
            </div>
          </div>
        </div>

        <div className="fractal-config-sheet" aria-label="Fractal variables">
        <section className="fractal-config-group fractal-family-section">
          <ConfigHeading index="I" title="Family" diagram="/fractals/help/family.svg" help="Chooses a known definition and replaces every control with its matching exponent, constant, viewport, orbit, raster, and palette values." />
          <div className={`fractal-family-picker${isPresetPickerOpen ? " is-open" : ""}`} onKeyDown={(event) => {
            if (event.key === "Escape") setIsPresetPickerOpen(false);
          }}>
            <button
              className="fractal-family-choice"
              type="button"
              aria-expanded={isPresetPickerOpen}
              aria-controls="fractal-family-options"
              aria-label={`Choose fractal family. Current selection: ${PRESETS[presetKey].label}`}
              onClick={() => setIsPresetPickerOpen((isOpen) => !isOpen)}
            >
              <span>
                <b>{PRESETS[presetKey].label}</b>
                <small>{PRESETS[presetKey].detail}</small>
              </span>
              <strong aria-hidden="true">⌄</strong>
            </button>
            {isPresetPickerOpen && (
              <div className="fractal-family-popover" id="fractal-family-options">
                <p>Choose a definition</p>
                <div className="fractal-preset-grid">
                  {(Object.entries(PRESETS) as [PresetKey, Preset][]).map(([key, preset]) => (
                    <button type="button" key={key} aria-pressed={presetKey === key} onClick={() => choosePreset(key)}>
                      <img src={preset.thumbnail} alt="" width="74" height="48" />
                      <span>{preset.label}</span>
                      <small>{preset.detail}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="fractal-config-pair fractal-config-pair--numbers">
          <section className="fractal-config-group fractal-exponent">
            <ConfigHeading index="II" title={<>Exponent <i>p</i></>} diagram="/fractals/help/exponent.svg" help="Sets the exponent in the recurrence. Larger powers change the rotational symmetry and number of major lobes." />
            <NumberField label={<>Power <i>p</i></>} value={parameters.power} min={2} max={8} step={1} onChange={(value) => update("power", value)} />
          </section>

          <section className="fractal-config-group fractal-raster">
            <ConfigHeading index="III" title="Raster" diagram="/fractals/help/raster.svg" help="Sets the output dimensions. More pixels reveal finer detail, but increase render time and file size." />
            <div className="fractal-number-row fractal-number-row--two">
              <NumberField label={<>width <i>w</i></>} value={parameters.width} min={64} max={1200} step={40} onChange={(value) => update("width", value)} />
              <NumberField label={<>height <i>h</i></>} value={parameters.height} min={64} max={1200} step={40} onChange={(value) => update("height", value)} />
            </div>
          </section>
        </div>

        <div className="fractal-config-pair fractal-config-pair--ranges">
          <section className="fractal-config-group fractal-constants">
            <ConfigHeading index="IV" title={<>Constant <i>c</i></>} diagram="/fractals/help/constant.svg" help="Moves the complex constant. It reshapes a Julia set; Mandelbrot instead assigns the constant from each pixel." />
            <RangeField label={<>Re(<i>c</i>)</>} value={parameters.cReal} min={-2} max={2} step={0.001} digits={3} onChange={(value) => update("cReal", value)} />
            <RangeField label={<>Im(<i>c</i>)</>} value={parameters.cImag} min={-2} max={2} step={0.001} digits={3} onChange={(value) => update("cImag", value)} />
          </section>

          <section className="fractal-config-group fractal-orbit">
            <ConfigHeading index="V" title="Orbit" diagram="/fractals/help/orbit.svg" help="Controls how long each orbit is tested, the radius that counts as escape, and the gamma applied to escape-time values." />
            <RangeField label="iterations" value={parameters.iterations} min={10} max={1000} step={10} onChange={(value) => update("iterations", value)} />
            <RangeField label={<>escape |<i>z</i>|</>} value={parameters.escapeRadius} min={2} max={100} step={0.5} digits={1} onChange={(value) => update("escapeRadius", value)} />
            <RangeField label={<>gamma <i>γ</i></>} value={parameters.gamma} min={0.1} max={5} step={0.1} digits={1} onChange={(value) => update("gamma", value)} />
          </section>
        </div>

        <section className="fractal-config-group fractal-plane">
          <ConfigHeading index="VI" title="Complex plane" diagram="/fractals/help/plane.svg" help="Positions the viewport on the complex plane. Center moves the frame; scale controls how much is visible." />
          <div className="fractal-number-row">
            <NumberField label={<><i>x</i><sub>0</sub></>} value={parameters.centerX} step={0.05} onChange={(value) => update("centerX", value)} />
            <NumberField label={<><i>y</i><sub>0</sub></>} value={parameters.centerY} step={0.05} onChange={(value) => update("centerY", value)} />
            <NumberField label="scale" value={parameters.scale} min={0.000001} max={20} step={0.1} onChange={(value) => update("scale", value)} />
          </div>
        </section>

        <section className="fractal-config-group fractal-color">
          <ConfigHeading index="VII" title="Color function" diagram="/fractals/help/color.svg" help="Maps normalized escape time to color. Choose a preset or edit the stops to create a continuous palette." />
          <label className="fractal-palette-select">
            <span>Palette preset</span>
            <select
              key={parameters.palette}
              value={parameters.palette}
              onChange={(event) => choosePalette(event.target.value)}
              onInput={(event) => choosePalette(event.currentTarget.value)}
            >
              {Object.entries(PALETTES).map(([key, palette]) => <option value={key} key={key}>{palette.label}</option>)}
              <option value="custom">Custom palette</option>
            </select>
          </label>
          <div className="fractal-palette-editor">
            <div className="fractal-color-ramp" style={{ background: `linear-gradient(90deg, ${activeColors.join(", ")})` }} aria-hidden="true" />
            <div className="fractal-color-stops" style={{ "--fractal-color-count": activeColors.length } as CSSProperties}>
              {activeColors.map((color, index) => (
                <label key={`${parameters.palette}-${index}-${color}`}>
                  <span className="fractal-color-preview" style={{ backgroundColor: color }} />
                  <code>{color.toUpperCase()}</code>
                  <small>{stopLabel(index, activeColors.length)}</small>
                  <input type="color" value={color} aria-label={`Palette color ${index + 1}`} onChange={(event) => updateColor(index, event.target.value)} />
                </label>
              ))}
            </div>
          </div>
        </section>
        </div>

        <div className="fractal-control-footer">
          {status && <output className="fractal-render-status" aria-live="polite">{status}</output>}
          <button className="fractal-generate" type="submit" disabled={isRendering}>
            <span>{isRendering ? "Generating…" : "Generate fractal"}</span>
            <b aria-hidden="true">↗</b>
          </button>
        </div>
      </aside>
      <div className="fractal-canvas-frame"><canvas ref={canvasRef} aria-label="Generated fractal" /></div>
    </form>
  );
}
