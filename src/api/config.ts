/** How long fetched data counts as fresh (no refetch while it is). */
export const STALE_TIME_MS = 2 * 60_000;

/** localStorage key of the saved query cache. */
export const PERSIST_STORAGE_KEY = 'football-query-cache';
