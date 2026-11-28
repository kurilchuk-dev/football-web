import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useIsClient } from '@/seo/useIsClient';
import styles from './Reveal.module.css';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Delay before the animation starts, in ms (to stagger neighbours). */
  delay?: number;
}

/** Fades and slides its content in the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isClient = useIsClient();
  // Without IntersectionObserver (old browsers, jsdom) show everything at once. The same for a
  // built page: its text must be visible without any script.
  const [animated] = useState(() => isClient && typeof IntersectionObserver !== 'undefined');
  const [seen, setSeen] = useState(false);
  const visible = !animated || seen;

  useEffect(() => {
    const element = ref.current;
    if (visible || !element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [visible]);

  const classes = [styles.reveal, visible ? styles.visible : '', className ?? ''];
  return (
    <div ref={ref} className={classes.join(' ')} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
