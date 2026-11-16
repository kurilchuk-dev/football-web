import styles from './StandingsModeSwitch.module.css';

export type StandingsMode = 'real' | 'simulation';

interface StandingsModeSwitchProps {
  mode: StandingsMode;
  onChange: (mode: StandingsMode) => void;
}

const OPTIONS: { mode: StandingsMode; label: string }[] = [
  { mode: 'real', label: 'Таблиця' },
  { mode: 'simulation', label: 'Симуляція' },
];

/** Switches the table at the top between the real standings and the "what if" simulation. */
export function StandingsModeSwitch({ mode, onChange }: StandingsModeSwitchProps) {
  return (
    <div className={styles.switch} role="group" aria-label="Режим таблиці">
      {OPTIONS.map((option) => (
        <button
          key={option.mode}
          type="button"
          className={`${styles.option} ${mode === option.mode ? styles.active : ''}`}
          aria-pressed={mode === option.mode}
          onClick={() => onChange(option.mode)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
