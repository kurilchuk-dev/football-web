import { useCallback, useEffect, useRef, useState } from 'react';
import type { StandingRow } from '@/api/types';
import { imageFileName, renderStandingsImage } from '../../image';
import { ImagePreview } from './ImagePreview';
import styles from './StandingsImageActions.module.css';

interface StandingsImageActionsProps {
  rows: StandingRow[];
}

/** Phones and tablets (the main pointer is a finger): there a picture belongs in the gallery. */
function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(pointer: coarse)').matches);
}

function canShare(file: File): boolean {
  try {
    return typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

function makeImage(rows: StandingRow[]) {
  const site = import.meta.env.VITE_SITE_URL as string | undefined;
  let footer = window.location.host;
  try {
    if (site) footer = new URL(site).host;
  } catch {
    // An invalid address in the settings: the current host is fine.
  }
  const dateLabel = `станом на ${new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())}`;
  return renderStandingsImage(rows, { dateLabel, footer });
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * One "Import" button under the table that turns it into a picture.
 * - Computer: the PNG file is downloaded.
 * - Phone or tablet: the system share sheet opens with the picture, where "Save image" puts it
 *   into the gallery. If the browser cannot share files, the picture is shown full screen with
 *   a hint to press and hold it (the browser's own "save image" does the rest).
 */
export function StandingsImageActions({ rows }: StandingsImageActionsProps) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const prepared = useRef<{ rows: StandingRow[]; image: Promise<Blob> } | null>(null);

  /** The picture of these rows, drawn once and reused (also by a click that comes later). */
  const prepare = useCallback(() => {
    let entry = prepared.current;
    if (!entry || entry.rows !== rows) {
      const image = makeImage(rows);
      const created = { rows, image };
      entry = created;
      prepared.current = created;
      // A failed picture is not kept, so the next click tries again.
      image.catch(() => {
        if (prepared.current === created) prepared.current = null;
      });
    }
    return entry.image;
  }, [rows]);

  // On touch devices the share sheet must open right in the tap (browsers refuse it after a long
  // wait), so draw the picture in advance, as soon as the button comes into view.
  useEffect(() => {
    const element = button.current;
    if (!element || !isTouchDevice() || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void prepare().catch(() => undefined);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [prepare]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const importImage = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const blob = await prepare();
      const name = imageFileName();
      if (!isTouchDevice()) {
        download(blob, name);
        return;
      }
      const file = new File([blob], name, { type: 'image/png' });
      if (canShare(file)) {
        try {
          await navigator.share({ files: [file], title: 'Турнірна таблиця' });
          return;
        } catch (error) {
          // Closing the share sheet is not an error and needs no follow-up.
          if (error instanceof DOMException && error.name === 'AbortError') return;
          // Sharing was refused (for example the tap was too long ago): show the picture instead.
        }
      }
      setPreview(URL.createObjectURL(blob));
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.actions}>
      <button
        ref={button}
        type="button"
        className={styles.button}
        onClick={importImage}
        disabled={busy}
        aria-label="Імпортувати таблицю як картинку"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v12m0 0-4-4m4 4 4-4M4 20h16" />
        </svg>
        {busy ? 'Створюю картинку…' : 'Імпортувати'}
      </button>
      {failed && (
        <span className={styles.error} role="alert">
          Не вдалося створити картинку. Спробуйте ще раз.
        </span>
      )}
      {preview && <ImagePreview src={preview} onClose={() => setPreview(null)} />}
    </div>
  );
}
