import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { optimizeImage, TEAM_PHOTO_WIDTH } from '@/api/image';
import styles from './TeamPhotoDialog.module.css';

interface TeamPhotoDialogProps {
  name: string;
  photo: string;
  onClose: () => void;
}

/** The team photo over the page. Closes on Escape, a tap outside the photo or the button. */
export function TeamPhotoDialog({ name, photo, onClose }: TeamPhotoDialogProps) {
  const close = useRef<HTMLButtonElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

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

  return createPortal(
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Фото команди ${name}`}
        onClick={(event) => event.stopPropagation()}
      >
        {failed ? (
          <p className={styles.error}>Не вдалося завантажити фото</p>
        ) : (
          <figure className={`${styles.figure} ${loaded ? styles.loaded : ''}`}>
            <img
              className={styles.image}
              src={optimizeImage(photo, TEAM_PHOTO_WIDTH)}
              alt={`Команда ${name}`}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
            />
            <figcaption className={styles.caption}>{name}</figcaption>
          </figure>
        )}
        <button ref={close} type="button" className={styles.close} onClick={onClose}>
          Закрити
        </button>
      </div>
    </div>,
    document.body,
  );
}
