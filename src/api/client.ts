export const API_URL = import.meta.env.VITE_API_URL;

/**
 * A free-tier server can need about a minute to wake up, but a request must not hang forever
 * (a stuck one used to leave the page loading for minutes), so give up after this long.
 */
export const REQUEST_TIMEOUT_MS = 45_000;

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`API error ${response.status}`);
  }
  return response.json() as Promise<T>;
}
