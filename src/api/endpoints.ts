/** API paths of the data the pages ask for without filters, so they can be requested up front. */
export const ENDPOINTS = {
  teams: '/teams/',
  upcoming: '/matches/upcoming/',
  results: '/matches/results/',
  standings: '/standings/',
} as const;

/**
 * The data each route needs on its first render. index.html starts these requests while the
 * script is still loading, so the first paint does not wait for the script to download and run.
 * Keep it in step with the hooks that read these endpoints.
 */
export const ROUTE_PRELOADS: Record<string, string[]> = {
  '/': [ENDPOINTS.teams, ENDPOINTS.upcoming, ENDPOINTS.results, ENDPOINTS.standings],
  '/matches': [ENDPOINTS.teams, ENDPOINTS.results, ENDPOINTS.upcoming],
  '/standings': [ENDPOINTS.teams, ENDPOINTS.standings],
  '/team': [ENDPOINTS.teams],
};
