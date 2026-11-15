import type { Match } from '@/api/types';

const LOCALE = 'uk-UA';

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

  const groups = new Map<string, MatchGroup>();
  for (const match of matches) {
    const hasRound = match.round !== null && match.round !== undefined;
    const key = hasRound
      ? `round:${match.round}`
      : `day:${dayKeyFormat.format(new Date(match.played_at))}`;

    let group = groups.get(key);
    if (!group) {
      group = hasRound
        ? { key, label: `Тур ${match.round}`, showDate: false, matches: [] }
        : { key, label: formatDayHeading(match.played_at, timeZone), showDate: false, matches: [] };
      groups.set(key, group);
    }
    group.matches.push(match);
  }

  for (const group of groups.values()) {
    if (!group.key.startsWith('round:')) continue;
    group.matches.sort((a, b) => a.played_at.localeCompare(b.played_at));
    const first = group.matches[0].played_at;
    const last = group.matches[group.matches.length - 1].played_at;
    group.subtitle = formatDateRange(first, last, timeZone);
    group.showDate =
      new Set(group.matches.map((m) => dayKeyFormat.format(new Date(m.played_at)))).size > 1;
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
