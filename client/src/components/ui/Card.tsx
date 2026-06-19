import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/** Flat surface — hairline border, no shadow. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-lg border border-line bg-surface', className)} {...props} />;
}
