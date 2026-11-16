/**
 * Loaders of the lazily loaded pages. App uses them for React.lazy, and the menu calls them
 * early (on hover) so the page's code is already downloaded when the link is clicked.
 * The home page is not here: it is in the main bundle.
 */
export const loadMatchesPage = () =>
  import('@/pages/MatchesPage/MatchesPage').then((m) => ({ default: m.MatchesPage }));

export const loadStandingsPage = () =>
  import('@/pages/StandingsPage/StandingsPage').then((m) => ({ default: m.StandingsPage }));

export const loadTeamPage = () =>
  import('@/pages/TeamPage/TeamPage').then((m) => ({ default: m.TeamPage }));
