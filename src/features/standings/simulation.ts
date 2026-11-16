import type { Match, StandingRow } from '@/api/types';
import { isPlayed } from '@/features/matches/utils';
import { calculateStandings, type EngineMatch } from './calculate';

/** What the visitor typed for one match. An empty field means "no result". */
export interface ScoreInput {
  home: string;
  away: string;
}
export type ScoreInputs = Record<number, ScoreInput>;

/** How a team moved against the real table. */
export interface RowChange {
  /** Places gained: 2 = two places higher, -1 = one lower. */
  position: number;
  /** Points gained. */
  points: number;
}

export interface Simulation {
  rows: StandingRow[];
  changes: Map<number, RowChange>;
  /** How many of the typed matches have both scores and so take part. */
  counted: number;
}

/** Keeps digits only, at most two (the scores in the database are small numbers). */
export function sanitizeScore(value: string): string {
  return value.replace(/\D/g, '').slice(0, 2);
}

export function parseScore(value: string | undefined): number | null {
  return value === undefined || value === '' ? null : Number(value);
}

function toEngine(match: Match, homeScore: number, awayScore: number): EngineMatch {
  return {
    id: match.id,
    home_id: match.home_team.id,
    away_id: match.away_team.id,
    home_score: homeScore,
    away_score: awayScore,
    date: match.date ?? null,
    time: match.time ?? null,
  };
}

/** The real, played matches. */
export function playedMatches(results: Match[]): EngineMatch[] {
  return results
    .filter(isPlayed)
    .map((match) => toEngine(match, match.home_score as number, match.away_score as number));
}

/** The planned matches for which both scores were typed. */
export function simulatedMatches(upcoming: Match[], inputs: ScoreInputs): EngineMatch[] {
  const extra: EngineMatch[] = [];
  for (const match of upcoming) {
    const input = inputs[match.id];
    const home = parseScore(input?.home);
    const away = parseScore(input?.away);
    if (home !== null && away !== null) extra.push(toEngine(match, home, away));
  }
  return extra;
}

/**
 * The table as it would be if the typed scores were real, and how each team moved compared with
 * the real table. Matches without both scores are simply left out.
 */
export function simulate(
  real: StandingRow[],
  results: Match[],
  upcoming: Match[],
  inputs: ScoreInputs,
): Simulation {
  const extra = simulatedMatches(upcoming, inputs);
  const rows = calculateStandings(
    real.map((row) => row.team),
    [...playedMatches(results), ...extra],
  );

  const before = new Map(real.map((row) => [row.team.id, row]));
  const changes = new Map<number, RowChange>();
  for (const row of rows) {
    const old = before.get(row.team.id);
    changes.set(row.team.id, {
      position: old ? old.position - row.position : 0,
      points: old ? row.points - old.points : 0,
    });
  }
  return { rows, changes, counted: extra.length };
}

export interface OurSummary {
  name: string;
  fromPosition: number;
  toPosition: number;
  fromPoints: number;
  toPoints: number;
}

/** Where our team was and where it would be, or null if there is no "our team" in the table. */
export function ourSummary(real: StandingRow[], simulation: Simulation): OurSummary | null {
  const before = real.find((row) => row.team.is_our_team);
  const after = simulation.rows.find((row) => row.team.is_our_team);
  if (!before || !after) return null;
  return {
    name: after.team.name,
    fromPosition: before.position,
    toPosition: after.position,
    fromPoints: before.points,
    toPoints: after.points,
  };
}
