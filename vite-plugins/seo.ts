import type { HtmlTagDescriptor, Plugin } from 'vite';

const trimSlash = (url: string) => url.replace(/\/+$/, '');

/**
 * Social preview tags that need an absolute address (crawlers ignore relative ones).
 * Only added when VITE_SITE_URL is set, e.g. https://example.pages.dev.
 */
export function socialImage(siteUrl: string | undefined): Plugin {
  return {
    name: 'social-image',
    apply: 'build',
    transformIndexHtml() {
      if (!siteUrl) return;
      const image = `${trimSlash(siteUrl)}/og-image.png`;
      const tags: HtmlTagDescriptor[] = [
        { tag: 'meta', attrs: { property: 'og:image', content: image } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: image } },
      ];
      return tags.map((tag) => ({ ...tag, injectTo: 'head' as const }));
    },
  };
}
