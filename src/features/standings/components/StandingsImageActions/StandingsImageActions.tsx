import { useState } from 'react';
import type { StandingRow } from '@/api/types';
import { imageFileName, renderStandingsImage } from '../../image';
import styles from './StandingsImageActions.module.css';

interface StandingsImageActionsProps {
  rows: StandingRow[];
}

type Busy = 'download' | 'share' | null;

/** True when the browser can share a file (mostly phones): the share sheet saves it to the gallery. */
function canShareFiles(): boolean {
  try {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File([], 'table.png', { type: 'image/png' })] })
    );
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

/** Buttons to save the table as a picture (for chats and social networks) or to share it. */
export function StandingsImageActions({ rows }: StandingsImageActionsProps) {
  const [busy, setBusy] = useState<Busy>(null);
  const [failed, setFailed] = useState(false);
  const [shareable] = useState(canShareFiles);

  const run = async (kind: Exclude<Busy, null>) => {
    setBusy(kind);
    setFailed(false);
    try {
      const blob = await makeImage(rows);
      const name = imageFileName();
      if (kind === 'share') {
        const file = new File([blob], name, { type: 'image/png' });
        await navigator.share({ files: [file], title: 'Турнірна таблиця' });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } catch (error) {
      // Closing the share sheet is not an error.
      if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={styles.button}
        onClick={() => run('download')}
        disabled={busy !== null}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3v12m0 0-4-4m4 4 4-4M4 20h16" />
        </svg>
        {busy === 'download' ? 'Створюю картинку…' : 'Завантажити картинку'}
      </button>
      {shareable && (
        <button
          type="button"
          className={styles.button}
          onClick={() => run('share')}
          disabled={busy !== null}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 16V4m0 0-4 4m4-4 4 4M5 13v6h14v-6" />
          </svg>
          {busy === 'share' ? 'Створюю картинку…' : 'Поділитись'}
        </button>
      )}
      {failed && (
        <span className={styles.error} role="alert">
          Не вдалося створити картинку. Спробуйте ще раз.
        </span>
      )}
    </div>
  );
}
