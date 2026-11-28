/** Puts the content and the head tags of one page into the built index.html. */
import type { PageMeta } from './pageMeta';
import { canonicalUrl, STATE_ID } from './url';

const escapeText = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** JSON that cannot end the <script> element it is written into. */
const scriptJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');

export interface PageParts {
  meta: PageMeta & { path: string };
  siteUrl: string;
  /** The rendered content of #root. */
  body: string;
  /** The data the page was rendered with. */
  state: unknown;
  /** Stylesheets and scripts of the page's own code, as addresses from the site root. */
  styles?: string[];
  scripts?: string[];
}

function replaceOnce(html: string, pattern: RegExp, value: string): string {
  if (!pattern.test(html)) throw new Error(`index.html has no ${pattern}`);
  return html.replace(pattern, () => value);
}

export function buildPage(template: string, parts: PageParts): string {
  const { meta, siteUrl, body, state, styles = [], scripts = [] } = parts;
  const title = escapeText(meta.title);
  const description = escapeText(meta.description);
  const url = escapeText(canonicalUrl(siteUrl, meta.path));

  let html = replaceOnce(template, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = replaceOnce(
    html,
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${description}" />`,
  );
  html = replaceOnce(
    html,
    /<meta\s+property="og:title"[^>]*>/,
    `<meta property="og:title" content="${title}" />`,
  );
  html = replaceOnce(
    html,
    /<meta\s+property="og:description"[^>]*>/,
    `<meta property="og:description" content="${description}" />`,
  );

  const head = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:url" content="${url}" />`,
    ...(meta.jsonLd ?? []).map(
      (item) => `<script type="application/ld+json" data-page-ld="">${scriptJson(item)}</script>`,
    ),
    ...styles.map((href) => `<link rel="stylesheet" crossorigin href="${href}">`),
    ...scripts.map((href) => `<link rel="modulepreload" crossorigin href="${href}">`),
  ].join('\n    ');
  html = replaceOnce(html, /<\/head>/, `    ${head}\n  </head>`);

  return replaceOnce(
    html,
    /<div id="root"><\/div>/,
    `<div id="root">${body}</div>\n    <script type="application/json" id="${STATE_ID}" data-path="${escapeText(meta.path)}">${scriptJson(state)}</script>`,
  );
}

export function sitemap(siteUrl: string, paths: string[]): string {
  const urls = paths
    .map((path) => `  <url><loc>${escapeText(canonicalUrl(siteUrl, path))}</loc></url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
