import { useSearchParams } from 'react-router-dom';
import { useResults, useUpcoming } from '@/features/matches/api';
import { MatchList } from '@/features/matches/components/MatchList/MatchList';
import { MatchTabs } from '@/features/matches/components/MatchTabs/MatchTabs';
import { usePageMeta } from '@/hooks/usePageMeta';
import { STATIC_META } from '@/seo/pageMeta';
import { useIsClient } from '@/seo/useIsClient';
import styles from './MatchesPage.module.css';

type TabId = 'results' | 'calendar';

export function MatchesPage() {
  usePageMeta(STATIC_META.matches);
  const isClient = useIsClient();
  const results = useResults();
  const upcoming = useUpcoming();
  const [searchParams, setSearchParams] = useSearchParams();

  // The active tab lives in the URL (?tab=calendar) so it can be shared.
  // The built page cannot know the query, so it always has the results.
  const tab: TabId = isClient && searchParams.get('tab') === 'calendar' ? 'calendar' : 'results';
  const selectTab = (id: TabId) =>
    setSearchParams(id === 'results' ? {} : { tab: id }, { replace: true });

  const heading = <h1 className={styles.title}>Матчі: футзал Черкаського району</h1>;
  const message = (value: string) => (
    <>
      {heading}
      <p>{value}</p>
    </>
  );
  if (results.isLoading || upcoming.isLoading) return message('Завантаження...');
  if (results.isError || upcoming.isError || !results.data || !upcoming.data) {
    return message('Не вдалося завантажити матчі.');
  }

  return (
    <>
      {heading}
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
