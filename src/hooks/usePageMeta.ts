import { useEffect } from 'react';

export const SITE_NAME = 'Черкаси ФАМ';

interface PageMeta {
  /** Page name; the site name is appended. Omit on the home page. */
  title?: string;
  description?: string;
  /** Ask search engines not to index the page (e.g. the 404 page). */
  noindex?: boolean;
}

function descriptionTag(): HTMLMetaElement | null {
  return document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
}

/** Canonical address of the current page, or undefined when the site address is not configured. */
function canonicalHref(): string | undefined {
  const site = import.meta.env.VITE_SITE_URL as string | undefined;
  if (!site) return undefined;
  const base = site.replace(/\/+$/, '');
  const path = window.location.pathname.replace(/\/+$/, '');
  return `${base}${path}`;
}

/**
 * Sets the tab title, description and canonical address of the current page and puts them back
 * when the page is left, so every route has its own title in the history and in search results.
 * One index.html serves all routes, so a canonical link cannot be written into it statically.
 */
export function usePageMeta({ title, description, noindex = false }: PageMeta = {}) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title ? `${title} · ${SITE_NAME}` : SITE_NAME;

    const tag = descriptionTag();
    const previousDescription = tag?.content;
    if (tag && description) tag.content = description;

    let robots: HTMLMetaElement | undefined;
    if (noindex) {
      robots = document.createElement('meta');
      robots.name = 'robots';
      robots.content = 'noindex';
      document.head.append(robots);
    }

    let canonical: HTMLLinkElement | undefined;
    const href = noindex ? undefined : canonicalHref();
    if (href) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = href;
      document.head.append(canonical);
    }

    return () => {
      document.title = previousTitle;
      if (tag && previousDescription !== undefined) tag.content = previousDescription;
      robots?.remove();
      canonical?.remove();
    };
  }, [title, description, noindex]);
}
