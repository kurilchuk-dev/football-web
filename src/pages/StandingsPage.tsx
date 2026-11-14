import { useStandings } from '../api/standings';
import styles from './StandingsPage.module.css';

const FORM_LABELS = { W: 'Перемога', D: 'Нічия', L: 'Поразка' } as const;

const FORM_LETTERS = { W: 'В', D: 'Н', L: 'П' } as const;

export function StandingsPage() {
  const { data, isLoading, isError } = useStandings();

  if (isLoading) return <p>Завантаження...</p>;
  if (isError || !data) return <p>Не вдалося завантажити таблицю.</p>;

  return (
    <>
      <h1 className={styles.title}>Турнірна таблиця</h1>
      <div className={styles.card}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Команда</th>
              <th>І</th>
              <th className={styles.full}>В</th>
              <th className={styles.full}>Н</th>
              <th className={styles.full}>П</th>
              <th className={styles.compact}>М</th>
              <th className={styles.full}>ЗМ</th>
              <th className={styles.full}>ПМ</th>
              <th className={styles.full}>РМ</th>
              <th className={`${styles.full} ${styles.form}`}>Форма</th>
              <th>О</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.team.id} className={row.team.is_our_team ? styles.ours : undefined}>
                <td>{row.position}</td>
                <td>{row.team.name}</td>
                <td>{row.played}</td>
                <td className={styles.full}>{row.won}</td>
                <td className={styles.full}>{row.drawn}</td>
                <td className={styles.full}>{row.lost}</td>
                <td className={styles.compact}>
                  {row.goals_for}:{row.goals_against}
                </td>
                <td className={styles.full}>{row.goals_for}</td>
                <td className={styles.full}>{row.goals_against}</td>
                <td className={styles.full}>
                  {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
                </td>
                <td className={`${styles.full} ${styles.form}`}>
                  {row.form.length === 0
                    ? '—'
                    : row.form.map((result, i) => (
                        <span
                          key={i}
                          className={`${styles.dot} ${styles[result]}`}
                          title={FORM_LABELS[result]}
                          role="img"
                          aria-label={FORM_LABELS[result]}
                        >
                          {FORM_LETTERS[result]}
                        </span>
                      ))}
                </td>
                <td className={styles.points}>{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
