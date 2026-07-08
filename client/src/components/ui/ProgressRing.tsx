import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type RingTone = 'primary' | 'gold' | 'success' | 'warn' | 'danger';

const toneText: Record<RingTone, string> = {
  primary: 'text-primary',
  gold: 'text-gold',
  success: 'text-success',
  warn: 'text-warn',
  danger: 'text-danger',
};

/**
 * Concentric progress ring — the brand's lens motif as data. `value` is 0–100.
 * Center content (score, label) goes in `children`. On navy surfaces pass
 * `trackClassName="text-white/15"`.
 */
export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  tone = 'primary',
  trackClassName,
  className,
  label,
  children,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  tone?: RingTone;
  trackClassName?: string;
  className?: string;
  label?: string;
  children?: ReactNode;
}) {
  // Draw the ring in on mount: first paint at 0, then transition to the value.
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const pct = drawn ? Math.max(0, Math.min(100, value)) : 0;
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div className={cn('relative inline-flex shrink-0 items-center justify-center', className)}>
      {/* role sits on the svg (not the wrapper): progressbar is a
          children-presentational role, so interactive center content must
          live OUTSIDE the progressbar element or AT may prune it. */}
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        // A widget role without an accessible name is worse than no role —
        // unlabeled rings are decorative (their value is stated in nearby text).
        role={label ? 'progressbar' : undefined}
        aria-hidden={label ? undefined : true}
        aria-valuenow={label ? Math.round(pct) : undefined}
        aria-valuemin={label ? 0 : undefined}
        aria-valuemax={label ? 100 : undefined}
        aria-label={label}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn('stroke-current text-sunken', trackClassName)}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          className={cn(
            'stroke-current transition-[stroke-dashoffset] duration-700 ease-out',
            toneText[tone],
          )}
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
      ) : null}
    </div>
  );
}
