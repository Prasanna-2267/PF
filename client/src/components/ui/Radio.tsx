import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type RadioOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

/** Card-style single choice group. Keyboard + screen-reader friendly (radiogroup). */
export function RadioGroup({
  value,
  onChange,
  options,
  columns = 1,
  className,
  'aria-label': ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  columns?: 1 | 2 | 3;
  className?: string;
  'aria-label'?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'grid gap-2',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-3',
        className,
      )}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              'flex items-start gap-3 rounded-field border p-3 text-left transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
              'disabled:cursor-not-allowed disabled:opacity-55',
              selected
                ? 'border-primary bg-primary-soft'
                : 'border-line bg-surface hover:border-line-strong hover:bg-sunken',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                selected ? 'border-primary' : 'border-line-strong',
              )}
            >
              {selected ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
            </span>
            {o.icon ? <span className="shrink-0 text-muted">{o.icon}</span> : null}
            <span className="min-w-0">
              <span
                className={cn(
                  'block text-sm font-semibold',
                  selected ? 'text-primary-soft-fg' : 'text-fg',
                )}
              >
                {o.label}
              </span>
              {o.description ? (
                <span className="mt-0.5 block text-xs text-muted">{o.description}</span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
