import type { ReactNode } from 'react';
import { Card } from './Card';

/** Compact metric tile: big value, small label, optional footer (bar, hint). */
export function Stat({
  label,
  value,
  unit,
  hint,
  footer,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold tracking-tight">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted">{unit}</span>}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
      {footer && <div className="mt-3">{footer}</div>}
    </Card>
  );
}
