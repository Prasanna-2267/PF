import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

/** Centered, width-capped page container with responsive gutters. */
export function Container({
  children,
  size = 'default',
  className,
}: {
  children: ReactNode;
  size?: 'narrow' | 'default' | 'wide';
  className?: string;
}) {
  const max =
    size === 'wide' ? 'max-w-[1320px]' : size === 'narrow' ? 'max-w-3xl' : 'max-w-[1180px]';
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', max, className)}>{children}</div>
  );
}
