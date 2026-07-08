import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  as?: ElementType;
  interactive?: boolean;
  /** Turn off the default padding (e.g. to host a table or full-bleed media). */
  flush?: boolean;
  /** `navy` renders the premium brand-gradient hero surface (white text). */
  variant?: 'default' | 'navy';
}

export function Card({
  as: Tag = 'div',
  interactive = false,
  flush = false,
  variant = 'default',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-card border',
        variant === 'navy'
          ? 'pf-hero border-white/10 shadow-float'
          : 'border-line bg-surface text-fg shadow-card',
        !flush && 'p-4 sm:p-5',
        interactive &&
          'transition-[transform,box-shadow,border-color] duration-150 hover:border-line-strong hover:shadow-pop',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('text-base font-bold text-fg', className)}>{children}</h3>;
}

export function CardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn('text-sm text-muted', className)}>{children}</p>;
}
