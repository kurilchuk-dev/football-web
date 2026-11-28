import { useEffect, useState } from 'react';
import { useIsClient } from '@/seo/useIsClient';
import { getCountdown } from '../../utils';
import styles from './Countdown.module.css';

interface CountdownProps {
  /** ISO date-time of the kick-off. */
  target: string;
}

/** Live "days / hours / minutes / seconds" timer; ticks every second. */
export function Countdown({ target }: CountdownProps) {
  const [now, setNow] = useState(() => Date.now());
  const isClient = useIsClient();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // The time left is only known in the browser.
  if (!isClient) return null;

  const left = getCountdown(target, now);
  if (left.finished) return <p className={styles.started}>Матч розпочався</p>;

  const units = [
    { label: 'днів', value: left.days },
    { label: 'год', value: left.hours },
    { label: 'хв', value: left.minutes },
    { label: 'сек', value: left.seconds },
  ];

  return (
    <div className={styles.timer} role="timer" aria-label="До початку матчу">
      {units.map((unit) => (
        <div key={unit.label} className={styles.unit}>
          <span className={styles.value}>{String(unit.value).padStart(2, '0')}</span>
          <span className={styles.label}>{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
