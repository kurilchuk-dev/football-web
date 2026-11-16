import { useEffect, useState } from 'react';
import { reloadPage, reloadSafely } from './reload';
import { currentEntry, fetchLatestEntry } from './version';

/** How often a page that stays open and visible looks for a new version. */
export const CHECK_EVERY_MS = 15 * 60_000;
/** Coming back after at least this long counts as opening the app again: update at once. */
export const AWAY_RELOAD_MS = 60_000;

/**
 * Keeps an open page (above all an installed app, which has no reload button or pull-down)
 * up to date. It looks for a new release when the page comes back to the foreground, when the
 * connection returns, and every 15 minutes while it is visible.
 * - After a longer absence the page reloads by itself: it behaves like a freshly opened app.
 * - Otherwise it only reports `available`, so a reload never interrupts what the visitor is doing.
 */
export function useAppUpdate() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const running = currentEntry();
    if (!running) return; // dev server or tests: there is no build to compare with

    let hiddenAt = document.visibilityState === 'hidden' ? Date.now() : null;
    let stopped = false;

    const check = async (awayMs: number) => {
      const latest = await fetchLatestEntry();
      if (stopped || !latest || latest === running) return;
      if (awayMs >= AWAY_RELOAD_MS && reloadSafely()) return;
      setAvailable(true);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now();
        return;
      }
      const away = hiddenAt === null ? 0 : Date.now() - hiddenAt;
      hiddenAt = null;
      void check(away);
    };
    const onOnline = () => void check(0);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void check(0);
    }, CHECK_EVERY_MS);

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  return { available, update: reloadPage };
}
