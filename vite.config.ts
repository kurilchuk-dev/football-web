import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { loadEnv, type HtmlTagDescriptor, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { crawlerFiles, socialImage } from './vite-plugins/seo.ts';

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

// Pages that should be in the sitemap (keep in sync with the routes in src/App.tsx).
const SITE_ROUTES = ['/', '/matches', '/standings', '/team'];

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [
      react(),
      preconnect(env.VITE_API_URL),
      socialImage(env.VITE_SITE_URL),
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
