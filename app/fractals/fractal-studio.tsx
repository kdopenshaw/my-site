"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import styles from "./fractal-studio.module.css";
import { randomPalette, resampleColors } from "./colors";
import { ConfigLabel, FractalEquation, NumberField, RangeField, stopLabel } from "./fields";
import FractalGallery from "./fractal-gallery";
import {
  PALETTES,
  PRESETS,
  RESOLUTION_PRESETS,
  colorsFor,
  randomStartingFractal,
  type FractalParameters,
  type PresetKey,
} from "./presets";

const MIN_RASTER_SIZE = 64;
const MAX_RASTER_SIZE = 1_200;
const FAST_RENDER_WORK = 50_000_000;
const MAX_RENDER_WORK = 200_000_000;
const MIN_COLOR_STOPS = 2;
const MAX_COLOR_STOPS = 8;

export default function FractalStudio() {
  const [parameters, setParameters] = useState<FractalParameters>(() => ({
    ...PRESETS.mandelbrot.parameters,
    colors: [...PRESETS.mandelbrot.parameters.colors],
  }));
  const [presetKey, setPresetKey] = useState<PresetKey>("mandelbrot");
  const [isPresetPickerOpen, setIsPresetPickerOpen] = useState(false);
  const [isAspectLocked, setIsAspectLocked] = useState(true);
  const [status, setStatus] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasRenderedImage, setHasRenderedImage] = useState(false);
  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const aspectRatioRef = useRef(parameters.width / parameters.height);
  const renderedParametersRef = useRef<FractalParameters | null>(null);
  const presetPickerRef = useRef<HTMLDivElement>(null);
  const activeColors = colorsFor(parameters);
  const resolutionPresetKey = Object.entries(RESOLUTION_PRESETS).find(([, resolution]) => (
    resolution.width === parameters.width && resolution.height === parameters.height
  ))?.[0] ?? "custom";
  const pixelCount = parameters.width * parameters.height;
  const estimatedWork = pixelCount * parameters.iterations;
  const isWithinWorkLimit = estimatedWork <= MAX_RENDER_WORK;
  const isSlowRender = estimatedWork > FAST_RENDER_WORK && isWithinWorkLimit;
  const usesFixedConstant = parameters.family === "julia";
  const usesEscapeRadius = parameters.family !== "newton";

  const update = <K extends keyof FractalParameters>(key: K, value: FractalParameters[K]) => {
    setParameters((current) => ({ ...current, [key]: value }));
  };

  const choosePreset = (key: PresetKey) => {
    setPresetKey(key);
    aspectRatioRef.current = PRESETS[key].parameters.width / PRESETS[key].parameters.height;
    setParameters({ ...PRESETS[key].parameters, colors: [...PRESETS[key].parameters.colors] });
    setIsPresetPickerOpen(false);
  };

  const updateRaster = (dimension: "width" | "height", value: number) => {
    setParameters((current) => {
      const nextValue = Math.round(value);
      if (!isAspectLocked) return { ...current, [dimension]: nextValue };

      const ratio = aspectRatioRef.current;
      const width = dimension === "width" ? nextValue : Math.round(nextValue * ratio);
      const height = dimension === "height" ? nextValue : Math.round(nextValue / ratio);

      return { ...current, width, height };
    });
  };

  const toggleAspectLock = () => {
    setIsAspectLocked((isLocked) => {
      if (!isLocked) aspectRatioRef.current = parameters.width / parameters.height;
      return !isLocked;
    });
  };

  const chooseResolution = (key: string) => {
    if (!(key in RESOLUTION_PRESETS)) return;
    const resolution = RESOLUTION_PRESETS[key as keyof typeof RESOLUTION_PRESETS];
    aspectRatioRef.current = resolution.width / resolution.height;
    setParameters((current) => ({
      ...current,
      width: resolution.width,
      height: resolution.height,
    }));
  };

  const setCustomColors = (colors: string[]) => {
    setParameters((current) => ({ ...current, palette: "custom", colors }));
  };

  const choosePalette = (palette: string) => {
    if (palette === "custom") {
      setCustomColors(activeColors);
      return;
    }
    const selectedPalette = PALETTES[palette];
    if (!selectedPalette) return;
    setParameters((current) => ({ ...current, palette, colors: [...selectedPalette.colors] }));
  };

  const updateColor = (index: number, color: string) => {
    setCustomColors(activeColors.map((currentColor, colorIndex) => (
      colorIndex === index ? color : currentColor
    )));
  };

  const renderFractal = async (nextParameters: FractalParameters) => {
    const requestId = ++requestRef.current;
    setIsRendering(true);
    setStatus("");
    const colors = colorsFor(nextParameters);
    // These names match the arguments of api/fractal.py.
    // That function rejects unknown palette names, so a custom palette sends
    // a known name plus the real stops in `colors`.
    const query = new URLSearchParams({
      family: nextParameters.family,
      power: String(nextParameters.power),
      c_real: String(nextParameters.cReal),
      c_imag: String(nextParameters.cImag),
      center_x: String(nextParameters.centerX),
      center_y: String(nextParameters.centerY),
      scale: String(nextParameters.scale),
      iterations: String(nextParameters.iterations),
      escape_radius: String(nextParameters.escapeRadius),
      gamma: String(nextParameters.gamma),
      width: String(nextParameters.width),
      height: String(nextParameters.height),
      palette: nextParameters.palette === "custom" ? "ocean_reef" : nextParameters.palette,
      colors: colors.join(","),
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
      renderedParametersRef.current = nextParameters;
      setHasRenderedImage(true);
      setStatus("");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The render could not be completed.");
    } finally {
      if (requestId === requestRef.current) setIsRendering(false);
    }
  };

  const render = (event: FormEvent) => {
    event.preventDefault();
    void renderFractal(parameters);
  };

  const downloadFractal = () => {
    const canvas = canvasRef.current;
    const renderedParameters = renderedParametersRef.current;
    if (!canvas || !renderedParameters) return;

    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus("The rendered image could not be prepared for download.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${renderedParameters.family}-${renderedParameters.width}x${renderedParameters.height}.png`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
    }, "image/png");
  };

  const addToGallery = async () => {
    const canvas = canvasRef.current;
    const renderedParameters = renderedParametersRef.current;
    if (!canvas || !renderedParameters || isPublishing) return;

    setIsPublishing(true);
    setStatus("Preparing your gallery image…");

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((image) => {
          if (image) resolve(image);
          else reject(new Error("The rendered image could not be prepared."));
        }, "image/png");
      });
      const form = new FormData();
      form.set("image", blob, `${renderedParameters.family}.png`);
      form.set("metadata", JSON.stringify(renderedParameters));

      const response = await fetch("/api/fractal-gallery", { method: "POST", body: form });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "The fractal could not be added to the gallery.");

      setStatus("Added to the community gallery.");
      setGalleryRefreshKey((key) => key + 1);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The fractal could not be added to the gallery.");
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    if (!isPresetPickerOpen) return undefined;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!presetPickerRef.current?.contains(event.target as Node)) {
        setIsPresetPickerOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPresetPickerOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isPresetPickerOpen]);

  useEffect(() => {
    // React runs effects twice in development. Only request the first image once.
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const startingFractal = randomStartingFractal();
    setPresetKey(startingFractal.presetKey);
    aspectRatioRef.current = startingFractal.parameters.width / startingFractal.parameters.height;
    setParameters(startingFractal.parameters);
    void renderFractal(startingFractal.parameters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let workClassName = "";
  if (!isWithinWorkLimit) workClassName = styles.isOverLimit;
  else if (isSlowRender) workClassName = styles.isSlow;

  return (
    <>
      <form className={styles.studio} onSubmit={render}>
        <aside className={styles.controlPanel} aria-label="Fractal configuration">
          <div className={styles.equationWrap}>
            <div className={styles.equationBar}>
              <FractalEquation family={parameters.family} power={parameters.power} />
            </div>
          </div>

          <div className={styles.configSheet} aria-label="Fractal variables">
            <div role="group" aria-labelledby="fractal-label-i" className={`${styles.configGroup} ${styles.familySection}`}>
              <ConfigLabel index="I" title="Family" diagram="/fractals/help/family.svg" help="Chooses a known definition and replaces every control with its matching exponent, constant, viewport, orbit, resolution, and palette values." />
              <div className={styles.familyPicker} ref={presetPickerRef}>
                <button
                  type="button"
                  className={styles.familyChoice}
                  aria-expanded={isPresetPickerOpen}
                  aria-label={`Choose fractal family. Current selection: ${PRESETS[presetKey].label}`}
                  onClick={() => setIsPresetPickerOpen((open) => !open)}
                >
                  <span>
                    <b>{PRESETS[presetKey].label}</b>
                    <small>{PRESETS[presetKey].detail}</small>
                  </span>
                  <span className={styles.familyChoiceSection} aria-hidden="true">⌄</span>
                </button>
                {isPresetPickerOpen && (
                  <div className={styles.familyPopover}>
                    <p className={styles.familyMenuLabel}>Choose a definition</p>
                    {(Object.entries(PRESETS) as [PresetKey, (typeof PRESETS)[PresetKey]][]).map(([key, preset]) => (
                      <button
                        key={key}
                        type="button"
                        className={styles.presetItem}
                        aria-current={presetKey === key ? "true" : undefined}
                        onClick={() => choosePreset(key)}
                      >
                        <img src={preset.thumbnail} alt="" width="74" height="48" />
                        <span className={styles.presetItemContent}>
                          <span>{preset.label}</span>
                          <small>{preset.detail}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={`${styles.configPair} ${styles.configPairNumbers}`}>
              <div role="group" aria-labelledby="fractal-label-ii" className={styles.configGroup}>
                <ConfigLabel index="II" title={<>Exponent <i>p</i></>} diagram="/fractals/help/exponent.svg" help="Sets the exponent in the recurrence. Larger powers change the rotational symmetry and number of major lobes." />
                <NumberField label={<>Power <i>p</i></>} value={parameters.power} min={2} max={8} step={1} onChange={(value) => update("power", value)} />
              </div>

              <div role="group" aria-labelledby="fractal-label-iii" className={styles.configGroup}>
                <div className={styles.rasterHeadingRow}>
                  <ConfigLabel index="III" title="Resolution" diagram="/fractals/help/raster.svg" help="Sets the width and height of the output image in pixels. More pixels reveal finer detail, but increase render time and file size." />
                  <button
                    type="button"
                    className={styles.aspectLock}
                    aria-pressed={isAspectLocked}
                    aria-label={`${isAspectLocked ? "Unlock" : "Lock"} aspect ratio`}
                    title="Lock aspect ratio"
                    onClick={toggleAspectLock}
                  >
                    <span className={styles.aspectIcon} aria-hidden="true" />
                  </button>
                </div>
                <div className={`${styles.numberRow} ${styles.numberRowTwo}`}>
                  <NumberField label={<>width <i>w</i></>} value={parameters.width} min={MIN_RASTER_SIZE} max={MAX_RASTER_SIZE} step={1} onChange={(value) => updateRaster("width", value)} />
                  <NumberField label={<>height <i>h</i></>} value={parameters.height} min={MIN_RASTER_SIZE} max={MAX_RASTER_SIZE} step={1} onChange={(value) => updateRaster("height", value)} />
                </div>
                <div className={styles.resolutionTools}>
                  <select
                    aria-label="Resolution preset"
                    className={styles.selectInput}
                    value={resolutionPresetKey}
                    onChange={(event) => chooseResolution(event.target.value)}
                  >
                    {Object.entries(RESOLUTION_PRESETS).map(([value, resolution]) => (
                      <option key={value} value={value}>{resolution.label}</option>
                    ))}
                    <option value="custom">Custom resolution</option>
                  </select>
                  <output className={workClassName}>
                    {(pixelCount / 1_000_000).toFixed(2)} MP · {(estimatedWork / 1_000_000).toFixed(1)}M tests
                  </output>
                </div>
              </div>
            </div>

            <div className={styles.configPair}>
              <div role="group" aria-labelledby="fractal-label-iv" className={styles.configGroup}>
                <ConfigLabel index="IV" title={<>Constant <i>c</i></>} diagrams={[
                  { src: "/fractals/help/constant-real.svg", label: "Real part — horizontal change" },
                  { src: "/fractals/help/constant-imaginary.svg", label: "Imaginary part — vertical change" },
                ]} help={usesFixedConstant
                  ? "Changing either coordinate of c transforms the Julia set's topology, not merely its position."
                  : parameters.family === "newton"
                    ? "Newton's method solves z raised to p minus one, so this family does not use the constant c."
                    : "This family assigns c from each point in the complex plane, so a separate fixed constant is not used."} />
                <RangeField label={<>Re(<i>c</i>)</>} value={parameters.cReal} min={-2} max={2} step={0.001} digits={3} disabled={!usesFixedConstant} onChange={(value) => update("cReal", value)} />
                <RangeField label={<>Im(<i>c</i>)</>} value={parameters.cImag} min={-2} max={2} step={0.001} digits={3} disabled={!usesFixedConstant} onChange={(value) => update("cImag", value)} />
              </div>

              <div role="group" aria-labelledby="fractal-label-v" className={styles.configGroup}>
                <ConfigLabel index="V" title="Orbit" diagrams={[
                  { src: "/fractals/help/orbit-iterations.svg", label: "Iterations — boundary detail" },
                  { src: "/fractals/help/orbit-escape.svg", label: "Escape radius — orbit threshold" },
                  { src: "/fractals/help/orbit-gamma.svg", label: "Gamma — tonal distribution" },
                ]} help={parameters.family === "newton"
                  ? "Iterations set the convergence budget and gamma shapes basin brightness. Newton fractals converge to roots instead of escaping a radius."
                  : "These values change how the same orbit is classified and shaded: test duration, escape threshold, and the curve applied to its color value."} />
                <RangeField label="iterations" value={parameters.iterations} min={10} max={1000} step={1} onChange={(value) => update("iterations", value)} />
                <RangeField label={<>escape |<i>z</i>|</>} value={parameters.escapeRadius} min={2} max={100} step={0.1} digits={1} disabled={!usesEscapeRadius} onChange={(value) => update("escapeRadius", value)} />
                <RangeField label={<>gamma <i>γ</i></>} value={parameters.gamma} min={0.1} max={5} step={0.1} digits={1} onChange={(value) => update("gamma", value)} />
              </div>
            </div>

            <div role="group" aria-labelledby="fractal-label-vi" className={`${styles.configGroup} ${styles.plane}`}>
              <ConfigLabel index="VI" title="Complex plane" diagrams={[
                { src: "/fractals/help/plane-x.svg", label: "Center x — pan horizontally" },
                { src: "/fractals/help/plane-y.svg", label: "Center y — pan vertically" },
                { src: "/fractals/help/plane-scale.svg", label: "Scale — zoom the viewport" },
              ]} help="Center x and y pan across the complex plane. Scale changes the span of the viewport: a smaller value reveals a tighter, magnified region." />
              <div className={styles.numberRow}>
                <NumberField label={<><i>x</i><sub>0</sub></>} value={parameters.centerX} min={-10} max={10} step="any" onChange={(value) => update("centerX", value)} />
                <NumberField label={<><i>y</i><sub>0</sub></>} value={parameters.centerY} min={-10} max={10} step="any" onChange={(value) => update("centerY", value)} />
                <NumberField label="scale" value={parameters.scale} min={0.000001} max={20} step="any" onChange={(value) => update("scale", value)} />
              </div>
            </div>

            <div role="group" aria-labelledby="fractal-label-vii" className={`${styles.configGroup} ${styles.color}`}>
              <ConfigLabel index="VII" title="Color function" diagram="/fractals/help/color.svg" help={parameters.family === "newton"
                ? "Assigns palette colors to the roots and uses convergence speed for brightness. Choose a preset or edit the stops."
                : "Maps normalized escape time to color. Choose a preset or edit the stops to create a continuous palette."} />
              <label className={styles.paletteSelect}>
                <span className={styles.fieldLabel}>Palette preset</span>
                <select
                  className={styles.selectInput}
                  value={parameters.palette}
                  onChange={(event) => choosePalette(event.target.value)}
                >
                  {Object.entries(PALETTES).map(([value, palette]) => (
                    <option key={value} value={value}>{palette.label}</option>
                  ))}
                  <option value="custom">Custom palette</option>
                </select>
              </label>
              <div className={styles.paletteEditor}>
                <div className={styles.colorToolbar}>
                  <div className={styles.colorRamp} style={{ background: `linear-gradient(90deg, ${activeColors.join(", ")})` }} aria-hidden="true" />
                  <div className={styles.colorTools} aria-label="Color stop tools">
                    <button type="button" onClick={() => setCustomColors(resampleColors(activeColors, activeColors.length - 1))} disabled={activeColors.length <= MIN_COLOR_STOPS} aria-label="Remove a color stop" title="Remove color">−</button>
                    <output aria-live="polite">{activeColors.length}</output>
                    <button type="button" onClick={() => setCustomColors(resampleColors(activeColors, activeColors.length + 1))} disabled={activeColors.length >= MAX_COLOR_STOPS} aria-label="Add a color stop" title="Add color">+</button>
                    <button type="button" className={styles.colorRandomize} onClick={() => setCustomColors(randomPalette(activeColors.length))} aria-label="Randomize colors" title="Randomize colors">
                      <span aria-hidden="true">↻</span> Randomize
                    </button>
                  </div>
                </div>
                <div className={styles.colorStops}>
                  {activeColors.map((color, index) => (
                    <div className={styles.colorStop} key={`${parameters.palette}-${index}`}>
                      <input
                        className={styles.colorSwatch}
                        type="color"
                        value={color}
                        aria-label={`Palette color ${index + 1}`}
                        onChange={(event) => updateColor(index, event.target.value)}
                      />
                      <code>{color.toUpperCase()}</code>
                      <small>{stopLabel(index, activeColors.length)}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.controlFooter}>
            {status && <output className={styles.renderStatus} aria-live="polite">{status}</output>}
            {isSlowRender && <p className={styles.workWarning}>This combination may take longer to render.</p>}
            {!isWithinWorkLimit && <p className={styles.workWarning}>Reduce resolution or iterations to stay below 200M tests.</p>}
            <div className={styles.controlActions}>
              <button
                className={`button ${styles.generate} ${isRendering ? styles.isRendering : ""}`}
                type="submit"
                disabled={isRendering || !isWithinWorkLimit}
                aria-label={isRendering ? "Generating fractal" : undefined}
              >
                {isRendering ? (
                  <span className={styles.generatingIndicator} aria-hidden="true" />
                ) : (
                  <><span>Generate fractal</span><b aria-hidden="true">↗</b></>
                )}
              </button>
              <button className={`button-outline ${styles.download}`} type="button" disabled={!hasRenderedImage || isRendering} onClick={downloadFractal}>
                <span>Download</span>
                <b aria-hidden="true">↓</b>
              </button>
            </div>
          </div>
        </aside>
        <div className={styles.preview}>
          <div className={styles.canvasFrame} aria-busy={isRendering}>
            <canvas ref={canvasRef} aria-label="Generated fractal" />
            {isRendering && (
              <div className={styles.canvasLoading} role="status" aria-live="polite">
                <span className={styles.canvasSpinner} aria-hidden="true" />
                <span>Creating your fractal…</span>
              </div>
            )}
          </div>
          <div className={styles.previewActions} aria-label="Rendered fractal actions">
            <button
              className="button"
              type="button"
              onClick={() => void addToGallery()}
              disabled={!hasRenderedImage || isRendering || isPublishing}
            >
              {isPublishing ? "Adding…" : "Add to gallery"}
            </button>
          </div>
        </div>
      </form>
      <FractalGallery refreshKey={galleryRefreshKey} />
    </>
  );
}
