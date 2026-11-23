/** Widths (in px) to request; about twice the largest size the image is shown at (retina). */
export const LOGO_WIDTH = 176;
export const PHOTO_WIDTH = 480;
/** The team photo is shown large, up to the screen width. */
export const TEAM_PHOTO_WIDTH = 1200;
/** The accent color is read from a 48px canvas, so a tiny copy is enough. */
export const ACCENT_SAMPLE_WIDTH = 96;

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/**
 * Asks Cloudinary for a resized copy in the best format the browser supports
 * (WebP/AVIF) instead of the multi-megabyte original that was uploaded.
 * Any other URL (e.g. local media in development) is returned as it is.
 */
export function optimizeImage(url: string, width: number): string {
  const match = CLOUDINARY_UPLOAD.exec(url);
  if (!match) return url;
  return `${match[1]}f_auto,q_auto,c_limit,w_${width}/${match[2]}`;
}
