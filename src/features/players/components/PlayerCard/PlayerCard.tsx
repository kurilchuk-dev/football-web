import { useState } from 'react';
import { optimizeImage, PHOTO_WIDTH } from '@/api/image';
import type { Player } from '@/api/types';
import { getInitials } from '../../utils';
import styles from './PlayerCard.module.css';

interface PlayerCardProps {
  player: Player;
}

/**
 * Portrait with the shirt number on it. Without a photo (or when it fails to
 * load) the portrait area shows the number, or the initials until a number is assigned.
 */
export function PlayerCard({ player }: PlayerCardProps) {
  // Remember which URL failed, so a replaced photo is tried again.
  const [failedPhoto, setFailedPhoto] = useState<string | null>(null);
  const { photo } = player;
  const showPhoto = photo && photo !== failedPhoto;
  const hasNumber = player.number !== null && player.number !== undefined;

  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {showPhoto ? (
          <>
            <img
              className={styles.photo}
              src={optimizeImage(photo, PHOTO_WIDTH)}
              alt=""
              loading="lazy"
              onError={() => setFailedPhoto(photo)}
            />
            {hasNumber && <span className={styles.badge}>{player.number}</span>}
          </>
        ) : (
          <span className={hasNumber ? styles.number : `${styles.number} ${styles.initials}`}>
            {hasNumber ? player.number : getInitials(player)}
          </span>
        )}
      </div>
      <div className={styles.names}>
        <span className={styles.firstName}>{player.first_name}</span>
        <span className={styles.lastName}>{player.last_name}</span>
      </div>
    </article>
  );
}
