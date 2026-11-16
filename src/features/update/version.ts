/**
 * A build is identified by the file name of its main script (`/assets/index-<hash>.js`):
 * the hash changes with every release, so a different name in the fresh index.html means
 * that a new version of the site has been published.
 */
const ENTRY = /\/assets\/index-[\w-]+\.js/;

/** The entry script this page is running, or null (dev server, tests). */
export function currentEntry(): string | null {
  const script = document.querySelector('script[type="module"][src*="/assets/index-"]');
  const match = ENTRY.exec(script?.getAttribute('src') ?? '');
  return match ? match[0] : null;
}

/** The entry script named in an index.html. */
export function extractEntry(html: string): string | null {
  const match = ENTRY.exec(html);
  return match ? match[0] : null;
}

/** The entry script of the version that is published right now; null if it cannot be fetched. */
export async function fetchLatestEntry(): Promise<string | null> {
  try {
    const response = await fetch('/', { cache: 'no-store' });
    if (!response.ok) return null;
    return extractEntry(await response.text());
  } catch {
    return null;
  }
}
