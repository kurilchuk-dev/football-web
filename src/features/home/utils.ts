import type { Match, StandingRow, Team } from '@/api/types';
import { isPlayed } from '@/features/matches/utils';

type FormResult = StandingRow['form'][number];

const time = (match: Pick<Match, 'played_at'>) => new Date(match.played_at).getTime();

export function isOurMatch(match: Match): boolean {
  return Boolean(match.home_team.is_our_team || match.away_team.is_our_team);
}

/** The soonest not-yet-played match of our team. */
export function getNextMatch(upcoming: Match[]): Match | undefined {
  return upcoming
    .filter((match) => isOurMatch(match) && !isPlayed(match))
    .sort((a, b) => time(a) - time(b))[0];
}

/** Our latest played matches, newest first. */
export function getRecentResults(results: Match[], count = 3): Match[] {
  return results
    .filter((match) => isOurMatch(match) && isPlayed(match))
    .sort((a, b) => time(b) - time(a))
    .slice(0, count);
}

/** The other side of a match of our team. */
export function getOpponent(match: Match): Team {
  return match.home_team.is_our_team ? match.away_team : match.home_team;
}

/** W/D/L from the point of view of our team; null if unplayed or we did not play. */
export function getOurResult(match: Match): FormResult | null {
  if (!isPlayed(match) || !isOurMatch(match)) return null;
  const home = match.home_score as number;
  const away = match.away_score as number;
  if (home === away) return 'D';
  const weWon = match.home_team.is_our_team ? home > away : away > home;
  return weWon ? 'W' : 'L';
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** The start time has already passed. */
  finished: boolean;
}

export function getCountdown(targetIso: string, nowMs: number): Countdown {
  const diff = new Date(targetIso).getTime() - nowMs;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    finished: false,
  };
}

export function getOurRow(rows: StandingRow[]): StandingRow | undefined {
  return rows.find((row) => row.team.is_our_team);
}

/** Top of the table; if our team is lower, its row is added at the end. */
export function getMiniStandings(rows: StandingRow[], limit = 5): StandingRow[] {
  const top = rows.slice(0, limit);
  const ours = getOurRow(rows);
  return ours && !top.includes(ours) ? [...top, ours] : top;
}
