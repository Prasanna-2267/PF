import { cn } from '../../lib/cn';

/**
 * The full horizontal Parallax Flow logo (eye + wordmark) from the supplied SVG
 * asset in /public/brand. Its wordmark is navy, so render it on a light surface
 * (e.g. inside a plaque) for contrast in either theme.
 */
export function Logo({ height = 48, className }: { height?: number; className?: string }) {
  return (
    <img
      src="/brand/logo-horizontal.svg"
      alt="Parallax Flow"
      style={{ height }}
      draggable={false}
      className={cn('w-auto select-none', className)}
    />
  );
}
