import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export function Input({
  label,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <label className="block space-y-1.5">
      {label && <span className="text-xs font-medium text-muted">{label}</span>}
      <input
        className={cn(
          'w-full rounded-md border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors',
          'placeholder:text-muted/60 focus:border-accent',
          error ? 'border-danger' : 'border-line',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}
