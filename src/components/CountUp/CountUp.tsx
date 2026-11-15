import { useCountUp } from './useCountUp';

interface CountUpProps {
  value: number;
  /** Prefix positive numbers with "+" (goal difference). */
  signed?: boolean;
}

/** A number that counts up from 0 when it first appears. */
export function CountUp({ value, signed = false }: CountUpProps) {
  const shown = useCountUp(value);
  return <>{signed && shown > 0 ? `+${shown}` : shown}</>;
}
