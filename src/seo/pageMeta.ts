/**
 * Titles, descriptions and structured data of every page. The browser (usePageMeta) and the
 * build-time prerender use the same functions, so both always say the same thing.
 */
import type { Match, StandingRow } from '@/api/types';
import { formatDayHeading, hasDate, isPlayed } from '@/features/matches/utils';
import { matchPath, teamPath } from './slug';

export const SITE_NAME = 'Черкаси ФАМ';
export const SEASON = '2026/2027';
export const LEAGUE_FULL = `Чемпіонат Черкаського району з футзалу ${SEASON}`;

export interface PageMeta {
  /** The whole text of the browser tab. */
  title: string;
  description: string;
  /** Address of the page for the canonical link; omit to use the current one. */
  path?: string;
  /** Ask search engines not to index the page (e.g. the 404 page). */
  noindex?: boolean;
  /** schema.org objects of this page. */
  jsonLd?: object[];
}

export const STATIC_META = {
  home: {
    title: `${SITE_NAME}: футзал Черкаського району, матчі та таблиця`,
    description: `Футзальна команда «${SITE_NAME}» у чемпіонаті Черкаського району ${SEASON}: наступний матч, результати, турнірна таблиця та склад.`,
    path: '/',
  },
  matches: {
    title: `Футзал Черкаського району: матчі й результати · ${SITE_NAME}`,
    description: `Результати та календар ігор: ${LEAGUE_FULL}, по турах. Матчі команди «${SITE_NAME}».`,
    path: '/matches',
  },
  standings: {
    title: `Турнірна таблиця: футзал Черкаського району ${SEASON}`,
    description: `${LEAGUE_FULL}: турнірна таблиця з очками, різницею м’ячів і формою команд.`,
    path: '/standings',
  },
  team: {
    title: `Склад команди · ${SITE_NAME}`,
    description: `Гравці футзальної команди «${SITE_NAME}» сезону ${SEASON} та їхні номери.`,
    path: '/team',
  },
  about: {
    title: `Про команду · ${SITE_NAME}`,
    description: `«${SITE_NAME}»: футзальна команда з Черкас, учасник чемпіонату Черкаського району. Сторінка в Instagram і контакти.`,
    path: '/about',
  },
  privacy: {
    title: `Конфіденційність · ${SITE_NAME}`,
    description: 'Які технічні дані збирає сайт, навіщо і як довго вони зберігаються.',
    path: '/privacy',
  },
  notFound: {
    title: `Сторінку не знайдено · ${SITE_NAME}`,
    description: 'Такої сторінки немає.',
    noindex: true,
  },
} satisfies Record<string, PageMeta>;

/** "Темп 2:1 Барс" for a played match, "Темп — Барс" before it. */
export function matchTitle(match: Match): string {
  const middle = isPlayed(match) ? `${match.home_score}:${match.away_score}` : '—';
  return `${match.home_team.name} ${middle} ${match.away_team.name}`;
}

function eventData(match: Match, siteUrl: string): object | null {
  // schema.org requires a start date, so a match without one is not described.
  if (!hasDate(match)) return null;
  const team = (name: string) => ({ '@type': 'SportsTeam', name });
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${match.home_team.name} — ${match.away_team.name}`,
    sport: 'Futsal',
    startDate: match.played_at ?? match.date,
    homeTeam: team(match.home_team.name),
    awayTeam: team(match.away_team.name),
    ...(match.venue ? { location: { '@type': 'Place', name: match.venue } } : {}),
    ...(siteUrl ? { url: `${siteUrl}${matchPath(match)}` } : {}),
  };
}

function breadcrumbs(siteUrl: string, items: [name: string, path: string][]): object[] {
  if (!siteUrl) return [];
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map(([name, path], index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name,
        item: `${siteUrl}${path}`,
      })),
    },
  ];
}

export function matchMeta(match: Match, siteUrl = ''): PageMeta {
  const when = hasDate(match) ? formatDayHeading(match.date) : 'дата уточнюється';
  const round = match.round ? `, тур ${match.round}` : '';
  const event = eventData(match, siteUrl);
  return {
    title: `${matchTitle(match)}${round} · футзал`,
    description: `${matchTitle(match)} (${when}${round}). ${LEAGUE_FULL}: рахунок, дата, час і подробиці матчу.`,
    path: matchPath(match),
    jsonLd: [
      ...(event ? [event] : []),
      ...breadcrumbs(siteUrl, [
        [SITE_NAME, '/'],
        ['Матчі', '/matches'],
        [matchTitle(match), matchPath(match)],
      ]),
    ],
  };
}

export function opponentMeta(row: Pick<StandingRow, 'team'>, siteUrl = ''): PageMeta {
  const { name } = row.team;
  return {
    title: `${name}: матчі та місце в таблиці · футзал Черкаського району`,
    description: `Команда «${name}», ${LEAGUE_FULL}: місце в таблиці, результати та наступні матчі.`,
    path: teamPath(row.team),
    jsonLd: breadcrumbs(siteUrl, [
      [SITE_NAME, '/'],
      ['Таблиця', '/standings'],
      [name, teamPath(row.team)],
    ]),
  };
}
