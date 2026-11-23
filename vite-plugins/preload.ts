import type { Plugin } from 'vite';

export interface PreloadOptions {
  apiUrl: string;
  /** Route path -> API paths that route requests on its first render. */
  routes: Record<string, string[]>;
  /** A saved copy of the data younger than this needs no request (the app will not refetch). */
  freshMs: number;
  /** localStorage key of the saved query cache. */
  storageKey: string;
  /** Build id the saved cache must carry to count as usable (a cache of another build is dropped). */
  buster?: string;
}

/**
 * Source of a tiny inline script for index.html. It starts the API requests of the current page
 * right away, instead of waiting for the main script to download and run, and the app's own
 * fetch() then takes the already running request. Skipped when the saved cache is still fresh,
 * because then the app makes no request and the preloaded response would be wasted.
 */
export function preloadScript({
  apiUrl,
  routes,
  freshMs,
  storageKey,
  buster,
}: PreloadOptions): string {
  const base = apiUrl.replace(/\/+$/, '');
  return `(function(){try{
var saved=localStorage.getItem(${JSON.stringify(storageKey)});
var at=saved?saved.indexOf('"timestamp":'):-1;
var usable=${buster === undefined ? 'true' : `saved.indexOf(${JSON.stringify(`"buster":${JSON.stringify(buster)}`)})>=0`};
if(usable&&at>=0&&Date.now()-parseInt(saved.slice(at+12),10)<${freshMs})return;
var path=location.pathname;
while(path.length>1&&path.charAt(path.length-1)==='/')path=path.slice(0,-1);
var list=${JSON.stringify(routes)}[path];
if(!list)return;
for(var i=0;i<list.length;i++){
var link=document.createElement('link');
link.setAttribute('rel','preload');link.setAttribute('as','fetch');
link.setAttribute('crossorigin','anonymous');
link.setAttribute('href',${JSON.stringify(base)}+list[i]);
document.head.appendChild(link);}
}catch(e){}})();`;
}

/**
 * Puts a snippet right after <meta charset> (which must stay within the first 1024 bytes) and
 * so before the stylesheet: an inline script after a stylesheet waits for it to load, and the
 * browser should find the preload hints as early as possible.
 */
export function insertAfterCharset(html: string, snippet: string): string {
  const meta = html.indexOf('<meta charset');
  const end = meta < 0 ? -1 : html.indexOf('>', meta);
  if (end < 0) return html;
  return `${html.slice(0, end + 1)}\n    ${snippet}${html.slice(end + 1)}`;
}

export function insertPreloadScript(html: string, script: string): string {
  return insertAfterCharset(html, `<script>${script}</script>`);
}

/** Adds the API preload script to the built index.html. Needs VITE_API_URL, else does nothing. */
export function preloadApiData(
  apiUrl: string | undefined,
  options: Omit<PreloadOptions, 'apiUrl'>,
): Plugin {
  return {
    name: 'preload-api-data',
    apply: 'build',
    transformIndexHtml(html) {
      if (!apiUrl) return;
      return insertPreloadScript(html, preloadScript({ apiUrl, ...options }));
    },
  };
}
