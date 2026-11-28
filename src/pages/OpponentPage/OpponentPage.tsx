import { Link, useParams } from 'react-router-dom';
import type { Match, StandingRow } from '@/api/types';
import text from '@/components/PageText/PageText.module.css';
import { useResults, useUpcoming } from '@/features/matches/api';
import { MatchList } from '@/features/matches/components/MatchList/MatchList';
import { StandingsTable } from '@/features/standings/components/StandingsTable/StandingsTable';
import { useStandings } from '@/features/standings/api';
import { usePageMeta } from '@/hooks/usePageMeta';
import { NotFoundPage } from '@/pages/NotFoundPage/NotFoundPage';
import { LEAGUE_FULL, opponentMeta, STATIC_META } from '@/seo/pageMeta';
import { idFromSlug } from '@/seo/slug';
import { siteUrl } from '@/seo/url';

interface DetailsProps {
  row: StandingRow;
  results: Match[];
  upcoming: Match[];
}

function Details({ row, results, upcoming }: DetailsProps) {
  usePageMeta(opponentMeta(row, siteUrl()));
  const { id, name } = row.team;
  const own = (match: Match) => match.home_team.id === id || match.away_team.id === id;

  return (
    <>
      <h1 className={text.title}>{name}</h1>
      <p className={text.lead}>
        Футзальна команда «{name}», {LEAGUE_FULL}. Зараз {row.position} місце: ігор {row.played},
        очок {row.points}, м’ячі {row.goals_for}:{row.goals_against}.
      </p>
      <StandingsTable rows={[row]} />

      <h2 className={text.subtitle}>Зіграні матчі</h2>
      <MatchList matches={results.filter(own)} emptyText="Зіграних матчів поки немає" />
      <h2 className={text.subtitle}>Наступні матчі</h2>
      <MatchList matches={upcoming.filter(own)} emptyText="Найближчих матчів поки немає" />

      <ul className={text.links}>
        <li>
          <Link to="/standings">Уся таблиця</Link>
        </li>
        <li>
          <Link to="/matches">Усі матчі</Link>
        </li>
      </ul>
    </>
  );
}

function Message({ children }: { children: string }) {
  usePageMeta(STATIC_META.standings);
  return (
    <>
      <h1 className={text.title}>Команда</h1>
      <p>{children}</p>
    </>
  );
}

/** One team of the championship with its place and matches. */
export function OpponentPage() {
  const id = idFromSlug(useParams().slug);
  const standings = useStandings();
  const results = useResults();
  const upcoming = useUpcoming();
  const row = standings.data?.find((item) => item.team.id === id);

  if (standings.isError || results.isError || upcoming.isError) {
    return <Message>Не вдалося завантажити команду.</Message>;
  }
  if (row && results.data && upcoming.data) {
    return <Details row={row} results={results.data} upcoming={upcoming.data} />;
  }
  if (standings.isPending || results.isPending || upcoming.isPending || standings.isFetching) {
    return <Message>Завантаження...</Message>;
  }
  return <NotFoundPage />;
}
