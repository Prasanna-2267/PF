import { cn } from '../../lib/cn';

export type SkeletonShape = 'line' | 'block' | 'circle';

/** Content-shaped loading placeholder. Prefer this over spinners for lists/cards. */
export function Skeleton({
  shape = 'line',
  className,
  style,
}: {
  shape?: SkeletonShape;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-sunken',
        shape === 'line' && 'h-3.5 rounded-full',
        shape === 'block' && 'rounded-card',
        shape === 'circle' && 'rounded-full',
        className,
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

/** A stack of shimmering lines — quick body-text placeholder. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={i === lines - 1 ? 'w-2/3' : 'w-full'} />
      ))}
    </div>
  );
}
