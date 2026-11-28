/**
 * Runs after `vite build`: writes a ready HTML file for every page of the site, with the data of
 * the API, plus the full sitemap and 404.html.
 *
 * It runs only where the site address and the API address are set (production). When the API
 * cannot be read, the build FAILS: the previous release stays online instead of empty pages.
 * PRERENDER=off skips it.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { build, loadEnv } from 'vite';

const env = loadEnv('production', process.cwd(), 'VITE_');
const siteUrl = (env.VITE_SITE_URL ?? '').replace(/\/+$/, '');
const apiUrl = (env.VITE_API_URL ?? '').replace(/\/+$/, '');

if (process.env.PRERENDER === 'off' || !siteUrl || !apiUrl) {
  console.log('prerender: skipped (needs VITE_SITE_URL and VITE_API_URL)');
  process.exit(0);
}

const ENDPOINTS = {
  teams: '/teams/',
  upcoming: '/matches/upcoming/',
  results: '/matches/results/',
  standings: '/standings/',
  players: '/players/?our_team=true',
};

const pause = (ms) => new Promise((done) => setTimeout(done, ms));

/** The free server may be asleep and need a minute to wake up, so it is asked several times. */
async function get(path, attempts = 6) {
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(`${apiUrl}${path}`, { signal: AbortSignal.timeout(90_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === attempts) throw new Error(`prerender: cannot read ${path}`, { cause: error });
      console.log(`prerender: ${path} failed (${error.message}), trying again`);
      await pause(15_000);
    }
  }
}

const data = {};
for (const [name, path] of Object.entries(ENDPOINTS)) data[name] = await get(path);
if (data.teams.length === 0) throw new Error('prerender: the API has no teams');

await build({
  logLevel: 'warn',
  build: { ssr: 'src/entry-server.tsx', outDir: 'dist-ssr', emptyOutDir: true },
});
const server = await import(pathToFileURL(resolve('dist-ssr/entry-server.js')));

const template = await readFile('dist/index.html', 'utf8');
const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'));

/** The CSS and JS files of a lazily loaded page, without those the main bundle already has. */
function assets(source) {
  const styles = new Set();
  const scripts = new Set();
  const seen = new Set();
  const visit = (key) => {
    const chunk = manifest[key];
    if (!chunk || chunk.isEntry || seen.has(key)) return;
    seen.add(key);
    scripts.add(`/${chunk.file}`);
    chunk.css?.forEach((file) => styles.add(`/${file}`));
    chunk.imports?.forEach(visit);
  };
  if (source) {
    if (!manifest[source]) throw new Error(`prerender: ${source} is not in the build manifest`);
    visit(source);
  }
  return { styles: [...styles], scripts: [...scripts] };
}

const fileOf = (path) => (path === '/' ? 'dist/index.html' : `dist${path}.html`);

const pages = server.sitePages(data, siteUrl);
for (const page of pages) {
  const { body, state } = await server.renderPage(page.path, data);
  const html = server.buildPage(template, {
    meta: page,
    siteUrl,
    body,
    state,
    ...assets(page.source),
  });
  const file = fileOf(page.path);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}

// With a 404.html the hosting answers unknown addresses with 404 instead of the home page. It is
// the empty app, so a page added after this build still opens (until the next one).
await writeFile('dist/404.html', template);
await writeFile(
  'dist/sitemap.xml',
  server.sitemap(
    siteUrl,
    pages.map((page) => page.path),
  ),
);
await rm('dist-ssr', { recursive: true, force: true });
console.log(`prerender: ${pages.length} pages`);
