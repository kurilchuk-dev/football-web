import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { loadEnv, type HtmlTagDescriptor, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { PERSIST_STORAGE_KEY, STALE_TIME_MS } from './src/api/config.ts';
import { ROUTE_PRELOADS } from './src/api/endpoints.ts';
import { preloadFonts } from './vite-plugins/fonts.ts';
import { preloadApiData } from './vite-plugins/preload.ts';
import { crawlerFiles, socialImage, structuredData } from './vite-plugins/seo.ts';

/**
 * Opens the connections to the API and to Cloudinary while the page is still
 * loading, so the first requests do not wait for DNS + TLS after the script runs.
 */
function preconnect(apiUrl: string | undefined): Plugin {
  return {
    name: 'preconnect-origins',
    apply: 'build',
    transformIndexHtml() {
      const tags: HtmlTagDescriptor[] = [
        // Plain <img> requests use a different connection pool than CORS ones.
        { tag: 'link', attrs: { rel: 'preconnect', href: 'https://res.cloudinary.com' } },
      ];
      if (apiUrl) {
        // fetch() to the API is a CORS request, so the hint needs `crossorigin`.
        tags.push({
          tag: 'link',
          attrs: { rel: 'preconnect', href: new URL(apiUrl).origin, crossorigin: '' },
        });
      }
      return tags.map((tag) => ({ ...tag, injectTo: 'head-prepend' as const }));
    },
  };
}

// Sitemap of a build without prerender; the prerender replaces it with every page.
const SITE_ROUTES = ['/', '/matches', '/standings', '/team'];

/**
 * Identifies this build. It is the persisted-cache buster, so every release drops the data that
 * the previous version saved in localStorage. Cloudflare Pages gives the commit hash; elsewhere
 * (a local build) the build time does the same job.
 */
const BUILD_ID = (process.env.CF_PAGES_COMMIT_SHA ?? Date.now().toString(36)).slice(0, 12);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    define: { __BUILD_ID__: JSON.stringify(BUILD_ID) },
    // scripts/prerender.mjs reads which files belong to which page.
    build: { manifest: true },
    plugins: [
      react(),
      preconnect(env.VITE_API_URL),
      preloadFonts(),
      preloadApiData(env.VITE_API_URL, {
        routes: ROUTE_PRELOADS,
        freshMs: STALE_TIME_MS,
        storageKey: PERSIST_STORAGE_KEY,
        buster: BUILD_ID,
      }),
      socialImage(env.VITE_SITE_URL),
      structuredData(env.VITE_SITE_URL),
      crawlerFiles(env.VITE_SITE_URL, SITE_ROUTES),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/test-setup.ts',
      css: false,
    },
  };
});
