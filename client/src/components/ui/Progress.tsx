import { cn } from '../../lib/cn';

export type ProgressTone = 'primary' | 'gold' | 'success' | 'warn' | 'danger';

const fill: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  gold: 'bg-gold',
  success: 'bg-success',
  warn: 'bg-warn',
  danger: 'bg-danger',
};

/** Horizontal progress / meter bar. `value` is a 0–100 percentage. */
export function Progress({
  value,
  tone = 'primary',
  size = 'md',
  className,
  trackClassName,
  label,
}: {
  value: number;
  tone?: ProgressTone;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  trackClassName?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const h = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';
  return (
    <div
      className={cn('w-full overflow-hidden rounded-full bg-sunken', h, trackClassName, className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out', fill[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
