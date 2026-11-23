import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { PERSIST_STORAGE_KEY } from './config';

/** How long a saved copy may be shown. Must not exceed the query cache's gcTime. */
export const PERSIST_MAX_AGE_MS = 6 * 60 * 60 * 1000;

/**
 * Id of this build (set in vite.config.ts). Saved data of any other build is dropped, so a release
 * never shows data in the shape of the previous version. Tests and the dev server use 'dev'.
 */
export const PERSIST_BUSTER = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev';

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
  return createSyncStoragePersister({ storage: safeStorage(), key: PERSIST_STORAGE_KEY });
}
