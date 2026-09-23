"use client";

import styles from "./fractal-studio.module.css";
import { ActionIcon, Button, ColorInput, Menu, NumberInput, Select, Slider } from "@mantine/core";
import { useEffect, useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import FractalGallery from "./fractal-gallery";

type Family = "mandelbrot" | "julia" | "burning_ship" | "tricorn" | "newton";

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

const RESOLUTION_PRESETS = {
  preview: { label: "Preview · 480 × 293", width: 480, height: 293 },
  standard: { label: "Standard · 720 × 440", width: 720, height: 440 },
  square: { label: "Square · 560 × 560", width: 560, height: 560 },
} as const;

const MIN_RASTER_SIZE = 64;
const MAX_RASTER_SIZE = 1_200;
const FAST_RENDER_WORK = 50_000_000;
const MAX_RENDER_WORK = 200_000_000;
const MIN_COLOR_STOPS = 2;
const MAX_COLOR_STOPS = 8;

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
  burningShip: {
    label: "Burning Ship",
    detail: "(|Re z| + i|Im z|)² + c",
    thumbnail: "/fractals/burning-ship.png",
    parameters: { family: "burning_ship", power: 2, cReal: 0, cImag: 0, centerX: -0.5, centerY: -0.5, scale: 3.2, iterations: 120, escapeRadius: 2, gamma: 0.85, width: 720, height: 440, palette: "inferno", colors: [...PALETTES.inferno.colors] },
  },
  tricorn: {
    label: "Tricorn",
    detail: "z̄² + c",
    thumbnail: "/fractals/tricorn.png",
    parameters: { family: "tricorn", power: 2, cReal: 0, cImag: 0, centerX: 0, centerY: 0, scale: 3.2, iterations: 140, escapeRadius: 2, gamma: 0.9, width: 720, height: 440, palette: "cosmic_dust", colors: [...PALETTES.cosmic_dust.colors] },
  },
  newton: {
    label: "Newton fractal",
    detail: "Newton iteration for z³ − 1",
    thumbnail: "/fractals/newton.png",
    parameters: { family: "newton", power: 3, cReal: 0, cImag: 0, centerX: 0, centerY: 0, scale: 3.2, iterations: 40, escapeRadius: 2, gamma: 0.75, width: 720, height: 440, palette: "gist_ncar", colors: [...PALETTES.gist_ncar.colors] },
  },
} satisfies Record<string, Preset>;

type PresetKey = keyof typeof PRESETS;

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomStartingFractal() {
  const presetKey = randomItem(Object.keys(PRESETS) as PresetKey[]);
  const palette = randomItem(Object.keys(PALETTES));

  return {
    presetKey,
    parameters: {
      ...PRESETS[presetKey].parameters,
      palette,
      colors: [...PALETTES[palette].colors],
    },
  };
}

function hexToRgb(color: string) {
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255] as const;
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")}`;
}

function interpolateColor(start: string, end: string, amount: number) {
  const startRgb = hexToRgb(start);
  const endRgb = hexToRgb(end);
  return rgbToHex(
    startRgb[0] + (endRgb[0] - startRgb[0]) * amount,
    startRgb[1] + (endRgb[1] - startRgb[1]) * amount,
    startRgb[2] + (endRgb[2] - startRgb[2]) * amount,
  );
}

function resampleColors(colors: string[], count: number) {
  return Array.from({ length: count }, (_, index) => {
    const position = (index / (count - 1)) * (colors.length - 1);
    const startIndex = Math.floor(position);
    const endIndex = Math.min(startIndex + 1, colors.length - 1);
    return interpolateColor(colors[startIndex], colors[endIndex], position - startIndex);
  });
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));
  const [red, green, blue] = segment < 1 ? [chroma, secondary, 0]
    : segment < 2 ? [secondary, chroma, 0]
      : segment < 3 ? [0, chroma, secondary]
        : segment < 4 ? [0, secondary, chroma]
          : segment < 5 ? [secondary, 0, chroma]
            : [chroma, 0, secondary];
  const match = l - chroma / 2;
  return rgbToHex((red + match) * 255, (green + match) * 255, (blue + match) * 255);
}

function randomPalette(count: number) {
  const hue = Math.floor(Math.random() * 360);
  const direction = Math.random() > 0.5 ? 1 : -1;
  const sweep = 35 + Math.floor(Math.random() * 146);

  return Array.from({ length: count }, (_, index) => {
    const position = index / (count - 1);
    const stopHue = (hue + direction * sweep * position + 360) % 360;
    const saturation = 52 + Math.round(28 * Math.sin(position * Math.PI));
    const lightness = 7 + Math.round(position * 82);
    return hslToHex(stopHue, saturation, lightness);
  });
}

function NumberField({ label, value, step, min, max, onChange }: {
  label: ReactNode;
  value: number;
  step: number | "any";
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const inputStep = step === "any" ? 0.000001 : step;

  return (
    <div className={styles.numberField}>
      <label className={styles.fieldLabel} htmlFor={id}>{label}</label>
      <NumberInput
        id={id}
        classNames={{ input: styles.numberInput }}
        value={value}
        step={inputStep}
        min={min}
        max={max}
        hideControls
        onChange={(nextValue) => {
          if (typeof nextValue === "number") onChange(nextValue);
          else if (nextValue === "") onChange(0);
          else {
            const parsed = Number(nextValue);
            if (Number.isFinite(parsed)) onChange(parsed);
          }
        }}
      />
    </div>
  );
}

function RangeField({ label, value, step, min, max, digits = 0, disabled = false, onChange }: {
  label: ReactNode;
  value: number;
  step: number;
  min: number;
  max: number;
  digits?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const labelId = useId();

  return (
    <div className={`${styles.rangeField} ${disabled ? styles.isDisabled : ""}`}>
      <div className={styles.rangeLabel} id={labelId}>
        <span>{label}</span>
        <output>{value.toFixed(digits).replace("-", "−")}</output>
      </div>
      <Slider
        className={styles.rangeSlider}
        aria-labelledby={labelId}
        value={value}
        step={step}
        min={min}
        max={max}
        disabled={disabled}
        size="xs"
        onChange={onChange}
      />
    </div>
  );
}

function stopLabel(index: number, count: number) {
  if (index === 0) return "0";
  if (index === count - 1) return "1";
  if (count === 4) return index === 1 ? "⅓" : "⅔";
  return (index / (count - 1)).toFixed(2);
}

type HelpDiagram = { src: string; label?: string };

function ConfigLabel({ index, title, help, diagram, diagrams }: {
  index: string;
  title: ReactNode;
  help: string;
  diagram?: string;
  diagrams?: HelpDiagram[];
}) {
  const helpId = `fractal-help-${index.toLowerCase()}`;
  const helpDiagrams = diagrams ?? (diagram ? [{ src: diagram }] : []);
  return (
    <div className={styles.configLabel} tabIndex={0} aria-describedby={helpId}>
      <span className={styles.configIndex}>{index}</span>
      <span className={styles.configTitle} id={`fractal-label-${index.toLowerCase()}`}>{title}</span>
      <div className={styles.configHelp} id={helpId} role="tooltip">
        <div className={`${styles.configHelpVisuals} ${helpDiagrams.length > 1 ? styles.isGrid : ""}`}>
          {helpDiagrams.map(({ src, label }) => (
            <figure key={src}>
              <img src={src} alt="" width="240" height="104" />
              {label && <figcaption>{label}</figcaption>}
            </figure>
          ))}
        </div>
        <p>{help}</p>
      </div>
    </div>
  );
}

function FractalEquation({ family, power }: { family: Family; power: number }) {
  if (family === "newton") {
    return (
      <div className={`${styles.equation} ${styles.equationNewton}`} aria-label={`z sub n plus 1 equals z sub n minus the quantity z sub n to the power ${power} minus 1 divided by ${power} z sub n to the power ${power - 1}`}>
        <i>z</i><sub>n+1</sub><b>=</b><i>z</i><sub>n</sub><b>−</b>
        <span className={styles.equationFraction}>
          <span><i>z</i><sub>n</sub><sup>{power}</sup><b>−</b>1</span>
          <span><b>{power}</b><i>z</i><sub>n</sub><sup>{power - 1}</sup></span>
        </span>
      </div>
    );
  }

  if (family === "burning_ship") {
    return (
      <div className={`${styles.equation} ${styles.equationLong}`} aria-label={`z sub n plus 1 equals the quantity absolute real z sub n plus i absolute imaginary z sub n to the power ${power} plus c`}>
        <i>z</i><sub>n+1</sub><b>=</b>
        <span>(|Re(<i>z</i><sub>n</sub>)| + <i>i</i>|Im(<i>z</i><sub>n</sub>)|)</span>
        <sup>{power}</sup><b>+</b><i className={styles.equationConstant}>c</i>
      </div>
    );
  }

  return (
    <div className={styles.equation} aria-label={`z sub n plus 1 equals ${family === "tricorn" ? "the conjugate of " : ""}z sub n to the power ${power} plus c`}>
      <i>z</i><sub>n+1</sub><b>=</b>
      {family === "tricorn" ? <span className={styles.equationConjugate}><i>z</i></span> : <i>z</i>}
      <sub>n</sub><sup>{power}</sup><b>+</b><i className={styles.equationConstant}>c</i>
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
  const renderedParametersRef = useRef<FractalState | null>(null);
  const activeColors = parameters.palette === "custom"
    ? parameters.colors
    : PALETTES[parameters.palette]?.colors ?? parameters.colors;
  const resolutionPresetKey = Object.entries(RESOLUTION_PRESETS).find(([, resolution]) => (
    resolution.width === parameters.width && resolution.height === parameters.height
  ))?.[0] ?? "custom";
  const pixelCount = parameters.width * parameters.height;
  const estimatedWork = pixelCount * parameters.iterations;
  const isWithinWorkLimit = estimatedWork <= MAX_RENDER_WORK;
  const isSlowRender = estimatedWork > FAST_RENDER_WORK && isWithinWorkLimit;
  const usesFixedConstant = parameters.family === "julia";
  const usesEscapeRadius = parameters.family !== "newton";

  const update = <K extends keyof FractalState>(key: K, value: FractalState[K]) => {
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

      return {
        ...current,
        width,
        height,
      };
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

  const setCustomColors = (colors: string[]) => {
    setParameters((current) => ({ ...current, palette: "custom", colors }));
  };

  const addColor = () => {
    if (activeColors.length >= MAX_COLOR_STOPS) return;
    setCustomColors(resampleColors(activeColors, activeColors.length + 1));
  };

  const removeColor = () => {
    if (activeColors.length <= MIN_COLOR_STOPS) return;
    setCustomColors(resampleColors(activeColors, activeColors.length - 1));
  };

  const randomizeColors = () => {
    setCustomColors(randomPalette(activeColors.length));
  };

  const renderFractal = async (nextParameters: FractalState) => {
    const requestId = ++requestRef.current;
    setIsRendering(true);
    setStatus("");
    const colors = nextParameters.palette === "custom"
      ? nextParameters.colors
      : PALETTES[nextParameters.palette]?.colors ?? nextParameters.colors;
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

      const response = await fetch("/api/fractal-gallery", {
        method: "POST",
        body: form,
      });
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
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const startingFractal = randomStartingFractal();
    setPresetKey(startingFractal.presetKey);
    aspectRatioRef.current = startingFractal.parameters.width / startingFractal.parameters.height;
    setParameters(startingFractal.parameters);
    void renderFractal(startingFractal.parameters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <Menu
            opened={isPresetPickerOpen}
            onChange={setIsPresetPickerOpen}
            position="bottom-end"
            shadow="none"
            width={340}
            withinPortal={false}
          >
            <Menu.Target>
              <Button
                variant="default"
                fullWidth
                className={styles.familyChoice}
                classNames={{ section: styles.familyChoiceSection }}
                aria-label={`Choose fractal family. Current selection: ${PRESETS[presetKey].label}`}
                rightSection={<span aria-hidden="true">⌄</span>}
              >
                <span>
                  <b>{PRESETS[presetKey].label}</b>
                  <small>{PRESETS[presetKey].detail}</small>
                </span>
              </Button>
            </Menu.Target>
            <Menu.Dropdown className={styles.familyPopover}>
              <Menu.Label className={styles.familyMenuLabel}>Choose a definition</Menu.Label>
              {(Object.entries(PRESETS) as [PresetKey, Preset][]).map(([key, preset]) => (
                <Menu.Item
                  key={key}
                  className={styles.presetItem}
                  aria-current={presetKey === key ? "true" : undefined}
                  leftSection={<img src={preset.thumbnail} alt="" width="74" height="48" />}
                  onClick={() => choosePreset(key)}
                >
                  <span className={styles.presetItemContent}>
                    <span>{preset.label}</span>
                    <small>{preset.detail}</small>
                  </span>
                </Menu.Item>
              ))}
            </Menu.Dropdown>
          </Menu>
        </div>

        <div className={`${styles.configPair} ${styles.configPairNumbers}`}>
          <div role="group" aria-labelledby="fractal-label-ii" className={styles.configGroup}>
            <ConfigLabel index="II" title={<>Exponent <i>p</i></>} diagram="/fractals/help/exponent.svg" help="Sets the exponent in the recurrence. Larger powers change the rotational symmetry and number of major lobes." />
            <NumberField label={<>Power <i>p</i></>} value={parameters.power} min={2} max={8} step={1} onChange={(value) => update("power", value)} />
          </div>

          <div role="group" aria-labelledby="fractal-label-iii" className={styles.configGroup}>
            <div className={styles.rasterHeadingRow}>
              <ConfigLabel index="III" title="Resolution" diagram="/fractals/help/raster.svg" help="Sets the width and height of the output image in pixels. More pixels reveal finer detail, but increase render time and file size." />
              <ActionIcon
                variant="subtle"
                size="sm"
                className={styles.aspectLock}
                type="button"
                aria-pressed={isAspectLocked}
                aria-label={`${isAspectLocked ? "Unlock" : "Lock"} aspect ratio`}
                title="Lock aspect ratio"
                onClick={toggleAspectLock}
              >
                <span className={styles.aspectIcon} aria-hidden="true" />
              </ActionIcon>
            </div>
            <div className={`${styles.numberRow} ${styles.numberRowTwo}`}>
              <NumberField label={<>width <i>w</i></>} value={parameters.width} min={MIN_RASTER_SIZE} max={MAX_RASTER_SIZE} step={1} onChange={(value) => updateRaster("width", value)} />
              <NumberField label={<>height <i>h</i></>} value={parameters.height} min={MIN_RASTER_SIZE} max={MAX_RASTER_SIZE} step={1} onChange={(value) => updateRaster("height", value)} />
            </div>
            <div className={styles.resolutionTools}>
              <Select
                aria-label="Resolution preset"
                data={[
                  ...Object.entries(RESOLUTION_PRESETS).map(([value, resolution]) => ({ value, label: resolution.label })),
                  { value: "custom", label: "Custom resolution" },
                ]}
                value={resolutionPresetKey}
                onChange={(value) => { if (value) chooseResolution(value); }}
                allowDeselect={false}
                classNames={{ input: styles.selectInput, dropdown: styles.selectDropdown, option: styles.selectOption }}
              />
              <output className={!isWithinWorkLimit ? styles.isOverLimit : isSlowRender ? styles.isSlow : ""}>
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
          <Select
            label="Palette preset"
            data={[
              ...Object.entries(PALETTES).map(([value, palette]) => ({ value, label: palette.label })),
              { value: "custom", label: "Custom palette" },
            ]}
            value={parameters.palette}
            onChange={(value) => { if (value) choosePalette(value); }}
            allowDeselect={false}
            classNames={{ root: styles.paletteSelect, label: styles.fieldLabel, input: styles.selectInput, dropdown: styles.selectDropdown, option: styles.selectOption }}
          />
          <div className={styles.paletteEditor}>
            <div className={styles.colorToolbar}>
              <div className={styles.colorRamp} style={{ background: `linear-gradient(90deg, ${activeColors.join(", ")})` }} aria-hidden="true" />
              <div className={styles.colorTools} aria-label="Color stop tools">
                <ActionIcon variant="outline" size="sm" type="button" onClick={removeColor} disabled={activeColors.length <= MIN_COLOR_STOPS} aria-label="Remove a color stop" title="Remove color">−</ActionIcon>
                <output aria-live="polite">{activeColors.length}</output>
                <ActionIcon variant="outline" size="sm" type="button" onClick={addColor} disabled={activeColors.length >= MAX_COLOR_STOPS} aria-label="Add a color stop" title="Add color">+</ActionIcon>
                <Button variant="subtle" className={styles.colorRandomize} type="button" onClick={randomizeColors} aria-label="Randomize colors" title="Randomize colors">
                  <span aria-hidden="true">↻</span> Randomize
                </Button>
              </div>
            </div>
            <div className={styles.colorStops}>
              {activeColors.map((color, index) => (
                <div className={styles.colorStop} key={`${parameters.palette}-${index}`}>
                  <ColorInput
                    className={styles.colorInput}
                    size="xs"
                    format="hex"
                    withEyeDropper={false}
                    value={color}
                    aria-label={`Palette color ${index + 1}`}
                    classNames={{ input: styles.colorInputControl, dropdown: styles.colorInputDropdown, colorPreview: styles.colorInputPreview }}
                    onChange={(value) => updateColor(index, value)}
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
            <Button
              variant="filled"
              className={`${styles.generate} ${isRendering ? styles.isRendering : ""}`}
              type="submit"
              disabled={isRendering || !isWithinWorkLimit}
              aria-label={isRendering ? "Generating fractal" : undefined}
            >
              {isRendering ? (
                <span className={styles.generatingIndicator} aria-hidden="true" />
              ) : (
                <><span>Generate fractal</span><b aria-hidden="true">↗</b></>
              )}
            </Button>
            <Button variant="outline" className={styles.download} type="button" disabled={!hasRenderedImage || isRendering} onClick={downloadFractal}>
              <span>Download</span>
              <b aria-hidden="true">↓</b>
            </Button>
          </div>
        </div>
      </aside>
      <div className={styles.preview}>
        <div className={styles.canvasFrame}><canvas ref={canvasRef} aria-label="Generated fractal" /></div>
        <div className={styles.previewActions} aria-label="Rendered fractal actions">
          <Button
            variant="filled"
            type="button"
            onClick={() => void addToGallery()}
            disabled={!hasRenderedImage || isRendering || isPublishing}
          >
            {isPublishing ? "Adding…" : "Add to gallery"}
          </Button>
        </div>
      </div>
    </form>
    <FractalGallery refreshKey={galleryRefreshKey} />
    </>
  );
}
