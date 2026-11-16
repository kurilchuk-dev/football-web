import { describe, expect, it } from 'vitest';
import { contrastRatio, fillFor, pickAccent } from './accent';

/** RGBA pixels: `n` copies of the given color. */
const pixels = (n: number, rgba: [number, number, number, number]) =>
  new Uint8ClampedArray(Array.from({ length: n }, () => rgba).flat());

const concat = (...parts: Uint8ClampedArray[]) =>
  Uint8ClampedArray.from(parts.flatMap((p) => [...p]));

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

describe('pickAccent', () => {
  it('takes the dominant color of the logo', () => {
    const [r, g, b] = channels(pickAccent(pixels(100, [20, 60, 200, 255]))!.accent);
    expect(b).toBeGreaterThan(r);
    expect(b).toBeGreaterThan(g);
  });

  it('prefers the larger colored area', () => {
    const result = pickAccent(
      concat(pixels(80, [210, 30, 30, 255]), pixels(20, [30, 60, 210, 255])),
    );
    const [r, g, b] = channels(result!.accent);
    expect(r).toBeGreaterThan(g);
    expect(r).toBeGreaterThan(b);
  });

  it('ignores white, black, gray and transparent pixels', () => {
    const result = pickAccent(
      concat(
        pixels(300, [255, 255, 255, 255]),
        pixels(300, [0, 0, 0, 255]),
        pixels(300, [128, 128, 128, 255]),
        pixels(300, [255, 0, 0, 0]),
        pixels(60, [30, 180, 60, 255]),
      ),
    );
    const [r, g, b] = channels(result!.accent);
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });

  it('returns null for a logo without a clear color', () => {
    expect(pickAccent(pixels(100, [128, 128, 128, 255]))).toBeNull();
    expect(pickAccent(pixels(100, [255, 255, 255, 255]))).toBeNull();
    expect(pickAccent(pixels(100, [255, 0, 0, 0]))).toBeNull();
    expect(pickAccent(new Uint8ClampedArray())).toBeNull();
  });

  it('ignores a color that covers only a sliver of the logo', () => {
    expect(
      pickAccent(concat(pixels(1000, [10, 10, 10, 255]), pixels(5, [220, 30, 30, 255]))),
    ).toBeNull();
  });

  it('chooses readable text for the accent', () => {
    expect(pickAccent(pixels(100, [230, 210, 20, 255]))!.onAccent).toBe('#0b0f0d');
    expect(pickAccent(pixels(100, [20, 40, 200, 255]))!.onAccent).toBe('#ffffff');
  });
});

describe('fillFor', () => {
  it('darkens a bright accent until its white text is readable', () => {
    const accent = { accent: '#ef3e39', onAccent: '#ffffff' };
    expect(contrastRatio(accent.accent, accent.onAccent)).toBeLessThan(4.5);
    const fill = fillFor(accent);
    expect(contrastRatio(fill, '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(fill).not.toBe(accent.accent);
  });

  it('keeps the accent when its text is already readable', () => {
    const accent = { accent: '#0a3d8f', onAccent: '#ffffff' };
    expect(fillFor(accent)).toBe(accent.accent);
  });

  it('lightens an accent that carries dark text', () => {
    const accent = { accent: '#2a7a4b', onAccent: '#0b0f0d' };
    const fill = fillFor(accent);
    expect(contrastRatio(fill, '#0b0f0d')).toBeGreaterThanOrEqual(4.5);
  });

  it('matches the default fill in global.css for the default accent', () => {
    expect(fillFor({ accent: '#ef3e39', onAccent: '#ffffff' })).toBe('#e71913');
  });
});
