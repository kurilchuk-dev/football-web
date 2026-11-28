import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False while the build renders a page and while the browser takes that HTML over (hydration),
 * true afterwards and on every later page. Use it for anything the build cannot know (the time,
 * the browser, the address query), so that the first render in the browser matches the built HTML.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
