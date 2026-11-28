import { Link, useParams } from 'react-router-dom';
import type { Match } from '@/api/types';
import text from '@/components/PageText/PageText.module.css';
import { useResults, useUpcoming } from '@/features/matches/api';
import { MatchCard } from '@/features/matches/components/MatchCard/MatchCard';
import { formatDayHeading, formatMatchTime, hasDate, hasTime } from '@/features/matches/utils';
import { LEAGUE_NAME } from '@/features/standings/constants';
import { usePageMeta } from '@/hooks/usePageMeta';
import { NotFoundPage } from '@/pages/NotFoundPage/NotFoundPage';
import { matchMeta, matchTitle, STATIC_META } from '@/seo/pageMeta';
import { idFromSlug, teamPath } from '@/seo/slug';
import { siteUrl } from '@/seo/url';

function Details({ match }: { match: Match }) {
  usePageMeta(matchMeta(match, siteUrl()));
  const facts = [
    match.round ? `Тур ${match.round}` : null,
    hasDate(match) ? formatDayHeading(match.date) : 'дата уточнюється',
    hasTime(match) ? formatMatchTime(match.time) : null,
    match.venue || null,
  ].filter(Boolean);
  const report = (match.report ?? '').split(/\n+/).filter((line) => line.trim());

  return (
    <>
      <h1 className={text.title}>{matchTitle(match)}</h1>
      <p className={text.lead}>
        {LEAGUE_NAME}, футзал. {facts.join(' · ')}.
      </p>
      <MatchCard match={match} showDate announce linked={false} />

      {report.length > 0 && (
        <>
          <h2 className={text.subtitle}>Про матч</h2>
          {report.map((line, index) => (
            <p key={index} className={text.text}>
              {line}
            </p>
          ))}
        </>
      )}

      <h2 className={text.subtitle}>Команди та турнір</h2>
      <ul className={text.links}>
        {[match.home_team, match.away_team].map((team) => (
          <li key={team.id}>
            <Link to={teamPath(team)}>{team.name}</Link>
          </li>
        ))}
        <li>
          <Link to="/standings">Турнірна таблиця</Link>
        </li>
        <li>
          <Link to="/matches">Усі матчі</Link>
        </li>
      </ul>
    </>
  );
}

function Message({ children }: { children: string }) {
  usePageMeta(STATIC_META.matches);
  return (
    <>
      <h1 className={text.title}>Матч</h1>
      <p>{children}</p>
    </>
  );
}

/** One match of the championship: the page search engines find by the names of the two teams. */
export function MatchPage() {
  const id = idFromSlug(useParams().slug);
  const results = useResults();
  const upcoming = useUpcoming();
  const match = [...(results.data ?? []), ...(upcoming.data ?? [])].find((m) => m.id === id);

  if (match) return <Details match={match} />;
  if (results.isError || upcoming.isError) return <Message>Не вдалося завантажити матч.</Message>;
  // A match added a moment ago may be missing from the saved data: wait for the fresh one.
  if (results.isPending || upcoming.isPending || results.isFetching || upcoming.isFetching) {
    return <Message>Завантаження...</Message>;
  }
  return <NotFoundPage />;
}
