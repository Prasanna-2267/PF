import { cn } from '../../lib/cn';

type Tone = 'accent' | 'success' | 'warn' | 'danger';

const fills: Record<Tone, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  warn: 'bg-warn',
  danger: 'bg-danger',
};

/** Flat horizontal progress / meter bar. `value` is a 0–100 percentage. */
export function Progress({
  value,
  tone = 'accent',
  className = '',
}: {
  value: number;
  tone?: Tone;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-line', className)}>
      <div className={cn('h-full rounded-full transition-all duration-500', fills[tone])} style={{ width: `${pct}%` }} />
    </div>
  );
}
