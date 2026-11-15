export interface Accent {
  /** Main accent color, e.g. "#e63946". */
  accent: string;
  /** Readable text/icon color to put on top of the accent. */
  onAccent: string;
}

const DARK_TEXT = '#0b0f0d';
const LIGHT_TEXT = '#ffffff';

const HUE_BINS = 24;
/** The dominant hue must cover at least this share of the logo's opaque pixels. */
const MIN_COVERAGE = 0.03;
/** Fixed saturation/lightness keep any brand hue bright enough on the dark theme. */
const ACCENT_SATURATION = 0.85;
const ACCENT_LIGHTNESS = 0.58;

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const sector = Math.floor(h / 60) % 6;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][sector];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

const toHex = (channels: number[]) =>
  `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`;

function luminance([r, g, b]: number[]): number {
  const [lr, lg, lb] = [r, g, b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/**
 * Picks the club's accent color from RGBA pixels (as returned by getImageData):
 * finds the most common vivid hue, ignoring transparent, gray, near-black and
 * near-white pixels. Returns null when the logo has no clear color.
 */
export function pickAccent(pixels: ArrayLike<number>): Accent | null {
  const weight = new Array<number>(HUE_BINS).fill(0);
  const hueSum = new Array<number>(HUE_BINS).fill(0);
  const count = new Array<number>(HUE_BINS).fill(0);
  let opaque = 0;

  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 200) continue;
    opaque++;
    const [h, s, l] = rgbToHsl(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (s < 0.4 || l < 0.2 || l > 0.85) continue;
    const bin = Math.min(HUE_BINS - 1, Math.floor((h / 360) * HUE_BINS));
    const vividness = s * (1 - Math.abs(2 * l - 1));
    weight[bin] += vividness;
    hueSum[bin] += h * vividness;
    count[bin]++;
  }
  if (opaque === 0) return null;

  let best = 0;
  for (let bin = 1; bin < HUE_BINS; bin++) if (weight[bin] > weight[best]) best = bin;
  if (count[best] / opaque < MIN_COVERAGE) return null;

  const rgb = hslToRgb(hueSum[best] / weight[best], ACCENT_SATURATION, ACCENT_LIGHTNESS);
  return {
    accent: toHex(rgb),
    onAccent: luminance(rgb) > 0.4 ? DARK_TEXT : LIGHT_TEXT,
  };
}
