import { useEffect } from 'react';
import { pickAccent, type Accent } from './accent';
import { applyAccent, readStoredAccent, storeAccent } from './apply';

const SAMPLE_SIZE = 48;

/** Reads the logo's pixels on a small canvas. Resolves null if it cannot be read. */
function sampleLogo(url: string): Promise<Accent | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return resolve(null);
        context.drawImage(image, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        resolve(pickAccent(context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data));
      } catch {
        // Tainted canvas: the server did not send CORS headers for the logo.
        resolve(null);
      }
    };
    image.onerror = () => resolve(null);
    // A separate cache key: a plain <img> may already have cached this URL without CORS headers.
    image.src = `${url}${url.includes('?') ? '&' : '?'}accent`;
  });
}

/**
 * Colors the site with the club's logo.
 * `undefined` = the team is still loading (keep whatever is applied),
 * `null` = no logo (back to the default accent), string = the logo URL.
 */
export function useAccentFromLogo(logo: string | null | undefined) {
  useEffect(() => {
    if (logo === undefined) return;
    if (logo === null) {
      applyAccent(null);
      storeAccent(null);
      return;
    }

    const stored = readStoredAccent();
    if (stored?.logo === logo) {
      applyAccent(stored);
      return;
    }

    let cancelled = false;
    sampleLogo(logo).then((accent) => {
      if (cancelled) return;
      applyAccent(accent);
      storeAccent(accent && { ...accent, logo });
    });
    return () => {
      cancelled = true;
    };
  }, [logo]);
}
