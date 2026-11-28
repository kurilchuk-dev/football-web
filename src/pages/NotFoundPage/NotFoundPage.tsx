import { Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { STATIC_META } from '@/seo/pageMeta';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  usePageMeta(STATIC_META.notFound);

  return (
    <div className={styles.wrap}>
      <p className={styles.code}>404</p>
      <h1 className={styles.text}>Такої сторінки немає</h1>
      <Link to="/" className={styles.link}>
        На головну
      </Link>
    </div>
  );
}
