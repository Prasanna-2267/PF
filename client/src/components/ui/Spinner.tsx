import { cn } from '../../lib/cn';

/** Indeterminate loading spinner. Inherits `currentColor`. */
export function Spinner({
  size = 18,
  className,
  label = 'Loading',
}: {
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      className={cn('animate-spin', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label={label}
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.22" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Centered full-viewport loader for route/auth bootstrap. */
export function FullPageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas text-primary">
      <Spinner size={28} label={label} />
    </div>
  );
}
