import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Compact metric tile: label, big value, optional icon + footer (bar, hint). */
export function Stat({
  label,
  value,
  unit,
  hint,
  icon,
  footer,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-line bg-surface p-4 shadow-card',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        {icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-fg">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 font-display text-[26px] font-bold tracking-tight text-fg tabular">
        {value}
        {unit ? <span className="ml-1 text-sm font-medium text-muted">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      {footer ? <div className="mt-3">{footer}</div> : null}
    </div>
  );
}
