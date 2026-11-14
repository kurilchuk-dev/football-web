import { PODIUM_PLACES } from '../../constants';
import styles from './PlaceBadge.module.css';

interface PlaceBadgeProps {
  position: number;
  /** The row is highlighted with the accent color. */
  ours?: boolean;
}

export function PlaceBadge({ position, ours = false }: PlaceBadgeProps) {
  const classes = [styles.place];
  if (position <= PODIUM_PLACES) classes.push(styles[`place${position}`]);
  if (ours) classes.push(styles.ours);
  return <span className={classes.join(' ')}>{position}</span>;
}
