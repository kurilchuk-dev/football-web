import { describe, expect, it } from 'vitest';
import type { Match } from '@/api/types';
import {
  DATE_TBD,
  formatMatchDate,
  formatMatchTime,
  getWinner,
  groupMatches,
  hasDate,
  hasTime,
  isPlayed,
  kickoffKey,
} from './utils';

describe('isPlayed', () => {
  it('is true when both scores are set, including 0:0', () => {
    expect(isPlayed({ home_score: 0, away_score: 0 })).toBe(true);
    expect(isPlayed({ home_score: 2, away_score: 1 })).toBe(true);
  });

  it('is false when a score is missing', () => {
    expect(isPlayed({ home_score: null, away_score: null })).toBe(false);
    expect(isPlayed({ home_score: 1 })).toBe(false);
  });
});

describe('formatMatchTime', () => {
  it('shows the HH:MM the API sends', () => {
    expect(formatMatchTime('18:05')).toBe('18:05');
    expect(formatMatchTime('00:30:00')).toBe('00:30');
  });
});

describe('formatMatchDate', () => {
  it('formats a calendar day without shifting it by a time zone', () => {
    expect(formatMatchDate('2026-11-21')).toContain('21');
    expect(formatMatchDate('2026-11-21')).toContain('11');
  });
});

describe('hasDate / hasTime', () => {
  it('are independent: a match can have a date but no time', () => {
    expect(hasDate({ date: null })).toBe(false);
    expect(hasDate({ date: '2026-11-21' })).toBe(true);
    expect(hasTime({ time: null })).toBe(false);
    expect(hasTime({ time: '14:00' })).toBe(true);
  });
});

describe('kickoffKey', () => {
  it('orders by date, then time; missing values go last', () => {
    const keys = [
      kickoffKey({ date: null, time: null }),
      kickoffKey({ date: '2026-11-21', time: null }),
      kickoffKey({ date: '2026-11-21', time: '10:00' }),
      kickoffKey({ date: '2026-11-20', time: '18:00' }),
    ].sort();
    expect(keys).toEqual([
      '2026-11-20 18:00',
      '2026-11-21 10:00',
      '2026-11-21 99:99',
      '9999-99-99 99:99',
    ]);
  });
});

describe('groupMatches', () => {
  // "2026-11-16T15:00:00Z" is only a compact way to write the date and the time.
  const match = (id: number, playedAt: string | null, round: number | null = null) =>
    ({
      id,
      date: playedAt ? playedAt.slice(0, 10) : null,
      time: playedAt ? playedAt.slice(11, 16) : null,
      round,
    }) as Match;

  it('puts matches without a date (and round) into one "date TBD" group', () => {
    const groups = groupMatches([match(1, null), match(2, null)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe(DATE_TBD);
    expect(groups[0].matches.map((m) => m.id)).toEqual([1, 2]);
  });

  it('keeps an undated match in its round, after the dated ones, and shows row dates', () => {
    const [group] = groupMatches([
      match(1, null, 5),
      match(2, '2026-11-16T15:00:00Z', 5),
      match(3, '2026-11-16T12:00:00Z', 5),
    ]);
    expect(group.matches.map((m) => m.id)).toEqual([3, 2, 1]);
    expect(group.subtitle).toBeDefined();
    expect(group.showDate).toBe(true);
  });

  it('keeps a match with a date but no time after the timed matches of that day', () => {
    const noTime = { ...match(1, '2026-11-16T10:00:00Z', 5), time: null };
    const [group] = groupMatches([noTime, match(2, '2026-11-16T18:00:00Z', 5)]);
    expect(group.matches.map((m) => m.id)).toEqual([2, 1]);
    expect(group.subtitle).toBe('16 листопада');
  });

  it('has no date subtitle when the whole round has no dates yet', () => {
    const [group] = groupMatches([match(1, null, 7), match(2, null, 7)]);
    expect(group.subtitle).toBeUndefined();
    expect(group.showDate).toBe(false);
  });

  it('without rounds groups matches by calendar day and keeps the input order', () => {
    const groups = groupMatches([
      match(1, '2026-11-10T16:00:00Z'),
      match(2, '2026-11-10T18:00:00Z'),
      match(3, '2026-11-19T15:00:00Z'),
    ]);

    expect(groups.map((g) => g.key)).toEqual(['day:2026-11-10', 'day:2026-11-19']);
    expect(groups[0].matches.map((m) => m.id)).toEqual([1, 2]);
    expect(groups[0].showDate).toBe(false);
    expect(groups[0].subtitle).toBeUndefined();
  });

  it('groups by round, sorts matches inside it and shows the date range', () => {
    const groups = groupMatches([
      match(1, '2026-11-16T15:00:00Z', 5),
      match(2, '2026-11-14T15:00:00Z', 5),
      match(3, '2026-11-09T15:00:00Z', 4),
    ]);

    expect(groups.map((g) => g.label)).toEqual(['Тур 5', 'Тур 4']);
    expect(groups[0].matches.map((m) => m.id)).toEqual([2, 1]);
    expect(groups[0].showDate).toBe(true); // 14 and 16 November
    expect(groups[0].subtitle).toBe('14–16 листопада');
    expect(groups[1].subtitle).toBe('9 листопада');
    expect(groups[1].showDate).toBe(false); // one day: the heading already has the date
  });

  it('keeps matches without a round in their own day groups next to rounds', () => {
    const groups = groupMatches([
      match(1, '2026-11-14T15:00:00Z', 5),
      match(2, '2026-11-20T15:00:00Z'),
    ]);
    expect(groups.map((g) => g.key)).toEqual(['round:5', 'day:2026-11-20']);
  });

  it('returns an empty list for no matches', () => {
    expect(groupMatches([])).toEqual([]);
  });
});

describe('getWinner', () => {
  const game = (homeScore: number | null, awayScore: number | null) =>
    ({ home_score: homeScore, away_score: awayScore }) as Match;

  it('finds the winning side', () => {
    expect(getWinner(game(2, 1))).toBe('home');
    expect(getWinner(game(0, 3))).toBe('away');
  });

  it('is null for a draw or an unplayed match', () => {
    expect(getWinner(game(1, 1))).toBeNull();
    expect(getWinner(game(null, null))).toBeNull();
  });
});
