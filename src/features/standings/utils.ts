import type { StandingRow } from '@/api/types';

export interface StandingsSummary {
  teams: number;
  matches: number;
  goals: number;
}

export function getStandingsSummary(rows: StandingRow[]): StandingsSummary {
  const played = rows.reduce((sum, row) => sum + row.played, 0);
  const goals = rows.reduce((sum, row) => sum + row.goals_for, 0);
  // Every match is counted once for each of the two teams.
  return { teams: rows.length, matches: played / 2, goals };
}
