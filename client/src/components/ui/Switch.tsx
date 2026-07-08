import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Accessible on/off toggle. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const id = useId();
  const dims =
    size === 'sm'
      ? { track: 'h-5 w-9', knob: 'h-4 w-4', shift: 'translate-x-4' }
      : { track: 'h-6 w-11', knob: 'h-5 w-5', shift: 'translate-x-5' };

  const toggle = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:opacity-55',
        dims.track,
        checked ? 'bg-primary' : 'bg-line-strong',
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'rounded-full bg-white shadow-xs transition-transform duration-200',
          dims.knob,
          checked ? dims.shift : 'translate-x-0',
        )}
      />
    </button>
  );

  if (!label && !description) return <span className={className}>{toggle}</span>;

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <label htmlFor={id} className="min-w-0 cursor-pointer select-none">
        {label ? <span className="block text-sm font-semibold text-fg">{label}</span> : null}
        {description ? <span className="block text-xs text-muted">{description}</span> : null}
      </label>
      {toggle}
    </div>
  );
}
