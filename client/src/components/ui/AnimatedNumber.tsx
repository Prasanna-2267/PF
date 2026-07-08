import { useCountUp } from '../../hooks/useCountUp';

/** A number that counts up from 0 on mount. Renders tabular digits. */
export function AnimatedNumber({
  value,
  duration = 900,
  className,
}: {
  value: number;
  duration?: number;
  className?: string;
}) {
  const display = useCountUp(value, duration);
  return <span className={className}>{display.toLocaleString('en-IN')}</span>;
}
