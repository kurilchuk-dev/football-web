import { describe, expect, it } from 'vitest';
import { calculateStandings, type EngineMatch, type EngineTeam } from './calculate';
import fixtures from './fixtures/standings-parity.json';

const team = (id: number, name: string, is_our_team = false): EngineTeam => ({
  id,
  name,
  is_our_team,
  logo: null,
});

let nextId = 1;
const match = (
  home: number,
  away: number,
  home_score: number,
  away_score: number,
  date: string | null = null,
  time: string | null = null,
): EngineMatch => ({
  id: nextId++,
  home_id: home,
  away_id: away,
  home_score,
  away_score,
  date,
  time,
});

describe('calculateStandings', () => {
  it('gives 3 points for a win and 1 for a draw, and counts goals', () => {
    const rows = calculateStandings(
      [team(1, 'A'), team(2, 'B'), team(3, 'C')],
      [match(1, 2, 2, 0), match(2, 3, 1, 1)],
    );

    const by = (id: number) => rows.find((r) => r.team.id === id)!;
    expect(by(1)).toMatchObject({ played: 1, won: 1, points: 3, goals_for: 2, goal_difference: 2 });
    expect(by(2)).toMatchObject({ played: 2, lost: 1, drawn: 1, points: 1, goal_difference: -2 });
    expect(by(3)).toMatchObject({ played: 1, drawn: 1, points: 1 });
    expect(rows.map((r) => r.position)).toEqual([1, 2, 3]);
  });

  it('keeps a team without matches in the table', () => {
    const rows = calculateStandings([team(1, 'A'), team(2, 'B')], []);
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.played === 0 && r.points === 0 && r.form.length === 0)).toBe(true);
  });

  it('ranks teams level on points by the matches between them before the overall goals', () => {
    // A and B both have 3 points. B beat A, but A has the better overall goal difference.
    const rows = calculateStandings(
      [team(1, 'A'), team(2, 'B'), team(3, 'C')],
      [match(2, 1, 1, 0), match(1, 3, 5, 0), match(3, 2, 0, 0)],
    );
    expect(rows.map((r) => r.team.name)).toEqual(['B', 'A', 'C']);
  });

  it('falls back to overall goal difference, goals scored and then the name', () => {
    const rows = calculateStandings(
      [team(1, 'Б'), team(2, 'А'), team(3, 'В')],
      [match(1, 3, 1, 1), match(2, 3, 1, 1)],
    );
    // В has two draws (2 points); Б and А are level on everything, so the name decides.
    expect(rows.map((r) => r.team.name)).toEqual(['В', 'А', 'Б']);
  });

  it('builds the form from the latest matches, oldest first, at most five', () => {
    const matches = [1, 2, 3, 4, 5, 6].map((day) =>
      match(1, 2, day % 2 === 0 ? 1 : 0, day % 2 === 0 ? 0 : 1, `2026-11-0${day}`),
    );
    const rows = calculateStandings([team(1, 'A'), team(2, 'B')], matches);
    const a = rows.find((r) => r.team.id === 1)!;
    // Days 2..6 are the latest five: day 2 W, 3 L, 4 W, 5 L, 6 W.
    expect(a.form).toEqual(['W', 'L', 'W', 'L', 'W']);
  });

  it('treats matches without a date as the oldest', () => {
    const rows = calculateStandings(
      [team(1, 'A'), team(2, 'B')],
      [match(1, 2, 0, 1, null), match(1, 2, 1, 0, '2026-11-01')],
    );
    expect(rows.find((r) => r.team.id === 1)!.form).toEqual(['L', 'W']);
  });

  it('ignores matches of teams that are not in the table', () => {
    const rows = calculateStandings([team(1, 'A')], [match(1, 99, 3, 0)]);
    expect(rows[0].played).toBe(0);
  });
});

describe('parity with the server calculation', () => {
  it('has seasons that really need the head-to-head rule (the fixtures are not trivial)', () => {
    const needsHeadToHead = fixtures.filter((season) => {
      const played = season.matches.filter((m) => m.home_score !== null) as EngineMatch[];
      const rows = calculateStandings(season.teams, played);
      const simple = [...rows].sort(
        (a, b) =>
          b.points - a.points ||
          b.goal_difference - a.goal_difference ||
          b.goals_for - a.goals_for ||
          (a.team.name < b.team.name ? -1 : 1),
      );
      return simple.some((row, i) => row.team.id !== rows[i].team.id);
    });
    expect(needsHeadToHead.length).toBeGreaterThanOrEqual(5);
  });

  it.each(fixtures.map((season) => [season.name, season] as const))('%s', (_name, season) => {
    // The server only counts matches with both scores, as does the results endpoint.
    const played = season.matches.filter(
      (m) => m.home_score !== null && m.away_score !== null,
    ) as EngineMatch[];

    expect(calculateStandings(season.teams, played)).toEqual(season.expected);
  });
});
