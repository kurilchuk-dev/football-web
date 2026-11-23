import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/global.css';
import { BrowserRouter } from 'react-router-dom';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { PERSIST_BUSTER, PERSIST_MAX_AGE_MS, createPersister } from './api/persist';
import { createQueryClient } from './api/queryClient';
import App from './App';
import { applyStoredAccent } from './features/theme/apply';
import { installPreloadErrorReload } from './features/update/reload';
import { reportVisitWhenIdle } from './features/visitors/trackVisit';

// Club color from the previous visit, applied before the first paint.
applyStoredAccent();

// A page left open across a release recovers by reloading instead of showing a blank screen.
installPreloadErrorReload();

// Counts the visitor (once per session, when the browser is idle) for the admin statistics.
reportVisitWhenIdle();

const queryClient = createQueryClient();
const persister = createPersister();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE_MS, buster: PERSIST_BUSTER }}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PersistQueryClientProvider>
  </StrictMode>,
);
