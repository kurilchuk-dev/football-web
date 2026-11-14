import type { Match } from '@/api/types';

const LOCALE = 'uk-UA';

/** "сб, 14 лист." */
export function formatMatchDate(iso: string, timeZone?: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
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

export interface MatchDay {
  /** Local calendar day, "YYYY-MM-DD". */
  key: string;
  label: string;
  matches: Match[];
}

/** Groups matches by calendar day, keeping the order of the input list. */
export function groupMatchesByDay(matches: Match[], timeZone?: string): MatchDay[] {
  const keyFormat = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone,
  });

  const days: MatchDay[] = [];
  for (const match of matches) {
    const key = keyFormat.format(new Date(match.played_at));
    const last = days.at(-1);
    if (last && last.key === key) {
      last.matches.push(match);
    } else {
      days.push({ key, label: formatDayHeading(match.played_at, timeZone), matches: [match] });
    }
  }
  return days;
}
