import { useState } from 'react';
import type { Match } from '@/api/types';
import { AnnouncementDialog } from './AnnouncementDialog';
import styles from './AnnounceButton.module.css';

interface AnnounceButtonProps {
  match: Match;
}

/** A small button on an upcoming match that opens its announcement picture. */
export function AnnounceButton({ match }: AnnounceButtonProps) {
  const [open, setOpen] = useState(false);
  const title = `${match.home_team.name} — ${match.away_team.name}`;

  return (
    <>
      <button
        type="button"
        className={styles.button}
        onClick={() => setOpen(true)}
        aria-label={`Анонс матчу ${title}`}
        title="Анонс матчу"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="m4 17 5-4.5 3.5 3 3-2.5 4.5 4" />
        </svg>
      </button>
      {open && <AnnouncementDialog match={match} onClose={() => setOpen(false)} />}
    </>
  );
}
