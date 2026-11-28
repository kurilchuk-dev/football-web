import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';
const listeners = new Set<() => void>();

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Current color theme plus a toggle; the choice is remembered in localStorage. */
export function useTheme() {
  // The built page does not know the visitor's choice, so it is made with the default theme.
  const theme = useSyncExternalStore(subscribe, readTheme, (): Theme => 'dark');

  const toggle = useCallback(() => {
    const next: Theme = readTheme() === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage disabled: the choice just is not remembered.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { theme, toggle };
}
