import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Match } from '@/api/types';
import { LEAGUE_NAME } from '@/features/standings/constants';
import { canShareFile, downloadBlob, isTouchDevice, siteHost } from '@/lib/canvas';
import { announcementFileName, renderAnnouncementImage } from '../../announcement';
import styles from './AnnouncementDialog.module.css';

interface AnnouncementDialogProps {
  match: Match;
  onClose: () => void;
}

/**
 * The announcement picture of one match over the page, with buttons to share or save it.
 * The picture is drawn when the dialog opens. The share sheet opens from a button, because
 * browsers allow it only right after a tap and only for a picture that is already made.
 */
export function AnnouncementDialog({ match, onClose }: AnnouncementDialogProps) {
  const close = useRef<HTMLButtonElement>(null);
  const [image, setImage] = useState<{ blob: Blob; url: string; file: File } | null>(null);
  const [failed, setFailed] = useState(false);
  const title = `${match.home_team.name} — ${match.away_team.name}`;

  useEffect(() => {
    let url: string | null = null;
    let stopped = false;
    renderAnnouncementImage(match, { leagueName: LEAGUE_NAME, footer: siteHost() })
      .then((blob) => {
        if (stopped) return;
        url = URL.createObjectURL(blob);
        const file = new File([blob], announcementFileName(match), { type: 'image/png' });
        setImage({ blob, url, file });
      })
      .catch(() => {
        if (!stopped) setFailed(true);
      });
    return () => {
      stopped = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [match]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    close.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [onClose]);

  const sharable = image ? canShareFile(image.file) : false;

  const share = async () => {
    if (!image) return;
    try {
      await navigator.share({ files: [image.file], title });
    } catch (error) {
      // Closing the share sheet is not an error; "Завантажити" stays as the way to get the file.
      if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true);
    }
  };

  return createPortal(
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Анонс матчу ${title}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.frame}>
          {image ? (
            <img className={styles.image} src={image.url} alt={`Анонс матчу ${title}`} />
          ) : (
            <p className={styles.status} role="status">
              {failed ? 'Не вдалося створити картинку. Спробуйте ще раз.' : 'Створюю анонс…'}
            </p>
          )}
        </div>
        {image && isTouchDevice() && (
          <p className={styles.hint}>Або натисніть і утримуйте картинку, щоб зберегти її</p>
        )}
        <div className={styles.actions}>
          {sharable && (
            <button type="button" className={styles.primary} onClick={share}>
              Поділитися
            </button>
          )}
          {image && (
            <button
              type="button"
              className={sharable ? styles.secondary : styles.primary}
              onClick={() => downloadBlob(image.blob, image.file.name)}
            >
              Завантажити
            </button>
          )}
          <button ref={close} type="button" className={styles.secondary} onClick={onClose}>
            Закрити
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
