import type { StandingRow } from '@/api/types';

/**
 * The standings, calculated in the browser by the very same rules as the server
 * (`standings/services.py` in football-api): 3 points for a win, 1 for a draw; teams level on
 * points are ranked by a mini table of the matches between them (points, goal difference, goals
 * scored), then by overall goal difference, overall goals scored and finally by name.
 *
 * It exists for the simulator ("what if"): the table has to be recalculated at once for
 * made-up scores. `fixtures/standings-parity.json` holds seasons calculated by the real Python
 * code, and the tests require this file to give the same tables. When the rules change, change
 * both and regenerate the fixtures (see scripts/standings_fixtures.py).
 */

export type EngineTeam = StandingRow['team'];
type FormResult = StandingRow['form'][number];

/** A match with both scores known. */
export interface EngineMatch {
  id: number;
  home_id: number;
  away_id: number;
  home_score: number;
  away_score: number;
  /** "YYYY-MM-DD" or null; decides the order of the form (latest matches). */
  date: string | null;
  /** "HH:MM" or null. */
  time: string | null;
}

const FORM_LENGTH = 5;

interface Row {
  team: EngineTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  form: FormResult[];
  goal_difference: number;
  points: number;
}

/** Newest first; a missing value counts as the oldest (the server puts NULL last). */
function newestFirst(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a > b ? -1 : 1;
}

/** Character code order, as Python sorts strings (localeCompare would order differently). */
function byName(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** {team id: [points, goal difference, goals scored]} in the matches between teams level on points. */
function headToHead(matches: EngineMatch[], rows: Row[]): Map<number, [number, number, number]> {
  const groups = new Map<number, Set<number>>();
  for (const row of rows) {
    const group = groups.get(row.points) ?? new Set<number>();
    group.add(row.team.id);
    groups.set(row.points, group);
  }

  const stats = new Map<number, [number, number, number]>(
    rows.map((row) => [row.team.id, [0, 0, 0] as [number, number, number]]),
  );
  for (const match of matches) {
    const { home_id: home, away_id: away, home_score: hs, away_score: as } = match;
    const sameGroup = [...groups.values()].some((group) => group.has(home) && group.has(away));
    if (!sameGroup) continue;
    const h = stats.get(home)!;
    const a = stats.get(away)!;
    h[1] += hs - as;
    h[2] += hs;
    a[1] += as - hs;
    a[2] += as;
    if (hs > as) h[0] += 3;
    else if (hs < as) a[0] += 3;
    else {
      h[0] += 1;
      a[0] += 1;
    }
  }
  return stats;
}

export function calculateStandings(teams: EngineTeam[], matches: EngineMatch[]): StandingRow[] {
  const rows = new Map<number, Row>(
    teams.map((team) => [
      team.id,
      {
        team,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
        form: [],
        goal_difference: 0,
        points: 0,
      },
    ]),
  );

  // Latest first, so the first FORM_LENGTH results of a team are its form.
  const finished = [...matches].sort(
    (a, b) => newestFirst(a.date, b.date) || newestFirst(a.time, b.time) || b.id - a.id,
  );

  for (const match of finished) {
    const home = rows.get(match.home_id);
    const away = rows.get(match.away_id);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goals_for += match.home_score;
    home.goals_against += match.away_score;
    away.goals_for += match.away_score;
    away.goals_against += match.home_score;

    let homeResult: FormResult;
    let awayResult: FormResult;
    if (match.home_score > match.away_score) {
      home.won += 1;
      away.lost += 1;
      [homeResult, awayResult] = ['W', 'L'];
    } else if (match.home_score < match.away_score) {
      away.won += 1;
      home.lost += 1;
      [homeResult, awayResult] = ['L', 'W'];
    } else {
      home.drawn += 1;
      away.drawn += 1;
      homeResult = awayResult = 'D';
    }

    if (home.form.length < FORM_LENGTH) home.form.push(homeResult);
    if (away.form.length < FORM_LENGTH) away.form.push(awayResult);
  }

  const table = [...rows.values()];
  for (const row of table) {
    row.form.reverse(); // oldest to newest, the latest match last
    row.goal_difference = row.goals_for - row.goals_against;
    row.points = row.won * 3 + row.drawn;
  }

  const h2h = headToHead(finished, table);
  table.sort((a, b) => {
    const [ap, ag, af] = h2h.get(a.team.id)!;
    const [bp, bg, bf] = h2h.get(b.team.id)!;
    return (
      b.points - a.points ||
      bp - ap ||
      bg - ag ||
      bf - af ||
      b.goal_difference - a.goal_difference ||
      b.goals_for - a.goals_for ||
      byName(a.team.name, b.team.name)
    );
  });

  return table.map((row, index) => ({
    position: index + 1,
    team: row.team,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goals_for: row.goals_for,
    goals_against: row.goals_against,
    goal_difference: row.goal_difference,
    points: row.points,
    form: row.form,
  }));
}
