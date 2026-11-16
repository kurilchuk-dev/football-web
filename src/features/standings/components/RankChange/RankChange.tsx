import styles from './RankChange.module.css';

interface RankChangeProps {
  /** Places gained: positive = moved up, negative = moved down, 0 = unchanged (nothing shown). */
  value: number;
  /** The row is highlighted with the accent color: the arrow takes the row's text color. */
  ours?: boolean;
}

/** "↑2" / "↓1" next to the place of a team in the simulated table. */
export function RankChange({ value, ours = false }: RankChangeProps) {
  if (value === 0) return null;
  const up = value > 0;
  const color = ours ? styles.ours : up ? styles.up : styles.down;
  return (
    <span
      className={`${styles.change} ${color}`}
      aria-label={up ? `Вище на ${value}` : `Нижче на ${-value}`}
    >
      <span aria-hidden="true">
        {up ? '↑' : '↓'}
        {Math.abs(value)}
      </span>
    </span>
  );
}
