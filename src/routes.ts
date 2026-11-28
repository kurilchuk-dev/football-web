/**
 * The lazily loaded pages. App renders them, the menu downloads them early (on hover) so their
 * code is there when the link is clicked, and main.tsx downloads the one of a built page before
 * React takes it over. The home page is not here: it is in the main bundle.
 */
import { lazyPage } from './lazyPage';

export const matchesPage = lazyPage(() =>
  import('@/pages/MatchesPage/MatchesPage').then((m) => ({ default: m.MatchesPage })),
);
export const standingsPage = lazyPage(() =>
  import('@/pages/StandingsPage/StandingsPage').then((m) => ({ default: m.StandingsPage })),
);
export const teamPage = lazyPage(() =>
  import('@/pages/TeamPage/TeamPage').then((m) => ({ default: m.TeamPage })),
);
export const matchPage = lazyPage(() =>
  import('@/pages/MatchPage/MatchPage').then((m) => ({ default: m.MatchPage })),
);
export const opponentPage = lazyPage(() =>
  import('@/pages/OpponentPage/OpponentPage').then((m) => ({ default: m.OpponentPage })),
);
export const aboutPage = lazyPage(() =>
  import('@/pages/AboutPage/AboutPage').then((m) => ({ default: m.AboutPage })),
);
export const privacyPage = lazyPage(() =>
  import('@/pages/PrivacyPage/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
);

export const loadMatchesPage = matchesPage.preload;
export const loadStandingsPage = standingsPage.preload;
export const loadTeamPage = teamPage.preload;

/** Downloads the code of the page at this address (nothing for the home page). */
export function loadRoute(path: string): Promise<unknown> {
  const [, section = '', item] = path.split('/');
  if (section === 'matches') return (item ? matchPage : matchesPage).preload();
  const pages: Record<string, { preload: () => Promise<unknown> }> = {
    standings: standingsPage,
    team: teamPage,
    teams: opponentPage,
    about: aboutPage,
    privacy: privacyPage,
  };
  return pages[section]?.preload() ?? Promise.resolve();
}
