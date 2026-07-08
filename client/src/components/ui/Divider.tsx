import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Divider({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  if (!children) return <hr className={cn('border-0 border-t border-line', className)} />;
  return (
    <div className={cn('flex items-center gap-3', className)} role="separator">
      <span className="h-px flex-1 bg-line" />
      <span className="text-xs font-medium text-faint">{children}</span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
