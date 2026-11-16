import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/** How long a saved copy may be shown. Must not exceed the query cache's gcTime. */
export const PERSIST_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/** Change it when the shape of the API responses changes, so old saved data is dropped. */
export const PERSIST_BUSTER = 'v1';

function safeStorage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    // Storage blocked (private mode, disabled cookies): the cache just is not saved.
    return undefined;
  }
}

/**
 * Saves the fetched data in localStorage, so a returning visitor sees the last known table,
 * results and squad at once, even while the server is still waking up. Fresh data replaces it
 * in the background.
 */
export function createPersister() {
  return createSyncStoragePersister({ storage: safeStorage(), key: 'football-query-cache' });
}
