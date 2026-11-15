import { describe, expect, it } from 'vitest';
import type { Match, StandingRow, Team } from '@/api/types';
import {
  getCountdown,
  getMiniStandings,
  getNextMatch,
  getOpponent,
  getOurResult,
  getRecentResults,
} from './utils';

const team = (id: number, ours = false) =>
  ({ id, name: `Team ${id}`, city: '', is_our_team: ours, logo: null }) as Team;

const OURS = team(1, true);
const A = team(2);
const B = team(3);

const match = (
  id: number,
  home: Team,
  away: Team,
  homeScore: number | null,
  awayScore: number | null,
  playedAt: string | null,
) =>
  ({
    id,
    home_team: home,
    away_team: away,
    home_score: homeScore,
    away_score: awayScore,
    date: playedAt ? playedAt.slice(0, 10) : null,
    time: playedAt ? playedAt.slice(11, 16) : null,
    played_at: playedAt,
    round: null,
  }) as Match;

describe('getNextMatch', () => {
  it('returns the soonest unplayed match of our team', () => {
    const upcoming = [
      match(1, A, B, null, null, '2026-11-20T10:00:00Z'),
      match(2, OURS, A, null, null, '2026-11-28T10:00:00Z'),
      match(3, B, OURS, null, null, '2026-11-22T10:00:00Z'),
    ];
    expect(getNextMatch(upcoming)?.id).toBe(3);
  });

  it('puts a match without a date after the dated ones, but still returns it when it is the only one', () => {
    const undated = match(1, OURS, A, null, null, null);
    const dated = match(2, OURS, B, null, null, '2026-11-28T10:00:00Z');
    expect(getNextMatch([undated, dated])?.id).toBe(2);
    expect(getNextMatch([undated])?.id).toBe(1);
  });

  it('puts a match with a date but no time after the timed matches of that day', () => {
    const noTime = { ...match(1, OURS, A, null, null, '2026-11-28T10:00:00Z'), time: null };
    const timed = match(2, OURS, B, null, null, '2026-11-28T18:00:00Z');
    expect(getNextMatch([noTime, timed])?.id).toBe(2);
    expect(getNextMatch([noTime])?.id).toBe(1);
  });

  it('is undefined when our team has nothing scheduled', () => {
    expect(getNextMatch([match(1, A, B, null, null, '2026-11-20T10:00:00Z')])).toBeUndefined();
  });
});

describe('getRecentResults', () => {
  const results = [
    match(1, OURS, A, 2, 0, '2026-11-01T10:00:00Z'),
    match(2, A, B, 1, 1, '2026-11-08T10:00:00Z'),
    match(3, A, OURS, 0, 0, '2026-11-15T10:00:00Z'),
    match(4, OURS, B, 3, 2, '2026-11-08T12:00:00Z'),
    match(5, B, OURS, 1, 4, '2026-10-25T10:00:00Z'),
  ];

  it('keeps only our played matches, newest first, limited to the count', () => {
    expect(getRecentResults(results, 3).map((m) => m.id)).toEqual([3, 4, 1]);
  });

  it('defaults to three matches', () => {
    expect(getRecentResults(results)).toHaveLength(3);
  });
});

describe('getOpponent', () => {
  it('returns the other team whichever side we play', () => {
    expect(getOpponent(match(1, OURS, A, null, null, '2026-11-20T10:00:00Z'))).toBe(A);
    expect(getOpponent(match(2, B, OURS, null, null, '2026-11-20T10:00:00Z'))).toBe(B);
  });
});

describe('getOurResult', () => {
  it('judges from our point of view at home and away', () => {
    expect(getOurResult(match(1, OURS, A, 2, 1, '2026-11-01T10:00:00Z'))).toBe('W');
    expect(getOurResult(match(2, A, OURS, 2, 1, '2026-11-01T10:00:00Z'))).toBe('L');
    expect(getOurResult(match(3, A, OURS, 0, 3, '2026-11-01T10:00:00Z'))).toBe('W');
    expect(getOurResult(match(4, OURS, A, 1, 1, '2026-11-01T10:00:00Z'))).toBe('D');
  });

  it('is null for unplayed matches and matches without us', () => {
    expect(getOurResult(match(1, OURS, A, null, null, '2026-11-01T10:00:00Z'))).toBeNull();
    expect(getOurResult(match(2, A, B, 1, 0, '2026-11-01T10:00:00Z'))).toBeNull();
  });
});

describe('getCountdown', () => {
  const target = '2026-11-20T12:00:00Z';
  const at = (iso: string) => new Date(iso).getTime();

  it('splits the remaining time into days, hours, minutes and seconds', () => {
    expect(getCountdown(target, at('2026-11-18T09:28:30Z'))).toEqual({
      days: 2,
      hours: 2,
      minutes: 31,
      seconds: 30,
      finished: false,
    });
  });

  it('is finished at and after the start time', () => {
    expect(getCountdown(target, at(target)).finished).toBe(true);
    expect(getCountdown(target, at('2026-11-21T00:00:00Z'))).toMatchObject({
      days: 0,
      seconds: 0,
      finished: true,
    });
  });
});

describe('getMiniStandings', () => {
  const rows = (ourPosition: number) =>
    Array.from({ length: 10 }, (_, i) => ({
      position: i + 1,
      team: { id: i + 1, name: `Team ${i + 1}`, is_our_team: i + 1 === ourPosition, logo: null },
    })) as StandingRow[];

  it('returns the top five when we are among them', () => {
    expect(getMiniStandings(rows(3)).map((r) => r.position)).toEqual([1, 2, 3, 4, 5]);
  });

  it('appends our row when we are lower', () => {
    expect(getMiniStandings(rows(8)).map((r) => r.position)).toEqual([1, 2, 3, 4, 5, 8]);
  });

  it('works without our team in the table', () => {
    expect(getMiniStandings(rows(0))).toHaveLength(5);
  });
});
