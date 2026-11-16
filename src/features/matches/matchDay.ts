import { useQuery } from '@tanstack/react-query';
import type { Match } from '@/api/types';
import { upcomingQuery } from './queries';
import { hasDate, isPlayed } from './utils';

/** How often to refresh on a match day: the score is entered during or right after the game. */
export const MATCH_DAY_REFRESH_MS = 60_000;

/** "YYYY-MM-DD" of the given moment in the visitor's local time (match dates are calendar days). */
function localDay(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** True while at least one match scheduled for today has not been played yet. */
export function hasMatchToday(upcoming: Match[] | undefined, now = new Date()): boolean {
  if (!upcoming) return false;
  const today = localDay(now);
  return upcoming.some((match) => hasDate(match) && match.date === today && !isPlayed(match));
}

/**
 * Refetch interval for the match data: every minute on a match day, otherwise never.
 * (Background tabs are not polled: that is the default of the query library.)
 */
export function useMatchDayInterval(): number | false {
  const { data } = useQuery(upcomingQuery());
  return hasMatchToday(data) ? MATCH_DAY_REFRESH_MS : false;
}
