import { forwardRef, useId } from 'react';
import type { ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';
import { Field } from './Field';
import { controlBase } from './Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, id, className, wrapperClassName, required, rows = 4, ...rest },
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
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(
          controlBase,
          'resize-y px-3.5 py-2.5 leading-relaxed',
          invalid && 'border-danger focus:border-danger focus:ring-danger/15',
          className,
        )}
        {...rest}
      />
    </Field>
  );
});
