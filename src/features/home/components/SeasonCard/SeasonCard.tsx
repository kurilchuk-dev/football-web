import { CountUp } from '@/components/CountUp/CountUp';
import { Skeleton } from '@/components/Skeleton/Skeleton';
import { useStandings } from '@/features/standings/api';
import { getOurRow } from '../../utils';
import styles from './SeasonCard.module.css';

/** Where our team stands right now: place, points, games, goal difference. */
export function SeasonCard() {
  const { data, isPending, isError } = useStandings();

  if (isPending) return <Skeleton className={styles.skeleton} />;
  if (isError) {
    return (
      <div className={styles.card}>
        <p className={styles.message}>Не вдалося завантажити таблицю.</p>
      </div>
    );
  }

  const row = getOurRow(data);
  if (!row) {
    return (
      <div className={styles.card}>
        <p className={styles.eyebrow}>Наш сезон</p>
        <p className={styles.message}>Нашої команди ще немає в таблиці</p>
      </div>
    );
  }

  const stats = [
    { label: 'очки', value: <CountUp value={row.points} /> },
    { label: 'ігор', value: <CountUp value={row.played} /> },
    { label: 'різниця', value: <CountUp value={row.goal_difference} signed /> },
  ];

  return (
    <article className={styles.card}>
      <p className={styles.eyebrow}>Наш сезон</p>

      <div className={styles.place}>
        <span className={styles.placeNumber}>
          <CountUp value={row.position} />
        </span>
        <span className={styles.placeLabel}>
          місце
          <small>
            {row.won}В · {row.drawn}Н · {row.lost}П
          </small>
        </span>
      </div>

      <dl className={styles.stats}>
        {stats.map((stat) => (
          <div key={stat.label} className={styles.stat}>
            <dd className={styles.value}>{stat.value}</dd>
            <dt className={styles.label}>{stat.label}</dt>
          </div>
        ))}
      </dl>
    </article>
  );
}
