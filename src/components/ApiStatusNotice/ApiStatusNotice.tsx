import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import styles from './ApiStatusNotice.module.css';
import { useApiStatus } from './useApiStatus';

/** How long a first load may take before we explain that the server is probably waking up. */
export const SLOW_AFTER_MS = 4000;

/** Mounted only while something loads, so its timer starts over with every new loading period. */
function SlowLoadingNotice() {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!slow) return null;
  return (
    <div className={styles.notice} role="status">
      Сервер прокидається після простою, це може тривати до хвилини…
    </div>
  );
}

/**
 * Tells the visitor what is going on instead of leaving a blank page: the free-tier server
 * sleeps when idle and needs up to a minute to wake up. After a failure offers a retry.
 */
export function ApiStatusNotice() {
  const status = useApiStatus();
  const client = useQueryClient();

  if (status === 'error') {
    return (
      <div className={styles.notice} role="alert">
        <span>Не вдалося завантажити дані.</span>
        <button
          type="button"
          className={styles.button}
          onClick={() => client.refetchQueries({ predicate: (q) => q.state.status === 'error' })}
        >
          Спробувати ще
        </button>
      </div>
    );
  }

  return status === 'loading' ? <SlowLoadingNotice /> : null;
}
