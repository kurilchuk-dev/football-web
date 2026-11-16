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

// Club color from the previous visit, applied before the first paint.
applyStoredAccent();

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
