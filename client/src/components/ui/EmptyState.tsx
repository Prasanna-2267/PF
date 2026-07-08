import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { EmptyArt } from '../decor';

/**
 * Friendly empty-content placeholder. Shows the drifting-papers illustration by
 * default; pass `illustration` to swap the art, or `icon` for the compact chip look.
 */
export function EmptyState({
  icon,
  illustration,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  illustration?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-line bg-surface px-6 py-10 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-fg">
          {icon}
        </div>
      ) : (
        (illustration ?? <EmptyArt className="h-32 w-auto" />)
      )}
      <div className="max-w-sm space-y-1">
        <p className="font-display text-base font-bold text-fg">{title}</p>
        {description ? <p className="text-sm text-muted">{description}</p> : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
