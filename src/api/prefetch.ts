import type { QueryClient } from '@tanstack/react-query';
import { resultsQuery, upcomingQuery } from '@/features/matches/api';
import { standingsQuery } from '@/features/standings/api';
import { teamsQuery } from '@/features/teams/api';
import { loadMatchesPage, loadStandingsPage, loadTeamPage } from '@/routes';

interface RoutePrefetch {
  /** Downloads the page's code (absent for the home page, which is in the main bundle). */
  load?: () => Promise<unknown>;
  /** Fetches the data the page asks for on its first render (fresh data is not fetched again). */
  queries: (client: QueryClient) => Promise<unknown>[];
}

const routes: Record<string, RoutePrefetch> = {
  '/': {
    queries: (client) => [
      client.prefetchQuery(teamsQuery()),
      client.prefetchQuery(upcomingQuery()),
      client.prefetchQuery(resultsQuery()),
      client.prefetchQuery(standingsQuery()),
    ],
  },
  '/matches': {
    load: loadMatchesPage,
    queries: (client) => [
      client.prefetchQuery(teamsQuery()),
      client.prefetchQuery(resultsQuery()),
      client.prefetchQuery(upcomingQuery()),
    ],
  },
  '/standings': {
    load: loadStandingsPage,
    queries: (client) => [
      client.prefetchQuery(teamsQuery()),
      client.prefetchQuery(standingsQuery()),
    ],
  },
  '/team': {
    load: loadTeamPage,
    queries: (client) => [client.prefetchQuery(teamsQuery())],
  },
};

/** Warms up a page before the visitor opens it, e.g. while the pointer is over its menu link. */
export function prefetchRoute(client: QueryClient, path: string): Promise<unknown> {
  const route = routes[path];
  if (!route) return Promise.resolve();
  // A failed warm-up must never surface: the page itself will fetch what it needs.
  return Promise.all([route.load?.(), ...route.queries(client)]).catch(() => undefined);
}
