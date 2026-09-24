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

export function randomPalette(count: number) {
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
