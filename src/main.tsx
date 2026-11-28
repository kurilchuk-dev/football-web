import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/global.css';
import { BrowserRouter } from 'react-router-dom';
import { hydrate } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { PERSIST_BUSTER, PERSIST_MAX_AGE_MS, createPersister } from './api/persist';
import { createQueryClient } from './api/queryClient';
import App from './App';
import { applyStoredAccent } from './features/theme/apply';
import { installPreloadErrorReload } from './features/update/reload';
import { reportVisitWhenIdle } from './features/visitors/trackVisit';
import { loadRoute } from './routes';
import { isSamePage, STATE_ID } from './seo/url';

// Club color from the previous visit, applied before the first paint.
applyStoredAccent();

// A page left open across a release recovers by reloading instead of showing a blank screen.
installPreloadErrorReload();

// Counts the visitor (once per session, when the browser is idle) for the admin statistics.
reportVisitWhenIdle();

const queryClient = createQueryClient();
const persister = createPersister();

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE_MS, buster: PERSIST_BUSTER }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PersistQueryClientProvider>
  </StrictMode>
);

// A page made by the build arrives with its HTML and its data: React takes it over. The data is
// from the build, so it is refetched at once if it is no longer fresh.
const saved = document.getElementById(STATE_ID);
if (saved?.textContent) hydrate(queryClient, JSON.parse(saved.textContent));
// Only the HTML of this very address is taken over; anything else is drawn from scratch.
if (saved && isSamePage(saved.dataset.path, window.location.pathname)) {
  // The page's code first, so the HTML stays on screen until React can take all of it over.
  void loadRoute(window.location.pathname)
    .catch(() => undefined)
    .then(() => hydrateRoot(root, app));
} else {
  createRoot(root).render(app);
}
