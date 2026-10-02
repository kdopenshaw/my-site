// Palette math for the color stops in the fractal form.
// A stop is one hex color. The renderer blends from stop to stop.

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

export function resampleColors(colors: string[], count: number) {
  return Array.from({ length: count }, (_, index) => {
    const position = (index / (count - 1)) * (colors.length - 1);
    const startIndex = Math.floor(position);
    const endIndex = Math.min(startIndex + 1, colors.length - 1);
    return interpolateColor(colors[startIndex], colors[endIndex], position - startIndex);
  });
}

function hueSegment(hue: number, chroma: number) {
  const segment = hue / 60;
  const secondary = chroma * (1 - Math.abs((segment % 2) - 1));

  if (segment < 1) return [chroma, secondary, 0];
  if (segment < 2) return [secondary, chroma, 0];
  if (segment < 3) return [0, chroma, secondary];
  if (segment < 4) return [0, secondary, chroma];
  if (segment < 5) return [secondary, 0, chroma];
  return [chroma, 0, secondary];
}

function hslToHex(hue: number, saturation: number, lightness: number) {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const [red, green, blue] = hueSegment(hue, chroma);
  const match = l - chroma / 2;
  return rgbToHex((red + match) * 255, (green + match) * 255, (blue + match) * 255);
}

// Standard hue intervals from a single base color. Analogous is a short arc;
// the others are the usual complementary, split-complementary, triadic, and square sets.
const HUE_HARMONIES = [
  [0],
  [0, 180],
  [0, 150, 210],
  [0, 120, 240],
  [0, 90, 180, 270],
] as const;

function randomInt(span: number) {
  return Math.floor(Math.random() * span);
}

export function randomPalette(count: number) {
  const stops = Math.max(count, 2);
  const base = randomInt(360);
  const harmony = HUE_HARMONIES[randomInt(HUE_HARMONIES.length)];
  const analogousSweep = 24 + randomInt(42);
  const saturation = 50 + randomInt(31);
  const lightStart = 16 + randomInt(24);
  const lightEnd = 64 + randomInt(24);
  const reverse = Math.random() > 0.5;

  return Array.from({ length: stops }, (_, index) => {
    const hue =
      harmony.length === 1
        ? base + (index / (stops - 1)) * analogousSweep
        : base + harmony[index % harmony.length] + randomInt(15) - 7;
    const position = reverse ? 1 - index / (stops - 1) : index / (stops - 1);
    return hslToHex(
      (hue + 360) % 360,
      Math.min(90, Math.max(42, saturation + randomInt(13) - 6)),
      lightStart + (lightEnd - lightStart) * position,
    );
  });
}
