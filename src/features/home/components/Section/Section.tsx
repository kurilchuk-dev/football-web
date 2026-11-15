import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/Reveal/Reveal';
import styles from './Section.module.css';

interface SectionProps {
  title: string;
  /** Optional "see all" link in the corner of the heading. */
  to?: string;
  linkLabel?: string;
  children: ReactNode;
}

/** A titled block of the home page that fades in when scrolled into view. */
export function Section({ title, to, linkLabel, children }: SectionProps) {
  return (
    <Reveal className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        {to && (
          <Link to={to} className={styles.link}>
            {linkLabel} →
          </Link>
        )}
      </div>
      {children}
    </Reveal>
  );
}

/** Small error/empty message used inside sections. */
export function SectionNote({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>;
}
