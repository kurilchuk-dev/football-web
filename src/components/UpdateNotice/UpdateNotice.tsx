import { useAppUpdate } from '@/features/update/useAppUpdate';
import styles from './UpdateNotice.module.css';

/** "A new version is available" with an Update button (also runs the background version check). */
export function UpdateNotice() {
  const { available, update } = useAppUpdate();
  if (!available) return null;

  return (
    <div className={styles.notice} role="status">
      <span>Доступна нова версія сайту</span>
      <button type="button" className={styles.button} onClick={update}>
        Оновити
      </button>
    </div>
  );
}
