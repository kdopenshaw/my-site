"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import styles from "./fractal-studio.module.css";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import PlaneControl from "./plane-control";
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
const SAVED_FAMILIES_KEY = "fractal-generator-saved-families";

type SavedFamily = {
  id: string;
  label: string;
  parameters: FractalParameters;
};

function readSavedFamilies(): SavedFamily[] {
  try {
    const stored = window.localStorage.getItem(SAVED_FAMILIES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as SavedFamily[];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (!entry || typeof entry.id !== "string" || typeof entry.label !== "string" || !entry.parameters) return [];
      return [{ ...entry, parameters: { ...entry.parameters, relax: entry.parameters.relax ?? 1 } }];
    });
  } catch {
    return [];
  }
}

function writeSavedFamilies(families: SavedFamily[]) {
  try {
    window.localStorage.setItem(SAVED_FAMILIES_KEY, JSON.stringify(families));
  } catch {
    // Storage can be unavailable; the in-memory list still works for this visit.
  }
}

export default function FractalStudio() {
  const [parameters, setParameters] = useState<FractalParameters>(() => ({
    ...PRESETS.mandelbrot.parameters,
    colors: [...PRESETS.mandelbrot.parameters.colors],
  }));
  const [presetKey, setPresetKey] = useState<string>("mandelbrot");
  const [savedFamilies, setSavedFamilies] = useState<SavedFamily[]>([]);
  const [familyName, setFamilyName] = useState("");
  const [isAspectLocked, setIsAspectLocked] = useState(true);
  const [status, setStatus] = useState("");
  const [renderError, setRenderError] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasRenderedImage, setHasRenderedImage] = useState(false);
  const [galleryRefreshKey, setGalleryRefreshKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const aspectRatioRef = useRef(parameters.width / parameters.height);
  const renderedParametersRef = useRef<FractalParameters | null>(null);
  const renderedImageRef = useRef<{ blob: Blob; proof: string } | null>(null);
  const activeColors = colorsFor(parameters);
  const resolutionPresetKey =
    Object.entries(RESOLUTION_PRESETS).find(
      ([, resolution]) =>
        resolution.width === parameters.width && resolution.height === parameters.height,
    )?.[0] ?? "custom";
  const pixelCount = parameters.width * parameters.height;
  const estimatedWork = pixelCount * parameters.iterations;
  const isWithinWorkLimit = estimatedWork <= MAX_RENDER_WORK;
  const isSlowRender = estimatedWork > FAST_RENDER_WORK && isWithinWorkLimit;
  const usesFixedConstant = parameters.family === "julia";
  const usesEscapeRadius = parameters.family !== "newton";
  const activePreset = (PRESETS as Record<string, (typeof PRESETS)[PresetKey]>)[presetKey];
  const activeSaved = savedFamilies.find((family) => family.id === presetKey);
  const baseline = activePreset?.parameters ?? activeSaved?.parameters;
  const canSaveFamily = Boolean(
    baseline &&
      (baseline.power !== parameters.power ||
        (usesFixedConstant &&
          (baseline.cReal !== parameters.cReal || baseline.cImag !== parameters.cImag))),
  );

  const update = <K extends keyof FractalParameters>(key: K, value: FractalParameters[K]) => {
    setParameters((current) => ({ ...current, [key]: value }));
  };

  const applyGallerySettings = (next: FractalParameters) => {
    const matches = (Object.entries(PRESETS) as [PresetKey, (typeof PRESETS)[PresetKey]][]).filter(
      ([, preset]) => preset.parameters.family === next.family,
    );
    const closest = matches.reduce<(typeof matches)[number] | null>((best, entry) => {
      if (!best) return entry;
      const distance = (preset: FractalParameters) =>
        Math.abs(preset.power - next.power) + Math.abs(preset.cReal - next.cReal) + Math.abs(preset.cImag - next.cImag);
      return distance(entry[1].parameters) < distance(best[1].parameters) ? entry : best;
    }, null);
    if (closest) setPresetKey(closest[0]);
    const loaded = { ...next, relax: next.relax ?? 1 };
    aspectRatioRef.current = loaded.width / Math.max(1, loaded.height);
    setParameters(loaded);
    setStatus("Gallery settings loaded into the generator.");
    void renderFractal(loaded);
    document.getElementById("fractal-studio")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const applyFamily = (key: string, next: FractalParameters) => {
    setPresetKey(key);
    setFamilyName("");
    aspectRatioRef.current = next.width / next.height;
    setParameters({ ...next, colors: [...next.colors] });
  };

  const choosePreset = (key: string) => {
    const preset = (PRESETS as Record<string, (typeof PRESETS)[PresetKey]>)[key];
    if (preset) {
      applyFamily(key, preset.parameters);
      return;
    }
    const saved = savedFamilies.find((family) => family.id === key);
    if (saved) applyFamily(key, saved.parameters);
  };

  const saveFamily = () => {
    const label = familyName.trim();
    if (!label || !canSaveFamily) return;
    const nextFamily: SavedFamily = {
      id: crypto.randomUUID(),
      label,
      parameters: { ...parameters, colors: [...parameters.colors] },
    };
    setSavedFamilies((current) => {
      const nextFamilies = [...current, nextFamily];
      writeSavedFamilies(nextFamilies);
      return nextFamilies;
    });
    setPresetKey(nextFamily.id);
    setFamilyName("");
    window.requestAnimationFrame(() => {
      document.querySelector(`.${styles.savedHeading}`)?.scrollIntoView({ block: "nearest" });
    });
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
    setCustomColors(
      activeColors.map((currentColor, colorIndex) => (colorIndex === index ? color : currentColor)),
    );
  };

  const renderFractal = async (nextParameters: FractalParameters) => {
    const requestId = ++requestRef.current;
    setIsRendering(true);
    setRenderError("");
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
      relax: String(nextParameters.relax ?? 1),
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
      const proof = response.headers.get("X-Fractal-Proof");
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      if (requestId !== requestRef.current) return;
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) throw new Error("Canvas is unavailable.");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      renderedParametersRef.current = nextParameters;
      renderedImageRef.current = proof ? { blob, proof } : null;
      setHasRenderedImage(true);
      setStatus("");
    } catch (error) {
      if (requestId === requestRef.current) {
        setRenderError(
          error instanceof Error ? error.message : "The render could not be completed.",
        );
      }
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
    const renderedParameters = renderedParametersRef.current;
    const renderedImage = renderedImageRef.current;
    if (!renderedParameters || isPublishing) return;
    if (!renderedImage) {
      setStatus("Gallery images have to come from the fractal generator.");
      return;
    }

    setIsPublishing(true);
    setStatus("Preparing your gallery image…");

    try {
      const form = new FormData();
      form.set("image", renderedImage.blob, `${renderedParameters.family}.png`);
      form.set("metadata", JSON.stringify(renderedParameters));
      form.set("proof", renderedImage.proof);

      const response = await fetch("/api/fractal-gallery", { method: "POST", body: form });
      const result = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(result?.error ?? "The fractal could not be added to the gallery.");

      setStatus("Added to the community gallery.");
      setGalleryRefreshKey((key) => key + 1);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "The fractal could not be added to the gallery.",
      );
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    setSavedFamilies(readSavedFamilies());
  }, []);

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
      <form id="fractal-studio" className={styles.studio} onSubmit={render}>
        <aside className={styles.familyRail} aria-label="Fractal family">
          <ConfigLabel
            index="I"
            title="Fractal family"
            diagram="/fractals/help/family.svg"
            help="Choose a definition to load its matching exponent, viewport, orbit, resolution, and palette values."
          />
          <RadioGroup
            value={presetKey}
            onValueChange={choosePreset}
            aria-labelledby="fractal-label-i"
            className={styles.familyList}
          >
            {(Object.entries(PRESETS) as [PresetKey, (typeof PRESETS)[PresetKey]][]).map(
              ([key, preset]) => (
                <div
                  key={key}
                  className={`${styles.familyOption} ${presetKey === key ? styles.selectedFamily : ""}`}
                >
                  <RadioGroupItem value={key} className={styles.familyChoice}>
                    <img src={preset.thumbnail} alt="" width="40" height="32" />
                    <span>{preset.label}</span>
                  </RadioGroupItem>
                </div>
              ),
            )}
          </RadioGroup>
          {savedFamilies.length > 0 && (
            <>
              <p className={styles.savedHeading}>Saved</p>
              <RadioGroup
                value={presetKey}
                onValueChange={choosePreset}
                aria-label="Saved fractal families"
                className={styles.familyList}
              >
                {savedFamilies.map((family) => (
                  <div
                    key={family.id}
                    className={`${styles.familyOption} ${presetKey === family.id ? styles.selectedFamily : ""}`}
                  >
                    <RadioGroupItem value={family.id} className={styles.familyChoice}>
                      <span>{family.label}</span>
                    </RadioGroupItem>
                  </div>
                ))}
              </RadioGroup>
            </>
          )}
        </aside>
        <div className={styles.preview}>
          <div className={styles.canvasFrame} aria-busy={isRendering}>
            <canvas ref={canvasRef} aria-label="Generated fractal" />
            {renderError && !isRendering && (
              <div className={styles.canvasMessage} data-has-image={hasRenderedImage} role="status">
                <p>{renderError}</p>
              </div>
            )}
            {isRendering && (
              <div
                className={styles.canvasLoading}
                role="status"
                aria-label="Loading fractal"
                aria-live="polite"
              >
                <span className={styles.canvasSpinner} aria-hidden="true" />
              </div>
            )}
          </div>
          {hasRenderedImage && (
            <div className={styles.previewActions} aria-label="Rendered fractal actions">
              <button
                className="button-outline"
                type="button"
                disabled={isRendering}
                onClick={downloadFractal}
              >
                Download ↓
              </button>
              <button
                className="button"
                type="button"
                onClick={() => void addToGallery()}
                disabled={isRendering || isPublishing}
              >
                {isPublishing ? "Adding…" : "Add to gallery"}
              </button>
            </div>
          )}
        </div>
        <div className={styles.equationBar}>
          <span className={`${styles.fieldLabel} ${styles.equationLabel}`}>Iteration rule</span>
          <FractalEquation family={parameters.family} power={parameters.power} />
          <NumberField
            label="exponent p"
            help={{
              label: "exponent p",
              src: "/fractals/help/exponent.svg",
              text: "Sets the exponent in the recurrence. Larger powers change the rotational symmetry and number of major lobes.",
            }}
            value={parameters.power}
            min={2}
            max={8}
            step={1}
            stepper
            onChange={(value) => update("power", value)}
          />
          {usesFixedConstant ? (
            <div className={styles.constantControls} role="group" aria-labelledby="fractal-label-iv">
              <ConfigLabel index="IV" title="Constant c" />
              <RangeField
                label="real"
                help={{
                  label: "real",
                  src: "/fractals/help/constant-real.svg",
                  text: "Slides the Julia constant along the real axis. The set stays mirror-symmetric. Near zero it is almost a disk; farther left it pinches into the two-bulb basilica, then breaks apart into dust.",
                }}
                value={parameters.cReal}
                min={-2}
                max={2}
                step={0.001}
                digits={3}
                maxDigits={5}
                onChange={(value) => update("cReal", value)}
              />
              <RangeField
                label="imaginary"
                help={{
                  label: "imaginary",
                  src: "/fractals/help/constant-imaginary.svg",
                  text: "Lifts c off the real axis. The horizontal mirror symmetry breaks and spirals appear. The opposite sign reflects the Julia set from top to bottom.",
                }}
                value={parameters.cImag}
                min={-2}
                max={2}
                step={0.001}
                digits={3}
                maxDigits={5}
                onChange={(value) => update("cImag", value)}
              />
            </div>
          ) : parameters.family === "newton" ? (
            <div className={styles.constantControls} role="group" aria-labelledby="fractal-label-iv">
              <ConfigLabel index="IV" title="Newton step" />
              <RangeField
                label="weight r"
                help={{
                  label: "weight r",
                  src: "/fractals/help/orbit.svg",
                  text: "Scales the Newton correction. 1 is the usual step toward a root. A lighter weight approaches more slowly. A heavier weight overshoots and tangles the boundaries between roots.",
                }}
                value={parameters.relax}
                min={0.2}
                max={2}
                step={0.05}
                digits={2}
                onChange={(value) => update("relax", value)}
              />
            </div>
          ) : (
            <div className={`${styles.constantControls} ${styles.constantIdle}`} role="group" aria-labelledby="fractal-label-iv">
              <ConfigLabel index="IV" title="Constant c" />
              <p className={styles.constantNote}>Each point on the plane is its own c.</p>
            </div>
          )}
          {canSaveFamily && (
            <div className={styles.saveFamily}>
              <input
                className={styles.numberInput}
                type="text"
                value={familyName}
                placeholder="Family name"
                aria-label="Saved family name"
                onChange={(event) => setFamilyName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  saveFamily();
                }}
              />
              <button
                className="button-outline"
                type="button"
                disabled={!familyName.trim()}
                onClick={saveFamily}
              >
                Save
              </button>
            </div>
          )}
        </div>
        <aside className={styles.controlPanel} aria-label="Fractal settings">
          <div role="group" aria-labelledby="fractal-label-v" className={`${styles.configGroup} ${styles.orbitGroup}`}>
            <ConfigLabel index="V" title="Orbit" />
            <div className={styles.orbitFields}>
            <RangeField
              label="iterations"
              help={{
                label: "iterations",
                src: "/fractals/help/orbit-iterations.svg",
                text: "How many steps each orbit may take. A low count paints a thick, smooth interior, including points that have not escaped yet. More steps let those slow points escape, so the interior shrinks onto the true set and fine filaments appear. Newton images use the same count to decide which root a point has reached.",
              }}
              value={parameters.iterations}
              min={20}
              max={400}
              step={1}
              onChange={(value) => update("iterations", value)}
            />
            <RangeField
              label={
                <>
                  escape |<i>z</i>|
                </>
              }
              help={{
                label: "Escape radius",
                src: "/fractals/help/orbit-escape.svg",
                text: usesEscapeRadius
                  ? "Sets the threshold at which an orbit is considered to escape."
                  : "Newton fractals converge to roots instead of escaping a radius; this control is not used.",
              }}
              value={parameters.escapeRadius}
              min={2}
              max={10}
              step={0.1}
              digits={1}
              disabled={!usesEscapeRadius}
              onChange={(value) => update("escapeRadius", value)}
            />
            <RangeField
              label={
                <>
                  gamma <i>γ</i>
                </>
              }
              help={{
                label: "Gamma",
                src: "/fractals/help/orbit-gamma.svg",
                text: "Changes the tonal curve applied to the orbit’s color value, shaping brightness and contrast.",
              }}
              value={parameters.gamma}
              min={0.5}
              max={2.2}
              step={0.1}
              digits={1}
              onChange={(value) => update("gamma", value)}
            />
            </div>
          </div>
          <div
            role="group"
            aria-labelledby="fractal-label-vi"
            className={`${styles.configGroup} ${styles.planeGroup}`}
          >
            <ConfigLabel
              index="VI"
              title="Complex plane"
              diagrams={[
                { src: "/fractals/help/plane-x.svg", label: "Center x — pan horizontally" },
                { src: "/fractals/help/plane-y.svg", label: "Center y — pan vertically" },
                { src: "/fractals/help/plane-scale.svg", label: "Scale — zoom the viewport" },
              ]}
              help="Center x and y pan across the complex plane. Scale changes the span of the viewport: a smaller value reveals a tighter, magnified region."
            />
            <PlaneControl
              key={`${presetKey}-${parameters.width}-${parameters.height}`}
              centerX={parameters.centerX}
              centerY={parameters.centerY}
              scale={parameters.scale}
              aspectRatio={
                Math.max(MIN_RASTER_SIZE, parameters.width) /
                Math.max(MIN_RASTER_SIZE, parameters.height)
              }
              onChange={(viewport) => setParameters((current) => ({ ...current, ...viewport }))}
            />
          </div>

          <div role="group" aria-labelledby="fractal-label-vii" className={`${styles.configGroup} ${styles.colorGroup}`}>
            <ConfigLabel
              index="VII"
              title="Color function"
              diagram="/fractals/help/color.svg"
              help={
                parameters.family === "newton"
                  ? "Assigns palette colors to the roots and uses convergence speed for brightness. Choose a preset or edit the stops."
                  : "Maps normalized escape time to color. Choose a preset or edit the stops to create a continuous palette."
              }
            />
            <div className={styles.paletteHeading}>
              <span className={styles.fieldLabel} id="palette-label">
                palette
              </span>
              <output>{PALETTES[parameters.palette]?.label ?? "Custom palette"}</output>
            </div>
            <RadioGroup
              aria-labelledby="palette-label"
              value={parameters.palette}
              onValueChange={choosePalette}
              className={styles.paletteChoices}
            >
              {Object.entries(PALETTES).map(([value, palette]) => (
                <RadioGroupItem
                  key={value}
                  value={value}
                  className={styles.paletteChoice}
                  aria-label={palette.label}
                  title={palette.label}
                  style={{
                    background: `linear-gradient(to bottom, ${palette.colors.map((color, index) => `${color} ${(index / palette.colors.length) * 100}% ${((index + 1) / palette.colors.length) * 100}%`).join(", ")})`,
                  }}
                />
              ))}
            </RadioGroup>
            <div className={styles.paletteEditor}>
              <div className={styles.colorToolbar}>
                <div
                  className={styles.colorRamp}
                  style={{ background: `linear-gradient(90deg, ${activeColors.join(", ")})` }}
                  aria-hidden="true"
                />
                <div className={styles.colorTools} aria-label="Color stop tools">
                  <button
                    type="button"
                    onClick={() =>
                      setCustomColors(resampleColors(activeColors, activeColors.length - 1))
                    }
                    disabled={activeColors.length <= MIN_COLOR_STOPS}
                    aria-label="Remove a color stop"
                    title="Remove color"
                  >
                    −
                  </button>
                  <output aria-live="polite">{activeColors.length}</output>
                  <button
                    type="button"
                    onClick={() =>
                      setCustomColors(resampleColors(activeColors, activeColors.length + 1))
                    }
                    disabled={activeColors.length >= MAX_COLOR_STOPS}
                    aria-label="Add a color stop"
                    title="Add color"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    className={styles.colorRandomize}
                    onClick={() => setCustomColors(randomPalette(activeColors.length))}
                    aria-label="Randomize colors"
                    title="Randomize colors"
                  >
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
          <div role="group" aria-labelledby="fractal-label-iii" className={`${styles.configGroup} ${styles.resolutionGroup}`}>
            <div className={styles.rasterHeadingRow}>
              <ConfigLabel
                index="III"
                title="Resolution"
                diagram="/fractals/help/raster.svg"
                help="Sets the width and height of the output image in pixels. More pixels reveal finer detail, but increase render time and file size."
              />
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
            <div className={styles.resolutionTools}>
              <RadioGroup
                aria-label="Resolution preset"
                value={resolutionPresetKey}
                onValueChange={chooseResolution}
                className={styles.resolutionOptions}
              >
                {Object.entries(RESOLUTION_PRESETS).map(([value, resolution]) => (
                  <RadioGroupItem
                    key={value}
                    value={value}
                    className={styles.resolutionChoice}
                    title={resolution.label}
                  >
                    {resolution.label.split(" · ")[0]}
                  </RadioGroupItem>
                ))}
              </RadioGroup>
              <div className={styles.rasterDimensions}>
                <NumberField
                  label={
                    <>
                      width <i>w</i>
                    </>
                  }
                  value={parameters.width}
                  min={MIN_RASTER_SIZE}
                  max={MAX_RASTER_SIZE}
                  step={1}
                  onChange={(value) => updateRaster("width", value)}
                />
                <NumberField
                  label={
                    <>
                      height <i>h</i>
                    </>
                  }
                  value={parameters.height}
                  min={MIN_RASTER_SIZE}
                  max={MAX_RASTER_SIZE}
                  step={1}
                  onChange={(value) => updateRaster("height", value)}
                />
              </div>
              <output className={workClassName}>
                {(pixelCount / 1_000_000).toFixed(2)} MP · {(estimatedWork / 1_000_000).toFixed(1)}M
                tests
              </output>
            </div>
            <div className={styles.controlFooter}>
            {status && (
              <output className={styles.renderStatus} aria-live="polite">
                {status}
              </output>
            )}
            {isSlowRender && (
              <p className={styles.workWarning}>This combination may take longer to render.</p>
            )}
            {!isWithinWorkLimit && (
              <p className={styles.workWarning}>
                Reduce resolution or iterations to stay below 200M tests.
              </p>
            )}
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
                  <>
                    <span>Generate fractal</span>
                    <b aria-hidden="true">↗</b>
                  </>
                )}
              </button>
            </div>
            </div>
          </div>
        </aside>
      </form>
      <FractalGallery refreshKey={galleryRefreshKey} onApplySettings={applyGallerySettings} />
    </>
  );
}
