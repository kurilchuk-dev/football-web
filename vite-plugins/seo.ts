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

/**
 * robots.txt always (otherwise Cloudflare Pages answers /robots.txt with index.html),
 * and sitemap.xml when VITE_SITE_URL is known, since sitemap addresses must be absolute.
 */
export function crawlerFiles(siteUrl: string | undefined, routes: string[]): Plugin {
  return {
    name: 'crawler-files',
    apply: 'build',
    generateBundle() {
      const base = siteUrl && trimSlash(siteUrl);
      const robots = ['User-agent: *', 'Allow: /'];
      if (base) robots.push('', `Sitemap: ${base}/sitemap.xml`);
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots.join('\n')}\n` });

      if (!base) return;
      const urls = routes.map((route) => `  <url><loc>${base}${route}</loc></url>`).join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
    },
  };
}
