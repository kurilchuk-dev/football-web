import { describe, expect, it } from 'vitest';
import type { Match } from '@/api/types';
import { formatMatchTime, getOurResult, getWinner, groupMatchesByDay, isPlayed } from './utils';

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

describe('groupMatchesByDay', () => {
  const match = (id: number, playedAt: string) => ({ id, played_at: playedAt }) as Match;

  it('groups matches of the same day and keeps the input order', () => {
    const days = groupMatchesByDay(
      [
        match(1, '2026-11-10T16:00:00Z'),
        match(2, '2026-11-10T18:00:00Z'),
        match(3, '2026-11-19T15:00:00Z'),
      ],
      'UTC',
    );

    expect(days.map((day) => day.key)).toEqual(['2026-11-10', '2026-11-19']);
    expect(days[0].matches.map((m) => m.id)).toEqual([1, 2]);
    expect(days[1].matches.map((m) => m.id)).toEqual([3]);
  });

  it('uses the given time zone to decide which day a match belongs to', () => {
    // 23:30 UTC is already the next day in Kyiv.
    const [day] = groupMatchesByDay([match(1, '2026-11-10T23:30:00Z')], 'Europe/Kyiv');
    expect(day.key).toBe('2026-11-11');
  });

  it('returns an empty list for no matches', () => {
    expect(groupMatchesByDay([], 'UTC')).toEqual([]);
  });
});

describe('getWinner / getOurResult', () => {
  const game = (homeScore: number | null, awayScore: number | null, ourSide: 'home' | 'away') =>
    ({
      home_score: homeScore,
      away_score: awayScore,
      home_team: { is_our_team: ourSide === 'home' },
      away_team: { is_our_team: ourSide === 'away' },
    }) as Match;

  it('finds the winning side', () => {
    expect(getWinner(game(2, 1, 'home'))).toBe('home');
    expect(getWinner(game(0, 3, 'home'))).toBe('away');
    expect(getWinner(game(1, 1, 'home'))).toBeNull();
    expect(getWinner(game(null, null, 'home'))).toBeNull();
  });

  it('gives the result from the point of view of our team', () => {
    expect(getOurResult(game(2, 1, 'home'))).toBe('W');
    expect(getOurResult(game(2, 1, 'away'))).toBe('L');
    expect(getOurResult(game(1, 1, 'away'))).toBe('D');
    expect(getOurResult(game(null, null, 'home'))).toBeNull();
  });

  it('is null when our team did not play', () => {
    const other = { ...game(2, 1, 'home'), home_team: { is_our_team: false } } as Match;
    expect(getOurResult(other)).toBeNull();
  });
});
