import { Skeleton } from '@/components/Skeleton/Skeleton';
import { TeamLogo } from '@/components/TeamLogo/TeamLogo';
import { useResults } from '@/features/matches/api';
import { formatMatchDate } from '@/features/matches/utils';
import { useStandings } from '@/features/standings/api';
import { FormDots } from '@/features/standings/components/FormDots/FormDots';
import { FORM_LABELS } from '@/features/standings/constants';
import { getOurResult, getOurRow, getRecentResults } from '../../utils';
import styles from './FormCard.module.css';

/** Our last result in big digits plus the last five games as W/D/L dots. */
export function FormCard() {
  const results = useResults();
  const standings = useStandings();

  if (results.isPending || standings.isPending) return <Skeleton className={styles.skeleton} />;
  if (results.isError || standings.isError) {
    return (
      <div className={styles.card}>
        <p className={styles.message}>Не вдалося завантажити форму команди.</p>
      </div>
    );
  }

  const last = getRecentResults(results.data, 1)[0];
  const outcome = last ? getOurResult(last) : null;
  const form = getOurRow(standings.data)?.form ?? [];

  return (
    <article className={styles.card}>
      <p className={styles.eyebrow}>Форма</p>

      {last ? (
        <div className={styles.last}>
          <TeamLogo name={last.home_team.name} logo={last.home_team.logo} />
          <span className={styles.score}>
            {last.home_score}:{last.away_score}
          </span>
          <TeamLogo name={last.away_team.name} logo={last.away_team.logo} />
          {outcome && (
            <span className={`${styles.outcome} ${styles[outcome]}`}>{FORM_LABELS[outcome]}</span>
          )}
        </div>
      ) : (
        <p className={styles.message}>Зіграних матчів поки немає</p>
      )}

      {last && (
        <p className={styles.caption}>
          Останній матч{last.played_at ? ` · ${formatMatchDate(last.played_at)}` : ''}
        </p>
      )}

      <div className={styles.dots}>
        <FormDots form={form} />
      </div>
    </article>
  );
}
