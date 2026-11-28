import { useEffect, useState } from 'react';
import { useIsClient } from '@/seo/useIsClient';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Counts from 0 up to `target` (ease-out). Jumps straight to the value with reduced motion, and in
 * a built page, which must show the real number to search engines.
 */
export function useCountUp(target: number, duration = 900): number {
  const isClient = useIsClient();
  // Decided once: a number that was already in the built HTML does not start over.
  const [animated] = useState(isClient);
  const reduced = !animated || prefersReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduced]);

  return reduced ? target : value;
}
