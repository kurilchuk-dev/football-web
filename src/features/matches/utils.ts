import type { Match } from '@/api/types';

const LOCALE = 'uk-UA';

/** Shown instead of a date while the admin has not set it yet. */
export const DATE_TBD = 'Дата уточнюється';
/** Shown instead of the time when only the date is known. */
export const TIME_TBD = 'Час уточнюється';

/** True if the match has a date (the time may still be unknown). */
export function hasDate<T extends Pick<Match, 'date'>>(match: T): match is T & { date: string } {
  return Boolean(match.date);
}

/** True if the match has a time of day. */
export function hasTime<T extends Pick<Match, 'time'>>(match: T): match is T & { time: string } {
  return Boolean(match.time);
}

/**
 * A "YYYY-MM-DD" date is a calendar day, not a moment: it is read at noon UTC and
 * formatted in UTC, so no time zone can shift it to another day.
 */
const asDay = (date: string) => new Date(`${date}T12:00:00Z`);

/** "сб, 14.11" */
export function formatMatchDate(date: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone: 'UTC',
  }).format(asDay(date));
}

/** "18:30" (the API sends "HH:MM"). */
export function formatMatchTime(time: string): string {
  return time.slice(0, 5);
}

/** A match is played once both scores are known. */
export function isPlayed(match: Pick<Match, 'home_score' | 'away_score'>): boolean {
  return (
    match.home_score !== null &&
    match.home_score !== undefined &&
    match.away_score !== null &&
    match.away_score !== undefined
  );
}

/** "вівторок, 10 листопада" */
export function formatDayHeading(date: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(asDay(date));
}

/** "14–16 листопада" (a single day collapses to "14 листопада"). */
export function formatDateRange(from: string, to: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).formatRange(asDay(from), asDay(to));
}

/** Sort key: earlier first; a missing date goes last, a missing time after the timed matches of that day. */
export function kickoffKey(match: Pick<Match, 'date' | 'time'>): string {
  return `${match.date ?? '9999-99-99'} ${match.time ?? '99:99'}`;
}

export interface MatchGroup {
  /** Unique within one list: "round:5" or "day:2026-11-10". */
  key: string;
  label: string;
  /** Extra line next to the label, e.g. the dates of a round. */
  subtitle?: string;
  /** Rows show their own date: the round spans several days (a single day is already in the heading). */
  showDate: boolean;
  matches: Match[];
}

/**
 * Groups matches by round ("Тур 5"); matches without a round fall back to
 * grouping by calendar day (those without a date go to one "date TBD" group).
 * Groups keep the order of their first match in the input list; matches inside
 * a round are sorted chronologically, the ones without a date last.
 */
export function groupMatches(matches: Match[]): MatchGroup[] {
  const groups = new Map<string, MatchGroup>();
  for (const match of matches) {
    const hasRound = match.round !== null && match.round !== undefined;
    const dated = hasDate(match);
    const key = hasRound ? `round:${match.round}` : dated ? `day:${match.date}` : 'day:tbd';

    let group = groups.get(key);
    if (!group) {
      if (hasRound) group = { key, label: `Тур ${match.round}`, showDate: false, matches: [] };
      else if (dated)
        group = { key, label: formatDayHeading(match.date), showDate: false, matches: [] };
      else group = { key, label: DATE_TBD, showDate: false, matches: [] };
      groups.set(key, group);
    }
    group.matches.push(match);
  }

  for (const group of groups.values()) {
    if (!group.key.startsWith('round:')) continue;
    group.matches.sort((a, b) => kickoffKey(a).localeCompare(kickoffKey(b)));
    const dates = group.matches.filter(hasDate).map((m) => m.date);
    const hasUndated = dates.length < group.matches.length;
    if (dates.length > 0) group.subtitle = formatDateRange(dates[0], dates[dates.length - 1]);
    // Rows show their own date when the round spans several days or some matches have no date yet.
    group.showDate = new Set(dates).size > 1 || (hasUndated && dates.length > 0);
  }
  return [...groups.values()];
}

/** Which side won a played match; null for a draw or an unplayed match. */
export function getWinner(match: Pick<Match, 'home_score' | 'away_score'>): 'home' | 'away' | null {
  if (!isPlayed(match)) return null;
  const home = match.home_score as number;
  const away = match.away_score as number;
  if (home === away) return null;
  return home > away ? 'home' : 'away';
}
