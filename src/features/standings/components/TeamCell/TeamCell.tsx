import { useState } from 'react';
import type { StandingRow } from '@/api/types';
import { TeamLogo } from '@/components/TeamLogo/TeamLogo';
import { TeamPhotoDialog } from '@/components/TeamPhotoDialog/TeamPhotoDialog';
import { useDeliberateTap } from '@/hooks/useDeliberateTap';
import styles from './TeamCell.module.css';

interface TeamCellProps {
  team: StandingRow['team'];
  /** The row is highlighted with the accent color. */
  ours?: boolean;
}

export function TeamCell({ team, ours = false }: TeamCellProps) {
  const [open, setOpen] = useState(false);
  const tap = useDeliberateTap(() => setOpen(true));

  const content = (
    <>
      <TeamLogo name={team.name} logo={team.logo} ours={ours} />
      <span className={styles.name}>{team.name}</span>
    </>
  );

  // Only a team with a photo is pressable; the others stay plain text.
  if (!team.photo) return <span className={styles.team}>{content}</span>;

  return (
    <>
      <button
        type="button"
        className={`${styles.team} ${styles.pressable}`}
        aria-label={`${team.name}: показати фото команди`}
        {...tap}
      >
        {content}
      </button>
      {open && (
        <TeamPhotoDialog name={team.name} photo={team.photo} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
