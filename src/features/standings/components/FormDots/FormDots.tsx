import type { StandingRow } from '@/api/types';
import { FORM_LABELS, FORM_LETTERS } from '../../constants';
import styles from './FormDots.module.css';

interface FormDotsProps {
  form: StandingRow['form'];
  /** The row is highlighted with the accent color. */
  ours?: boolean;
}

export function FormDots({ form, ours = false }: FormDotsProps) {
  if (form.length === 0) return <>—</>;

  return form.map((result, i) => (
    <span
      key={i}
      className={`${styles.dot} ${styles[result]} ${ours ? styles.ours : ''}`}
      title={FORM_LABELS[result]}
      role="img"
      aria-label={FORM_LABELS[result]}
    >
      {FORM_LETTERS[result]}
    </span>
  ));
}
