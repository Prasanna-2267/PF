import { cn } from '../../lib/cn';

/**
 * Abstract Parallax Flow eye/lens mark — concentric lens with a gold pupil.
 * Uses `currentColor` for the lens (adapts to theme) and the gold token for the
 * pupil accent. Not a literal reproduction of the logo art — a restrained echo.
 */
export function EyeMark({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path
        d="M2.5 16C6.8 9.2 25.2 9.2 29.5 16C25.2 22.8 6.8 22.8 2.5 16Z"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="5.3" stroke="currentColor" strokeWidth="2.1" />
      <circle cx="16" cy="16" r="2.25" fill="var(--gold)" />
    </svg>
  );
}
