import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'subtle'
  | 'danger'
  | 'gold';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold rounded-field ' +
  'transition-[background-color,color,box-shadow,border-color,transform] duration-150 ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ' +
  'disabled:pointer-events-none disabled:opacity-55 active:translate-y-px select-none';

const variantClass: Record<ButtonVariant, string> = {
  primary: 'pf-btn-primary text-primary-fg',
  secondary: 'bg-surface text-fg border border-line shadow-xs hover:bg-sunken',
  ghost: 'text-fg hover:bg-sunken',
  subtle: 'bg-primary-soft text-primary-soft-fg hover:brightness-[0.97]',
  danger: 'bg-danger text-white hover:brightness-95',
  gold: 'bg-gold text-gold-fg shadow-xs hover:bg-gold-600',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-[15px]',
};

/** Shared button styling — reuse on `<Link>` / `<a>` that should look like a button. */
export function buttonClasses(opts?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}): string {
  const { variant = 'primary', size = 'md', fullWidth, className } = opts ?? {};
  return cn(base, variantClass[variant], sizeClass[size], fullWidth && 'w-full', className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth,
    leftIcon,
    rightIcon,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? <Spinner size={size === 'lg' ? 18 : 16} /> : leftIcon}
      {children}
      {!loading ? rightIcon : null}
    </button>
  );
});
