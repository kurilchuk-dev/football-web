import type { Plugin } from 'vite';
import { insertAfterCharset } from './preload.ts';

/** <link rel="preload"> tags for font files (paths as emitted by the build, without a slash). */
export function fontPreloadTags(files: string[]): string {
  return files
    .map((file) => `<link rel="preload" as="font" type="font/woff2" crossorigin href="/${file}">`)
    .join('\n    ');
}

/**
 * Starts downloading the fonts together with the script instead of after the first render
 * (the browser only learns which font files it needs once the page already uses them).
 * Lists every .woff2 that ended up in the build, i.e. the Latin and Cyrillic subsets.
 */
export function preloadFonts(): Plugin {
  return {
    name: 'preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const files = Object.keys(ctx.bundle ?? {}).filter((file) => file.endsWith('.woff2'));
        return files.length ? insertAfterCharset(html, fontPreloadTags(files)) : html;
      },
    },
  };
}
