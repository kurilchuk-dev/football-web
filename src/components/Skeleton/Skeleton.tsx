import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

/** Shimmering placeholder block shown while data is loading. Size it with className/style. */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div className={`${styles.skeleton} ${className ?? ''}`} style={style} aria-hidden="true" />
  );
}
