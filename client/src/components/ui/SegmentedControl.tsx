import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type SegmentOption = { value: string; label: ReactNode; icon?: ReactNode };

/** Compact pill toggle for 2–4 mutually exclusive options. */
export function SegmentedControl({
  options,
  value,
  onChange,
  fullWidth = false,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  fullWidth?: boolean;
  size?: 'sm' | 'md';
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex rounded-field bg-sunken p-1',
        fullWidth && 'flex w-full',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-[calc(var(--radius-field)-0.25rem)] font-semibold transition-colors',
              fullWidth && 'flex-1',
              size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
              active ? 'bg-surface text-fg shadow-xs' : 'text-muted hover:text-fg',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
