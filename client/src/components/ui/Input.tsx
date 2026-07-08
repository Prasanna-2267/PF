import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Field } from './Field';

export const controlBase =
  'w-full rounded-field border bg-surface text-fg text-[15px] placeholder:text-faint ' +
  'transition-[border-color,box-shadow] duration-150 outline-none ' +
  'focus-visible:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 ' +
  'disabled:cursor-not-allowed disabled:opacity-55';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, rightSlot, id, className, wrapperClassName, required, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const invalid = Boolean(error);
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={inputId}
      className={wrapperClassName}
    >
      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-faint">
            {leftIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={invalid || undefined}
          className={cn(
            controlBase,
            'h-11',
            leftIcon ? 'pl-10' : 'pl-3.5',
            rightSlot ? 'pr-11' : 'pr-3.5',
            invalid && 'border-danger focus:border-danger focus:ring-danger/15',
            className,
          )}
          {...rest}
        />
        {rightSlot ? (
          <span className="absolute inset-y-0 right-2 flex items-center">{rightSlot}</span>
        ) : null}
      </div>
    </Field>
  );
});
