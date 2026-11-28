/** Address of the site without a slash at the end; empty when it is not configured. */
export function siteUrl(): string {
  return ((import.meta.env.VITE_SITE_URL as string | undefined) ?? '').replace(/\/+$/, '');
}

/** Full canonical address of a page ("/" keeps its slash, other pages have none). */
export function canonicalUrl(site: string, path: string): string {
  return `${site}${path.replace(/\/+$/, '') || '/'}`;
}

/** Id of the element with the data a built page was made from. */
export const STATE_ID = 'query-state';

/** Whether HTML built for `built` belongs to the address `current` (a slash at the end aside). */
export function isSamePage(built: string | undefined, current: string): boolean {
  const trim = (path: string) => path.replace(/\/+$/, '') || '/';
  return built !== undefined && trim(built) === trim(current);
}
