import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Button } from './Button';
import { AlertTriangleIcon, RefreshIcon } from './icons';

/** Inline error surface with a retry affordance — for failed queries. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: {
  title?: ReactNode;
  message?: ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-card border border-line bg-surface px-6 py-10 text-center',
        className,
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-soft text-danger-fg">
        <AlertTriangleIcon size={20} />
      </div>
      <div className="max-w-sm space-y-1">
        <p className="font-semibold text-fg">{title}</p>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry} leftIcon={<RefreshIcon size={16} />}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
