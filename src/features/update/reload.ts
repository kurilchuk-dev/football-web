const KEY = 'last-update-reload';
/** Two automatic reloads closer than this are a loop (e.g. an out-of-date cache), so the second is skipped. */
const MIN_GAP_MS = 30_000;

/** Reloads the page now (what the visitor asked for by pressing "Update"). */
export function reloadPage() {
  window.location.reload();
}

/**
 * Reloads the page on our own initiative, unless we already did a moment ago.
 * Returns whether it reloaded.
 */
export function reloadSafely(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY));
    if (last && Date.now() - last < MIN_GAP_MS) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // No session storage: reload anyway, the next check finds the same version and stops.
  }
  reloadPage();
  return true;
}

/**
 * After a release the files of the old version are gone. A page that was left open (typically an
 * installed app) then fails to load a lazy page chunk: reload it to get the new version.
 */
export function installPreloadErrorReload() {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    reloadSafely();
  });
}
