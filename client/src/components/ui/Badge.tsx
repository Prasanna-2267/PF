import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type BadgeTone =
  | 'neutral'
  | 'primary'
  | 'gold'
  | 'success'
  | 'warn'
  | 'danger'
  | 'info';
export type BadgeSize = 'sm' | 'md';

const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-sunken text-muted',
  primary: 'bg-primary-soft text-primary-soft-fg',
  gold: 'bg-gold-soft text-gold-soft-fg',
  success: 'bg-success-soft text-success-fg',
  warn: 'bg-warn-soft text-warn-fg',
  danger: 'bg-danger-soft text-danger-fg',
  info: 'bg-info-soft text-info-fg',
};

const sizeClass: Record<BadgeSize, string> = {
  sm: 'h-5 px-1.5 text-[11px] gap-1',
  md: 'h-6 px-2 text-xs gap-1.5',
};

export function Badge({
  children,
  tone = 'neutral',
  size = 'md',
  icon,
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  icon?: ReactNode;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold leading-none',
        toneClass[tone],
        sizeClass[size],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" /> : icon}
      {children}
    </span>
  );
}
