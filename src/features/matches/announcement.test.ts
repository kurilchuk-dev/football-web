import { describe, expect, it } from 'vitest';
import { announcementFileName, splitDayHeading, wrapLines } from './announcement';

// One character is 10px wide, so the widths below read as character counts.
const measure = (text: string) => text.length * 10;

describe('announcementFileName', () => {
  it('uses the match date, or the id while the date is not set', () => {
    expect(announcementFileName({ id: 7, date: '2026-11-14' })).toBe('anons-matchu-2026-11-14.png');
    expect(announcementFileName({ id: 7, date: null })).toBe('anons-matchu-7.png');
  });
});

describe('splitDayHeading', () => {
  it('splits the weekday from the date and uppercases both', () => {
    expect(splitDayHeading('вівторок, 10 листопада')).toEqual({
      weekday: 'ВІВТОРОК',
      date: '10 ЛИСТОПАДА',
    });
  });
});

describe('wrapLines', () => {
  it('keeps a short name on one line', () => {
    expect(wrapLines('ЧЕРКАСИ ФАМ', 200, 2, measure)).toEqual(['ЧЕРКАСИ ФАМ']);
  });

  it('breaks a long name between words', () => {
    expect(wrapLines('ФК ЧЕРКАСИ ФАМ ДЮСШ', 100, 2, measure)).toEqual(['ФК ЧЕРКАСИ', 'ФАМ ДЮСШ']);
  });

  it('shortens the last line when the name needs more lines than allowed', () => {
    const lines = wrapLines('ПЕРШИЙ ДРУГИЙ ТРЕТІЙ ЧЕТВЕРТИЙ', 80, 2, measure);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('ПЕРШИЙ');
    expect(lines[1].endsWith('…')).toBe(true);
    expect(measure(lines[1])).toBeLessThanOrEqual(80);
  });

  it('shortens a single word that is wider than the line', () => {
    const [line] = wrapLines('АБВГДЕЄЖЗИІЇЙК', 60, 2, measure);
    expect(line.endsWith('…')).toBe(true);
    expect(measure(line)).toBeLessThanOrEqual(60);
  });
});
