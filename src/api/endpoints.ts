/** API paths of the data the pages ask for without filters, so they can be requested up front. */
export const ENDPOINTS = {
  teams: '/teams/',
  upcoming: '/matches/upcoming/',
  results: '/matches/results/',
  standings: '/standings/',
  /** Needs no team id, so it can be requested together with the teams. */
  ourPlayers: '/players/?our_team=true',
} as const;

/**
 * The data each route needs on its first render. index.html starts these requests while the
 * script is still loading, so the first paint does not wait for the script to download and run.
 * Keep it in step with the hooks that read these endpoints.
 */
export const ROUTE_PRELOADS: Record<string, string[]> = {
  '/': [
    ENDPOINTS.teams,
    ENDPOINTS.upcoming,
    ENDPOINTS.results,
    ENDPOINTS.standings,
    ENDPOINTS.ourPlayers,
  ],
  '/matches': [ENDPOINTS.teams, ENDPOINTS.results, ENDPOINTS.upcoming],
  // upcoming: the standings refresh on match days, which needs to know whether one is today.
  '/standings': [ENDPOINTS.teams, ENDPOINTS.standings, ENDPOINTS.upcoming],
  '/team': [ENDPOINTS.teams, ENDPOINTS.ourPlayers],
};
