import { forwardRef, useId } from 'react';
import type { ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { Field } from './Field';

export type SelectOption = { value: string; label: string; disabled?: boolean };

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options?: SelectOption[];
  placeholder?: string;
  wrapperClassName?: string;
}

/** Native <select> styled to match the design system (reliable + accessible). */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, placeholder, id, className, wrapperClassName, required, children, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const invalid = Boolean(error);
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={selectId}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={invalid || undefined}
          className={cn(
            'h-11 w-full appearance-none rounded-field border bg-surface pl-3.5 pr-10 text-[15px] text-fg',
            'outline-none transition-[border-color,box-shadow] duration-150',
            'focus-visible:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15',
            'disabled:cursor-not-allowed disabled:opacity-55',
            invalid ? 'border-danger' : 'border-line',
            className,
          )}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options
            ? options.map((o) => (
                <option key={o.value} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))
            : children}
        </select>
        <svg
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-faint"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Field>
  );
});

export type { ReactNode };
