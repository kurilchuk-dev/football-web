import { useEffect } from 'react';
import type { PageMeta } from '@/seo/pageMeta';
import { canonicalUrl, siteUrl } from '@/seo/url';

/** The element in <head>, made if the page does not have it yet. */
function headElement<K extends 'meta' | 'link'>(
  tag: K,
  name: string,
  value: string,
): HTMLElementTagNameMap[K] {
  const found = document.head.querySelector<HTMLElementTagNameMap[K]>(`${tag}[${name}="${value}"]`);
  if (found) return found;
  const element = document.createElement(tag);
  element.setAttribute(name, value);
  document.head.append(element);
  return element;
}

/**
 * Sets the title, description, canonical address, social preview texts and structured data of the
 * current page. The built HTML already has them; this keeps them right while the visitor moves
 * between pages without reloading.
 */
export function usePageMeta({ title, description, path, noindex = false, jsonLd }: PageMeta) {
  // The objects are made on every render, so they are compared by their text.
  const data = JSON.stringify(jsonLd ?? []);

  useEffect(() => {
    document.title = title;
    headElement('meta', 'name', 'description').content = description;

    const og = (property: string, content: string) => {
      headElement('meta', 'property', property).content = content;
    };
    og('og:title', title);
    og('og:description', description);

    if (noindex) headElement('meta', 'name', 'robots').content = 'noindex';
    else document.head.querySelector('meta[name="robots"]')?.remove();

    const site = siteUrl();
    if (site && !noindex) {
      const href = canonicalUrl(site, path ?? window.location.pathname);
      headElement('link', 'rel', 'canonical').href = href;
      og('og:url', href);
    } else {
      document.head.querySelector('link[rel="canonical"]')?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }

    document.head.querySelectorAll('script[data-page-ld]').forEach((script) => script.remove());
    for (const item of JSON.parse(data) as object[]) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.pageLd = '';
      script.textContent = JSON.stringify(item);
      document.head.append(script);
    }
  }, [title, description, path, noindex, data]);
}
