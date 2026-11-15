import type { Accent } from './accent';

const STORAGE_KEY = 'club-accent';

interface StoredAccent extends Accent {
  /** The logo URL the colors were taken from. */
  logo: string;
}

/** Sets (or, with null, resets to the stylesheet default) the site-wide accent. */
export function applyAccent(accent: Accent | null) {
  const style = document.documentElement.style;
  if (accent) {
    style.setProperty('--accent', accent.accent);
    style.setProperty('--on-accent', accent.onAccent);
  } else {
    style.removeProperty('--accent');
    style.removeProperty('--on-accent');
  }
}

export function readStoredAccent(): StoredAccent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAccent) : null;
  } catch {
    return null;
  }
}

export function storeAccent(value: StoredAccent | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode / storage disabled: the color is just recalculated next time.
  }
}

/** Applies the last known club color before the first paint, so there is no color flash. */
export function applyStoredAccent() {
  const stored = readStoredAccent();
  if (stored) applyAccent(stored);
}
