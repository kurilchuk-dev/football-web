import { Skeleton } from '@/components/Skeleton/Skeleton';
import { useResults } from '@/features/matches/api';
import { MatchCard } from '@/features/matches/components/MatchCard/MatchCard';
import { getRecentResults } from '../../utils';
import { Section, SectionNote } from '../Section/Section';
import styles from './RecentResults.module.css';

/** Our last three played matches. */
export function RecentResults() {
  const { data, isPending, isError } = useResults();

  return (
    <Section title="Останні результати" to="/matches" linkLabel="Усі матчі">
      {isPending ? (
        <Skeleton className={styles.skeleton} />
      ) : isError ? (
        <SectionNote>Не вдалося завантажити результати.</SectionNote>
      ) : (
        <ResultsList matches={getRecentResults(data)} />
      )}
    </Section>
  );
}

function ResultsList({ matches }: { matches: ReturnType<typeof getRecentResults> }) {
  if (matches.length === 0) return <SectionNote>Зіграних матчів поки немає</SectionNote>;
  return (
    <div className={styles.list}>
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} showDate />
      ))}
    </div>
  );
}
