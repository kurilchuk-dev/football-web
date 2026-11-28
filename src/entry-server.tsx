/**
 * Renders every page of the site to HTML during the build (see scripts/prerender.mjs), so search
 * engines and link previews get the text without running any script.
 */
import { dehydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { prerender } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom';
import type { Match, Player, StandingRow, Team } from './api/types';
import App from './App';
import { resultsQuery, upcomingQuery } from './features/matches/queries';
import { ourPlayersQuery } from './features/players/api';
import { standingsQuery } from './features/standings/api';
import { teamsQuery } from './features/teams/api';
import { matchMeta, opponentMeta, STATIC_META, type PageMeta } from './seo/pageMeta';

export { buildPage, sitemap } from './seo/html';

export interface SiteData {
  teams: Team[];
  upcoming: Match[];
  results: Match[];
  standings: StandingRow[];
  players: Player[];
}

export type SitePage = PageMeta & {
  path: string;
  /** Source file of the lazily loaded page; absent for the home page. */
  source?: string;
};

const source = (name: string) => `src/pages/${name}/${name}.tsx`;

/** Every address that gets its own HTML file. */
export function sitePages(data: SiteData, siteUrl: string): SitePage[] {
  const matches = [...data.results, ...data.upcoming];
  return [
    STATIC_META.home,
    { ...STATIC_META.matches, source: source('MatchesPage') },
    { ...STATIC_META.standings, source: source('StandingsPage') },
    { ...STATIC_META.team, source: source('TeamPage') },
    { ...STATIC_META.about, source: source('AboutPage') },
    { ...STATIC_META.privacy, source: source('PrivacyPage') },
    ...matches.map((match) => ({
      ...(matchMeta(match, siteUrl) as SitePage),
      source: source('MatchPage'),
    })),
    ...data.standings.map((row) => ({
      ...(opponentMeta(row, siteUrl) as SitePage),
      source: source('OpponentPage'),
    })),
  ];
}

/** The HTML of #root for one address, and the data the browser needs to take it over. */
export async function renderPage(path: string, data: SiteData) {
  const client = new QueryClient();
  client.setQueryData(teamsQuery().queryKey, data.teams);
  client.setQueryData(upcomingQuery().queryKey, data.upcoming);
  client.setQueryData(resultsQuery().queryKey, data.results);
  client.setQueryData(standingsQuery().queryKey, data.standings);
  client.setQueryData(ourPlayersQuery().queryKey, data.players);

  const errors: unknown[] = [];
  const { prelude } = await prerender(
    <StrictMode>
      <QueryClientProvider client={client}>
        <StaticRouter location={path}>
          <App />
        </StaticRouter>
      </QueryClientProvider>
    </StrictMode>,
    {
      // Never move parts of a long page into separate hidden blocks.
      progressiveChunkSize: Number.POSITIVE_INFINITY,
      onError: (error: unknown) => {
        errors.push(error);
      },
    },
  );
  const body = await new Response(prelude).text();
  if (errors.length > 0) throw new Error(`Cannot render ${path}`, { cause: errors[0] });

  const state = dehydrate(client);
  client.clear();
  return { body, state };
}
