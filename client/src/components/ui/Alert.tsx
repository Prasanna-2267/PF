import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type AlertTone = 'info' | 'success' | 'warn' | 'danger' | 'primary';

const toneClass: Record<AlertTone, string> = {
  info: 'bg-info-soft text-info-fg',
  success: 'bg-success-soft text-success-fg',
  warn: 'bg-warn-soft text-warn-fg',
  danger: 'bg-danger-soft text-danger-fg',
  primary: 'bg-primary-soft text-primary-soft-fg',
};

/** Inline contextual message. Renders nothing when there are no children. */
export function Alert({
  tone = 'danger',
  title,
  children,
  icon,
  className,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  if (!children && !title) return null;
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-2.5 rounded-field px-3.5 py-3 text-sm', toneClass[tone], className)}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(Boolean(title) && 'mt-0.5 opacity-90')}>{children}</div> : null}
      </div>
    </div>
  );
}
