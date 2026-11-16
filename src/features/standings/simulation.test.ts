import { describe, expect, it } from 'vitest';
import type { Match, StandingRow } from '@/api/types';
import { calculateStandings, type EngineTeam } from './calculate';
import { ourSummary, parseScore, sanitizeScore, simulate, type ScoreInputs } from './simulation';

const teams: EngineTeam[] = [
  { id: 1, name: 'Наші', is_our_team: true, logo: null },
  { id: 2, name: 'Барс', is_our_team: false, logo: null },
  { id: 3, name: 'Темп', is_our_team: false, logo: null },
];

const game = (
  id: number,
  home: number,
  away: number,
  scores: [number, number] | null,
  date: string | null = null,
): Match =>
  ({
    id,
    home_team: teams.find((t) => t.id === home),
    away_team: teams.find((t) => t.id === away),
    home_score: scores ? scores[0] : null,
    away_score: scores ? scores[1] : null,
    date,
    time: null,
  }) as Match;

// Темп beat Барс 2:0; Наші have not played yet.
const results = [game(1, 3, 2, [2, 0], '2026-11-01')];
const upcoming = [game(10, 1, 3, null, '2026-11-08'), game(11, 2, 1, null, '2026-11-09')];

const realTable = (): StandingRow[] =>
  calculateStandings(teams, [
    {
      id: 1,
      home_id: 3,
      away_id: 2,
      home_score: 2,
      away_score: 0,
      date: '2026-11-01',
      time: null,
    },
  ]);

describe('sanitizeScore / parseScore', () => {
  it('keeps digits only, at most two', () => {
    expect(sanitizeScore('12a')).toBe('12');
    expect(sanitizeScore('123')).toBe('12');
    expect(sanitizeScore('-3')).toBe('3');
    expect(sanitizeScore('abc')).toBe('');
  });

  it('treats an empty field as no score', () => {
    expect(parseScore('')).toBeNull();
    expect(parseScore(undefined)).toBeNull();
    expect(parseScore('0')).toBe(0);
    expect(parseScore('07')).toBe(7);
  });
});

describe('simulate', () => {
  it('changes nothing while no match has both scores', () => {
    const inputs: ScoreInputs = { 10: { home: '3', away: '' }, 11: { home: '', away: '' } };
    const result = simulate(realTable(), results, upcoming, inputs);

    expect(result.counted).toBe(0);
    expect(result.rows).toEqual(realTable());
    expect([...result.changes.values()].every((c) => c.position === 0 && c.points === 0)).toBe(
      true,
    );
  });

  it('counts a single filled match and leaves the others empty', () => {
    // Наші beat Темп 1:0, the other planned match stays empty.
    const inputs: ScoreInputs = { 10: { home: '1', away: '0' } };
    const result = simulate(realTable(), results, upcoming, inputs);

    expect(result.counted).toBe(1);
    const our = result.rows.find((r) => r.team.id === 1)!;
    expect(our).toMatchObject({ played: 1, won: 1, points: 3 });
    expect(result.changes.get(1)).toMatchObject({ points: 3 });
    expect(result.changes.get(3)).toMatchObject({ points: 0 });
  });

  it('reports how far teams moved against the real table', () => {
    // Real: Темп 3 points; Барс and Наші have 0, and Наші lead them on goal difference (0 against -2).
    const real = realTable();
    expect(real.map((r) => r.team.name)).toEqual(['Темп', 'Наші', 'Барс']);

    const inputs: ScoreInputs = { 10: { home: '4', away: '0' } };
    const result = simulate(real, results, upcoming, inputs);

    // Наші now have 3 points like Темп and won the match between them, so they go first.
    expect(result.rows.map((r) => r.team.name)).toEqual(['Наші', 'Темп', 'Барс']);
    expect(result.changes.get(1)?.position).toBe(1);
    expect(result.changes.get(3)?.position).toBe(-1);
    expect(result.changes.get(2)?.position).toBe(0);
  });

  it('accepts a 0:0 draw as a result', () => {
    const inputs: ScoreInputs = { 11: { home: '0', away: '0' } };
    const result = simulate(realTable(), results, upcoming, inputs);
    expect(result.counted).toBe(1);
    expect(result.rows.find((r) => r.team.id === 1)).toMatchObject({ drawn: 1, points: 1 });
  });
});

describe('ourSummary', () => {
  it('compares our place and points before and after', () => {
    const real = realTable();
    const result = simulate(real, results, upcoming, { 10: { home: '4', away: '0' } });

    expect(ourSummary(real, result)).toEqual({
      name: 'Наші',
      fromPosition: 2,
      toPosition: 1,
      fromPoints: 0,
      toPoints: 3,
    });
  });

  it('is null without an "our team"', () => {
    const real = realTable().map((r) => ({ ...r, team: { ...r.team, is_our_team: false } }));
    expect(ourSummary(real, simulate(real, results, upcoming, {}))).toBeNull();
  });
});
