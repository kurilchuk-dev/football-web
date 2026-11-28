import { lazy, useState, type ComponentType } from 'react';

type Module = { default: ComponentType };

/**
 * React.lazy for a page, with one difference: once the code is downloaded, the page renders at
 * once. React.lazy alone suspends even then, and while React is taking over a built page that
 * makes it throw the built HTML away and draw the page again.
 */
export function lazyPage(load: () => Promise<Module>) {
  let loaded: ComponentType | undefined;
  const preload = () =>
    load().then((module) => {
      loaded = module.default;
      return module;
    });
  const Lazy = lazy(preload);

  function Page() {
    // Chosen once, so the page is not mounted again when the download finishes.
    const [Component] = useState<ComponentType>(() => loaded ?? Lazy);
    return <Component />;
  }

  return { Page, preload };
}
