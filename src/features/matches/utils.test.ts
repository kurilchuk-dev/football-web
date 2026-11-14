import { describe, expect, it } from 'vitest';
import type { Match } from '@/api/types';
import { formatMatchTime, getWinner, groupMatches, isPlayed } from './utils';

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
  it('formats the time as 24h HH:MM', () => {
    expect(formatMatchTime('2026-11-14T18:05:00Z', 'UTC')).toBe('18:05');
    expect(formatMatchTime('2026-11-14T00:30:00Z', 'UTC')).toBe('00:30');
  });
});

describe('groupMatches', () => {
  const match = (id: number, playedAt: string, round: number | null = null) =>
    ({ id, played_at: playedAt, round }) as Match;

  it('without rounds groups matches by calendar day and keeps the input order', () => {
    const groups = groupMatches(
      [
        match(1, '2026-11-10T16:00:00Z'),
        match(2, '2026-11-10T18:00:00Z'),
        match(3, '2026-11-19T15:00:00Z'),
      ],
      'UTC',
    );

    expect(groups.map((g) => g.key)).toEqual(['day:2026-11-10', 'day:2026-11-19']);
    expect(groups[0].matches.map((m) => m.id)).toEqual([1, 2]);
    expect(groups[0].showDate).toBe(false);
    expect(groups[0].subtitle).toBeUndefined();
  });

  it('uses the given time zone to decide which day a match belongs to', () => {
    // 23:30 UTC is already the next day in Kyiv.
    const [group] = groupMatches([match(1, '2026-11-10T23:30:00Z')], 'Europe/Kyiv');
    expect(group.key).toBe('day:2026-11-11');
  });

  it('groups by round, sorts matches inside it and shows the date range', () => {
    const groups = groupMatches(
      [
        match(1, '2026-11-16T15:00:00Z', 5),
        match(2, '2026-11-14T15:00:00Z', 5),
        match(3, '2026-11-09T15:00:00Z', 4),
      ],
      'UTC',
    );

    expect(groups.map((g) => g.label)).toEqual(['Тур 5', 'Тур 4']);
    expect(groups[0].matches.map((m) => m.id)).toEqual([2, 1]);
    expect(groups[0].showDate).toBe(true); // 14 and 16 November
    expect(groups[0].subtitle).toBe('14–16 листопада');
    expect(groups[1].subtitle).toBe('9 листопада');
    expect(groups[1].showDate).toBe(false); // one day: the heading already has the date
  });

  it('keeps matches without a round in their own day groups next to rounds', () => {
    const groups = groupMatches(
      [match(1, '2026-11-14T15:00:00Z', 5), match(2, '2026-11-20T15:00:00Z')],
      'UTC',
    );
    expect(groups.map((g) => g.key)).toEqual(['round:5', 'day:2026-11-20']);
  });

  it('returns an empty list for no matches', () => {
    expect(groupMatches([], 'UTC')).toEqual([]);
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
