import { optimizeImage } from '@/api/image';

/** The pictures always use the dark palette, whatever theme the visitor has chosen. */
export const PALETTE = {
  bg: '#0b0f0d',
  surface: '#111814',
  border: '#223029',
  text: '#f2f5f0',
  muted: '#9aa59e',
};

export const BODY_FONT = '"Manrope Variable", system-ui, sans-serif';
export const DISPLAY_FONT = '"Unbounded Variable", sans-serif';

const IMAGE_TIMEOUT_MS = 8000;

/** Cuts the text and adds "…" until it fits `maxWidth` (measured by the given function). */
export function ellipsize(
  text: string,
  maxWidth: number,
  measure: (text: string) => number,
): string {
  if (measure(text) <= maxWidth) return text;
  let end = text.length;
  while (end > 1 && measure(`${text.slice(0, end).trimEnd()}…`) > maxWidth) end--;
  return `${text.slice(0, end).trimEnd()}…`;
}

/** Club colors come from the page itself (they are taken from the logo at runtime). */
export function readAccent() {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  const accent = read('--accent', '#ef3e39');
  return {
    accent,
    fill: read('--accent-fill', accent),
    onAccent: read('--on-accent', '#ffffff'),
  };
}

/**
 * Loads a picture for the canvas; resolves null when it cannot be loaded in time.
 * `tag` gives it a cache key of its own: a plain <img> may already have cached the same URL
 * without CORS headers, and such a copy would make the canvas impossible to export.
 */
export function loadImage(
  url: string | null | undefined,
  width: number,
  tag: string,
): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    const small = optimizeImage(url, width);
    const timer = setTimeout(() => resolve(null), IMAGE_TIMEOUT_MS);
    image.onload = () => {
      clearTimeout(timer);
      resolve(image);
    };
    image.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };
    image.src = `${small}${small.includes('?') ? '&' : '?'}${tag}`;
  });
}

export function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('empty image'))),
        'image/png',
      );
    } catch (error) {
      reject(error);
    }
  });
}

/** A rounded rectangle path; a plain rectangle in browsers without roundRect. */
export function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  if (typeof context.roundRect === 'function') context.roundRect(x, y, width, height, radius);
  else context.rect(x, y, width, height);
}

export interface LinkPillStyle {
  size: number;
  fill: string;
  color: string;
  maxWidth: number;
  /** `center`: x is the middle of the pill, `right`: x is its right edge. */
  align: 'center' | 'right';
  border?: string;
}

/** A rounded badge with the site address; the text shrinks if it would not fit `maxWidth`. */
export function drawLinkPill(
  context: CanvasRenderingContext2D,
  label: string,
  x: number,
  centerY: number,
  { size, fill, color, maxWidth, align, border }: LinkPillStyle,
) {
  const padX = Math.round(size * 0.9);
  const padY = Math.round(size * 0.55);
  let fontSize = size;
  let textWidth = 0;
  for (; fontSize >= 16; fontSize -= 2) {
    context.font = `800 ${fontSize}px ${BODY_FONT}`;
    textWidth = context.measureText(label).width;
    if (textWidth + 2 * padX <= maxWidth) break;
  }
  const width = textWidth + 2 * padX;
  const height = fontSize + 2 * padY;
  const left = align === 'center' ? x - width / 2 : x - width;
  const top = centerY - height / 2;

  roundedRectPath(context, left, top, width, height, height / 2);
  context.fillStyle = fill;
  context.fill();
  if (border) {
    context.strokeStyle = border;
    context.lineWidth = 2;
    context.stroke();
  }

  context.fillStyle = color;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, left + width / 2, centerY + 1);
}

/** The site address for a picture: the configured site, else the current host. */
export function siteHost(): string {
  const site = import.meta.env.VITE_SITE_URL as string | undefined;
  try {
    if (site) return new URL(site).host;
  } catch {
    // An invalid address in the settings: the current host is fine.
  }
  return window.location.host;
}

/** Phones and tablets (the main pointer is a finger): there a picture belongs in the gallery. */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(pointer: coarse)').matches);
}

export function canShareFile(file: File): boolean {
  try {
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
