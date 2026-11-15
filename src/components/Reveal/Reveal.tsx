import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  // Without IntersectionObserver (old browsers, jsdom) show everything at once.
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const element = ref.current;
    if (visible || !element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
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
