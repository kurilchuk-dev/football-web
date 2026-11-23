import { useSearchParams } from 'react-router-dom';
import { useResults, useUpcoming } from '@/features/matches/api';
import { MatchList } from '@/features/matches/components/MatchList/MatchList';
import { MatchTabs } from '@/features/matches/components/MatchTabs/MatchTabs';
import { usePageMeta } from '@/hooks/usePageMeta';
import styles from './MatchesPage.module.css';

type TabId = 'results' | 'calendar';

export function MatchesPage() {
  usePageMeta({
    title: 'Матчі',
    description: 'Результати зіграних матчів і календар найближчих ігор команди «Черкаси ФАМ».',
  });
  const results = useResults();
  const upcoming = useUpcoming();
  const [searchParams, setSearchParams] = useSearchParams();

  // The active tab lives in the URL (?tab=calendar) so it can be shared.
  const tab: TabId = searchParams.get('tab') === 'calendar' ? 'calendar' : 'results';
  const selectTab = (id: TabId) =>
    setSearchParams(id === 'results' ? {} : { tab: id }, { replace: true });

  if (results.isLoading || upcoming.isLoading) return <p>Завантаження...</p>;
  if (results.isError || upcoming.isError || !results.data || !upcoming.data) {
    return <p>Не вдалося завантажити матчі.</p>;
  }

  return (
    <>
      <h1 className={styles.title}>Матчі</h1>
      <MatchTabs
        active={tab}
        onChange={selectTab}
        tabs={[
          { id: 'results', label: 'Результати', count: results.data.length },
          { id: 'calendar', label: 'Календар', count: upcoming.data.length },
        ]}
      />
      {tab === 'results' ? (
        <MatchList matches={results.data} emptyText="Зіграних матчів поки немає" />
      ) : (
        <MatchList matches={upcoming.data} emptyText="Найближчих матчів поки немає" announce />
      )}
    </>
  );
}
