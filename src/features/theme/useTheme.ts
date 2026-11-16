import { useCallback, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';

function readTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Current color theme plus a toggle; the choice is remembered in localStorage. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme);

  const toggle = useCallback(() => {
    const next: Theme = readTheme() === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage disabled: the choice just is not remembered.
    }
    setTheme(next);
  }, []);

  return { theme, toggle };
}
