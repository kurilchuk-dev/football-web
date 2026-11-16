import { describe, expect, it } from 'vitest';
import { ellipsize, formatGoalDifference, imageFileName, imageHeight } from './image';

describe('imageFileName', () => {
  it('uses the local date with zero padding', () => {
    expect(imageFileName(new Date(2026, 0, 5, 23, 59))).toBe('turnirna-tablytsia-2026-01-05.png');
    expect(imageFileName(new Date(2026, 10, 16, 0, 1))).toBe('turnirna-tablytsia-2026-11-16.png');
  });
});

describe('formatGoalDifference', () => {
  it('adds a plus only for positive values', () => {
    expect(formatGoalDifference(3)).toBe('+3');
    expect(formatGoalDifference(0)).toBe('0');
    expect(formatGoalDifference(-2)).toBe('-2');
  });
});

describe('imageHeight', () => {
  it('grows with the number of teams, by one row each', () => {
    expect(imageHeight(11) - imageHeight(10)).toBe(imageHeight(2) - imageHeight(1));
    expect(imageHeight(10)).toBeGreaterThan(imageHeight(5));
  });
});

describe('ellipsize', () => {
  const measure = (text: string) => text.length * 10;

  it('keeps a text that fits', () => {
    expect(ellipsize('Динамо', 100, measure)).toBe('Динамо');
  });

  it('cuts a long text and adds an ellipsis within the width', () => {
    const result = ellipsize('Дуже довга назва команди', 100, measure);
    expect(result.endsWith('…')).toBe(true);
    expect(measure(result)).toBeLessThanOrEqual(100);
    expect(result.length).toBeGreaterThan(1);
  });

  it('never returns an empty string', () => {
    expect(ellipsize('Назва', 5, measure).length).toBeGreaterThan(0);
  });
});
