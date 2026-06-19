import type { ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Select({
  label,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-xs font-medium text-muted">{label}</span>}
      <select
        className={cn(
          'w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
