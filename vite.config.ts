import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { crawlerFiles, socialImage } from './vite-plugins/seo.ts';

// Pages that should be in the sitemap (keep in sync with the routes in src/App.tsx).
const SITE_ROUTES = ['/', '/matches', '/standings', '/team'];

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [
      react(),
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
