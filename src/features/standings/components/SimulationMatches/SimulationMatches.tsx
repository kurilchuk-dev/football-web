import type { CSSProperties } from 'react';
import type { Match } from '@/api/types';
import { TeamLogo } from '@/components/TeamLogo/TeamLogo';
import {
  formatMatchDate,
  formatMatchTime,
  hasDate,
  hasTime,
  kickoffKey,
} from '@/features/matches/utils';
import { sanitizeScore, type ScoreInputs } from '../../simulation';
import styles from './SimulationMatches.module.css';

type Side = 'home' | 'away';

interface SimulationMatchesProps {
  /** The matches planned in the admin (not played yet). */
  matches: Match[];
  inputs: ScoreInputs;
  onChange: (matchId: number, side: Side, value: string) => void;
  onClear: () => void;
}

const LOGO_SIZE = { '--logo-size': '28px' } as CSSProperties;

function When({ match }: { match: Match }) {
  const parts = [
    match.round != null ? `Тур ${match.round}` : null,
    hasDate(match) ? formatMatchDate(match.date) : null,
    hasTime(match) ? formatMatchTime(match.time) : null,
  ].filter(Boolean);
  return parts.length > 0 ? <p className={styles.when}>{parts.join(' · ')}</p> : null;
}

/** The planned matches with two score fields each. A match with an empty field is left out. */
export function SimulationMatches({ matches, inputs, onChange, onClear }: SimulationMatchesProps) {
  const sorted = [...matches].sort((a, b) => kickoffKey(a).localeCompare(kickoffKey(b)));
  const hasInput = Object.values(inputs).some((input) => input.home !== '' || input.away !== '');

  if (sorted.length === 0) {
    return (
      <div className={styles.card}>
        <p className={styles.empty}>
          Запланованих матчів поки немає. Вони з’являться тут, щойно їх додадуть.
        </p>
      </div>
    );
  }

  const field = (match: Match, side: Side, name: string) => (
    <input
      className={styles.score}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      maxLength={2}
      autoComplete="off"
      placeholder="–"
      value={inputs[match.id]?.[side] ?? ''}
      aria-label={`Голи: ${name} (${match.home_team.name} — ${match.away_team.name})`}
      onFocus={(event) => event.target.select()}
      onChange={(event) => onChange(match.id, side, sanitizeScore(event.target.value))}
    />
  );

  return (
    <div className={styles.card}>
      <div className={styles.head}>
        <h2 className={styles.title}>Заплановані матчі</h2>
        <button type="button" className={styles.clear} onClick={onClear} disabled={!hasInput}>
          Очистити
        </button>
      </div>
      <p className={styles.hint}>
        Введіть рахунок хоча б одного матчу: таблиця вище перерахується. Порожні матчі не
        враховуються.
      </p>

      <ul className={styles.list}>
        {sorted.map((match) => (
          <li key={match.id} className={styles.match}>
            <When match={match} />
            <div className={styles.row}>
              <span className={`${styles.team} ${styles.home}`}>
                <span className={styles.name}>{match.home_team.name}</span>
                <span style={LOGO_SIZE}>
                  <TeamLogo
                    name={match.home_team.name}
                    logo={match.home_team.logo}
                    ours={match.home_team.is_our_team}
                  />
                </span>
              </span>
              <span className={styles.scores}>
                {field(match, 'home', match.home_team.name)}
                <span className={styles.colon} aria-hidden="true">
                  :
                </span>
                {field(match, 'away', match.away_team.name)}
              </span>
              <span className={`${styles.team} ${styles.away}`}>
                <span style={LOGO_SIZE}>
                  <TeamLogo
                    name={match.away_team.name}
                    logo={match.away_team.logo}
                    ours={match.away_team.is_our_team}
                  />
                </span>
                <span className={styles.name}>{match.away_team.name}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
