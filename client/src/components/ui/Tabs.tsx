import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type TabItem = { value: string; label: ReactNode; icon?: ReactNode; count?: number };

/** Underline tabs for page-level section switching. Horizontally scrollable. */
export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn('no-scrollbar flex gap-1 overflow-x-auto border-b border-line', className)}
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'relative inline-flex shrink-0 items-center gap-2 whitespace-nowrap px-3 pb-2.5 pt-2 text-sm font-semibold transition-colors',
              active ? 'text-primary' : 'text-muted hover:text-fg',
            )}
          >
            {t.icon}
            {t.label}
            {typeof t.count === 'number' ? (
              <span
                className={cn(
                  'rounded-full px-1.5 text-[11px] font-bold tabular',
                  active ? 'bg-primary-soft text-primary-soft-fg' : 'bg-sunken text-muted',
                )}
              >
                {t.count}
              </span>
            ) : null}
            {active ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
