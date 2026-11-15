import type { Match } from '@/api/types';

const LOCALE = 'uk-UA';

/** Shown instead of a date/time while the admin has not set it yet. */
export const DATE_TBD = 'Дата уточнюється';

/** True if the match already has a date and time. */
export function hasDate<T extends Pick<Match, 'played_at'>>(
  match: T,
): match is T & { played_at: string } {
  return Boolean(match.played_at);
}

/** "сб, 14.11" */
export function formatMatchDate(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    timeZone,
  }).format(new Date(iso));
}

/** "18:30" */
export function formatMatchTime(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).format(new Date(iso));
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
export function formatDayHeading(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone,
  }).format(new Date(iso));
}

/** "14–16 листопада" (a single day collapses to "14 листопада"). */
export function formatDateRange(fromIso: string, toIso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    timeZone,
  }).formatRange(new Date(fromIso), new Date(toIso));
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
 * grouping by calendar day. Groups keep the order of their first match in the
 * input list; matches inside a round are sorted chronologically.
 */
export function groupMatches(matches: Match[], timeZone?: string): MatchGroup[] {
  const dayKeyFormat = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  });
  const dayOf = (iso: string) => dayKeyFormat.format(new Date(iso));

  const groups = new Map<string, MatchGroup>();
  for (const match of matches) {
    const hasRound = match.round !== null && match.round !== undefined;
    const dated = hasDate(match);
    const key = hasRound
      ? `round:${match.round}`
      : dated
        ? `day:${dayOf(match.played_at)}`
        : 'day:tbd';

    let group = groups.get(key);
    if (!group) {
      if (hasRound) group = { key, label: `Тур ${match.round}`, showDate: false, matches: [] };
      else if (dated)
        group = {
          key,
          label: formatDayHeading(match.played_at, timeZone),
          showDate: false,
          matches: [],
        };
      else group = { key, label: DATE_TBD, showDate: false, matches: [] };
      groups.set(key, group);
    }
    group.matches.push(match);
  }

  for (const group of groups.values()) {
    if (!group.key.startsWith('round:')) continue;
    // Dated matches in chronological order, the ones without a date after them.
    group.matches.sort((a, b) => {
      if (!hasDate(a)) return hasDate(b) ? 1 : 0;
      if (!hasDate(b)) return -1;
      return a.played_at.localeCompare(b.played_at);
    });
    const datedMatches = group.matches.filter(hasDate);
    const hasUndated = datedMatches.length < group.matches.length;
    if (datedMatches.length > 0) {
      group.subtitle = formatDateRange(
        datedMatches[0].played_at,
        datedMatches[datedMatches.length - 1].played_at,
        timeZone,
      );
    }
    // Rows show their own date when the round spans several days or some matches have no date yet.
    group.showDate =
      new Set(datedMatches.map((m) => dayOf(m.played_at))).size > 1 ||
      (hasUndated && datedMatches.length > 0);
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
