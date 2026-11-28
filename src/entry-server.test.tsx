// @vitest-environment node
// The build has no window and no document: this test renders the pages the same way.
import { describe, expect, it } from 'vitest';
import type { Match, StandingRow, Team } from './api/types';
import { buildPage, renderPage, sitemap, sitePages, type SiteData } from './entry-server';
import { calculateStandings } from './features/standings/calculate';

const team = (id: number, name: string, ours = false) =>
  ({ id, name, city: '', is_our_team: ours, logo: null, photo: null }) as Team;
const ours = team(1, 'Черкаси ФАМ', true);
const rival = team(2, 'Темп');

const match = (id: number, scores: [number, number] | null) =>
  ({
    id,
    home_team: ours,
    away_team: rival,
    home_score: scores?.[0] ?? null,
    away_score: scores?.[1] ?? null,
    date: '2026-11-15',
    time: '14:00',
    played_at: '2026-11-15T14:00:00+02:00',
    round: 1,
    report: scores ? 'Перший абзац звіту.' : '',
    venue: '',
  }) as Match;

const data: SiteData = {
  teams: [ours, rival],
  results: [match(5, [3, 1])],
  upcoming: [match(6, null)],
  standings: calculateStandings([ours, rival] as unknown as StandingRow['team'][], [
    { id: 5, home_id: 1, away_id: 2, home_score: 3, away_score: 1, date: null, time: null },
  ]),
  players: [{ id: 1, first_name: 'Іван', last_name: 'Петренко', number: 7, photo: null }],
};

describe('prerender', () => {
  const pages = sitePages(data, 'https://example.com');

  it('lists a page for every match and every team', () => {
    expect(pages.map((page) => page.path)).toEqual([
      '/',
      '/matches',
      '/standings',
      '/team',
      '/about',
      '/privacy',
      '/matches/5-cherkasy-fam-temp',
      '/matches/6-cherkasy-fam-temp',
      '/teams/1-cherkasy-fam',
      '/teams/2-temp',
    ]);
  });

  it('renders the text of every page with exactly one h1', async () => {
    for (const page of pages) {
      const { body } = await renderPage(page.path, data);
      expect(body.match(/<h1/g), page.path).toHaveLength(1);
      expect(body, page.path).not.toContain('Завантаження');
    }
  });

  it('puts the score and the report into the match page', async () => {
    const { body } = await renderPage('/matches/5-cherkasy-fam-temp', data);
    expect(body).toContain('Черкаси ФАМ 3:1 Темп');
    expect(body).toContain('Перший абзац звіту.');
  });

  it('writes the head tags and escapes the data', () => {
    const template =
      '<head><title>x</title><meta name="description" content="x" />' +
      '<meta property="og:title" content="x" /><meta property="og:description" content="x" />' +
      '</head><body><div id="root"></div></body>';
    const html = buildPage(template, {
      meta: { title: 'A "B" $&', description: 'd', path: '/matches', jsonLd: [{ a: '</script>' }] },
      siteUrl: 'https://example.com',
      body: '<h1>$1</h1>',
      state: { evil: '</script>' },
    });
    expect(html).toContain('<title>A &quot;B&quot; $&amp;</title>');
    expect(html).toContain('<link rel="canonical" href="https://example.com/matches" />');
    expect(html).toContain('<div id="root"><h1>$1</h1></div>');
    expect(html.match(/<\/script>/g)).toHaveLength(2);
  });

  it('lists the pages in the sitemap', () => {
    expect(sitemap('https://example.com', ['/', '/team'])).toContain(
      '<loc>https://example.com/</loc></url>\n  <url><loc>https://example.com/team</loc>',
    );
  });
});
