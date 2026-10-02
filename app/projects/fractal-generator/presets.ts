// Starting points for the fractal generator.
// PRESETS is the Family menu. PALETTES is the color menu.
// Adding an entry here adds it to the form. The form does not have its own copy of this list.

export type FractalFamily = "mandelbrot" | "julia" | "burning_ship" | "tricorn" | "newton";

export type FractalParameters = {
  family: FractalFamily;
  power: number;
  cReal: number;
  cImag: number;
  centerX: number;
  centerY: number;
  scale: number;
  iterations: number;
  escapeRadius: number;
  gamma: number;
  relax: number;
  width: number;
  height: number;
  palette: string;
  colors: string[];
};

export type FractalPreset = {
  label: string;
  detail: string;
  thumbnail: string;
  parameters: FractalParameters;
};

export const PALETTES: Record<string, { label: string; colors: string[] }> = {
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

export const RESOLUTION_PRESETS = {
  preview: { label: "Preview · 480 × 293", width: 480, height: 293 },
  standard: { label: "Standard · 720 × 440", width: 720, height: 440 },
  square: { label: "Square · 560 × 560", width: 560, height: 560 },
} as const;

type PaletteName = keyof typeof PALETTES;

function parameters(
  values: Omit<FractalParameters, "colors" | "palette" | "relax"> & { palette: PaletteName; relax?: number },
): FractalParameters {
  return {
    ...values,
    relax: values.relax ?? 1,
    colors: [...PALETTES[values.palette].colors],
  };
}

export const PRESETS = {
  mandelbrot: {
    label: "Mandelbrot",
    detail: "z² + c",
    thumbnail: "/fractals/mandelbrot.svg",
    parameters: parameters({
      family: "mandelbrot",
      power: 2,
      cReal: -0.8,
      cImag: 0.156,
      centerX: -0.5,
      centerY: 0,
      scale: 3.2,
      iterations: 120,
      escapeRadius: 2,
      gamma: 1,
      width: 720,
      height: 440,
      palette: "ocean_reef",
    }),
  },
  julia: {
    label: "Classic Julia",
    detail: "c = −0.8 + .156i",
    thumbnail: "/fractals/classic-julia.svg",
    parameters: parameters({
      family: "julia",
      power: 2,
      cReal: -0.8,
      cImag: 0.156,
      centerX: 0,
      centerY: 0,
      scale: 3.2,
      iterations: 150,
      escapeRadius: 2,
      gamma: 1,
      width: 720,
      height: 440,
      palette: "ocean_reef",
    }),
  },
  multibrot3: {
    label: "Cubic Multibrot",
    detail: "z³ + c",
    thumbnail: "/fractals/cubic-multibrot.svg",
    parameters: parameters({
      family: "mandelbrot",
      power: 3,
      cReal: -0.8,
      cImag: 0.156,
      centerX: 0,
      centerY: 0,
      scale: 3,
      iterations: 120,
      escapeRadius: 2,
      gamma: 0.8,
      width: 720,
      height: 440,
      palette: "indigo_magenta_gold",
    }),
  },
  rabbit: {
    label: "Douady rabbit",
    detail: "c = −.123 + .745i",
    thumbnail: "/fractals/douady-rabbit.svg",
    parameters: parameters({
      family: "julia",
      power: 2,
      cReal: -0.123,
      cImag: 0.745,
      centerX: 0,
      centerY: 0,
      scale: 3,
      iterations: 150,
      escapeRadius: 2,
      gamma: 0.85,
      width: 720,
      height: 440,
      palette: "forest_ember",
    }),
  },
  dendrite: {
    label: "Dendrite Julia",
    detail: "c = i",
    thumbnail: "/fractals/dendrite-julia.svg",
    parameters: parameters({
      family: "julia",
      power: 2,
      cReal: 0,
      cImag: 1,
      centerX: 0,
      centerY: 0,
      scale: 3.2,
      iterations: 150,
      escapeRadius: 2,
      gamma: 0.9,
      width: 720,
      height: 440,
      palette: "arctic",
    }),
  },
  burningShip: {
    label: "Burning Ship",
    detail: "(|Re z| + i|Im z|)² + c",
    thumbnail: "/fractals/burning-ship.png",
    parameters: parameters({
      family: "burning_ship",
      power: 2,
      cReal: 0,
      cImag: 0,
      centerX: -0.5,
      centerY: -0.5,
      scale: 3.2,
      iterations: 120,
      escapeRadius: 2,
      gamma: 0.85,
      width: 720,
      height: 440,
      palette: "inferno",
    }),
  },
  tricorn: {
    label: "Tricorn",
    detail: "z̄² + c",
    thumbnail: "/fractals/tricorn.png",
    parameters: parameters({
      family: "tricorn",
      power: 2,
      cReal: 0,
      cImag: 0,
      centerX: 0,
      centerY: 0,
      scale: 3.2,
      iterations: 140,
      escapeRadius: 2,
      gamma: 0.9,
      width: 720,
      height: 440,
      palette: "cosmic_dust",
    }),
  },
  newton: {
    label: "Newton fractal",
    detail: "Newton iteration for z³ − 1",
    thumbnail: "/fractals/newton.png",
    parameters: parameters({
      family: "newton",
      power: 3,
      cReal: 0,
      cImag: 0,
      centerX: 0,
      centerY: 0,
      scale: 3.2,
      iterations: 40,
      escapeRadius: 2,
      gamma: 0.75,
      width: 720,
      height: 440,
      palette: "gist_ncar",
    }),
  },
} satisfies Record<string, FractalPreset>;

export type PresetKey = keyof typeof PRESETS;

function randomItem<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export function colorsFor(parameters: FractalParameters) {
  if (parameters.palette === "custom") return parameters.colors;
  return PALETTES[parameters.palette]?.colors ?? parameters.colors;
}

export function randomStartingFractal() {
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
