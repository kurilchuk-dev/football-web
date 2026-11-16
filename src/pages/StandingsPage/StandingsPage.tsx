import { useState } from 'react';
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

export function StandingsPage() {
  usePageMeta({
    title: 'Турнірна таблиця',
    description: 'Турнірна таблиця: місця, очки, різниця м’ячів і форма команд.',
  });
  const { data, isLoading, isError } = useStandings();
  // The mode and the typed scores live here, so they survive switching back and forth.
  const [mode, setMode] = useState<StandingsMode>('real');
  const [inputs, setInputs] = useState<ScoreInputs>({});

  if (isLoading) return <p>Завантаження...</p>;
  if (isError || !data) return <p>Не вдалося завантажити таблицю.</p>;

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
    </>
  );
}
