import { useEffect, useRef } from 'react';
import styles from './ImagePreview.module.css';

interface ImagePreviewProps {
  src: string;
  onClose: () => void;
}

/**
 * The picture full screen. Pressing and holding it offers the browser's own "save image" /
 * "add to Photos", which works where the share sheet with files is not available.
 */
export function ImagePreview({ src, onClose }: ImagePreviewProps) {
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
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
    };
  }, [onClose]);

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Турнірна таблиця як картинка"
        onClick={(event) => event.stopPropagation()}
      >
        <p className={styles.hint}>Натисніть і утримуйте картинку, щоб зберегти її в галерею</p>
        <img className={styles.image} src={src} alt="Турнірна таблиця" />
        <button ref={close} type="button" className={styles.close} onClick={onClose}>
          Закрити
        </button>
      </div>
    </div>
  );
}
