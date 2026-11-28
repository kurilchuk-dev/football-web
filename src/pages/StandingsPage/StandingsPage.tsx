import { useState } from 'react';
import { Link } from 'react-router-dom';
import text from '@/components/PageText/PageText.module.css';
import { useStandings } from '@/features/standings/api';
import { StandingsBanner } from '@/features/standings/components/StandingsBanner/StandingsBanner';
import { StandingsImageActions } from '@/features/standings/components/StandingsImageActions/StandingsImageActions';
import {
  StandingsModeSwitch,
  type StandingsMode,
} from '@/features/standings/components/StandingsModeSwitch/StandingsModeSwitch';
import { SimulationView } from '@/features/standings/components/SimulationView/SimulationView';
import { StandingsTable } from '@/features/standings/components/StandingsTable/StandingsTable';
import type { ScoreInputs } from '@/features/standings/simulation';
import { getStandingsSummary } from '@/features/standings/utils';
import { usePageMeta } from '@/hooks/usePageMeta';
import { STATIC_META } from '@/seo/pageMeta';
import { teamPath } from '@/seo/slug';

export function StandingsPage() {
  usePageMeta(STATIC_META.standings);
  const { data, isLoading, isError } = useStandings();
  // The mode and the typed scores live here, so they survive switching back and forth.
  const [mode, setMode] = useState<StandingsMode>('real');
  const [inputs, setInputs] = useState<ScoreInputs>({});

  const message = (value: string) => (
    <>
      <h1 className={text.title}>Турнірна таблиця</h1>
      <p>{value}</p>
    </>
  );
  if (isLoading) return message('Завантаження...');
  if (isError || !data) return message('Не вдалося завантажити таблицю.');

  return (
    <>
      <StandingsBanner summary={getStandingsSummary(data)} />
      <StandingsModeSwitch mode={mode} onChange={setMode} />
      {mode === 'real' ? (
        <>
          <StandingsTable rows={data} />
          <StandingsImageActions rows={data} />
        </>
      ) : (
        <SimulationView realRows={data} inputs={inputs} onInputsChange={setInputs} />
      )}

      <h2 className={text.subtitle}>Команди чемпіонату</h2>
      <ul className={text.links}>
        {data.map(({ team }) => (
          <li key={team.id}>
            <Link to={teamPath(team)}>{team.name}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
