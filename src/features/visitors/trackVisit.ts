import { API_URL } from '@/api/client';

const ID_KEY = 'visitor-id';
const REPORTED_KEY = 'visit-reported';

/** A random id for this browser. It says nothing about who the person is. */
function makeId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // Old browsers: build a version 4 UUID from random bytes.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** The id of this browser, made on the first visit; null when the storage is blocked. */
export function getVisitorId(): string | null {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = makeId();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    // Private mode or blocked storage: without a saved id one browser would be counted again and
    // again, so such a visit is simply not counted.
    return null;
  }
}

/**
 * Tells the API that this browser is here, so that the admin can count people and not IP
 * addresses. It happens once per browser session, in the background, and is skipped:
 * - in development,
 * - when the visitor has "Do Not Track" switched on,
 * - when the browser cannot keep an id.
 * A failure is ignored: counting visitors must never get in the way of the site.
 */
export function reportVisit(): void {
  if (!import.meta.env.PROD || navigator.doNotTrack === '1') return;
  try {
    if (sessionStorage.getItem(REPORTED_KEY)) return;
  } catch {
    // No session storage: the report is sent on every page load, which is fine.
  }
  const id = getVisitorId();
  if (!id) return;

  fetch(`${API_URL}/visitors/ping/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitor_id: id }),
    keepalive: true,
  })
    .then((response) => {
      if (!response.ok) return;
      try {
        sessionStorage.setItem(REPORTED_KEY, '1');
      } catch {
        // See above.
      }
    })
    .catch(() => undefined);
}

/** Reports the visit when the browser is idle, so that it never competes with the page's data. */
export function reportVisitWhenIdle(): void {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(reportVisit, { timeout: 5000 });
  } else {
    setTimeout(reportVisit, 2000);
  }
}
