import { useId } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'primary' | 'gold' | 'success';
const stroke: Record<Tone, string> = {
  primary: 'text-primary',
  gold: 'text-gold',
  success: 'text-success',
};

/**
 * Responsive area+line trend chart — self-contained SVG (no deps, CSP-safe,
 * theme-aware). Uses a fixed viewBox stretched to the container with a
 * non-scaling stroke so the line stays crisp at any width.
 */
export function TrendChart({
  points,
  height = 160,
  tone = 'primary',
  className,
  ariaLabel,
}: {
  points: number[];
  height?: number;
  tone?: Tone;
  className?: string;
  ariaLabel?: string;
}) {
  const id = useId();
  const W = 600;
  const H = 100;
  const pad = 6;
  const max = Math.max(1, ...points);
  const n = points.length;
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);

  const line = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className={cn('overflow-visible', stroke[tone], className)}
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {n > 1 ? <path d={area} fill={`url(#${id}-fill)`} stroke="none" /> : null}
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Responsive bar chart built from flex divs — theme-aware, no SVG scaling quirks. */
export function BarChart({
  data,
  height = 120,
  tone = 'primary',
  className,
  reference,
  referenceLabel,
}: {
  data: { label?: string; value: number }[];
  height?: number;
  tone?: Tone;
  className?: string;
  /** Draws a dashed goal line at this value. */
  reference?: number;
  referenceLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value), reference ?? 0);
  const fill =
    tone === 'gold' ? 'bg-gold/70' : tone === 'success' ? 'bg-success/70' : 'bg-primary/70';
  return (
    <div className={cn('relative flex items-end gap-[3px]', className)} style={{ height }}>
      {reference && reference > 0 ? (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-gold/70"
          style={{ bottom: `${Math.min(100, (reference / max) * 100)}%` }}
        >
          {referenceLabel ? (
            <span className="absolute -top-2 right-0 -translate-y-full rounded bg-gold-soft px-1 py-0.5 text-[9px] font-bold text-gold-soft-fg">
              {referenceLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      {data.map((d, i) => (
        <div
          key={i}
          className="group flex flex-1 items-end"
          style={{ height: '100%' }}
          title={d.label ? `${d.label}: ${d.value}` : String(d.value)}
        >
          <div
            className={cn('w-full rounded-t-sm transition-[height] duration-500', fill, 'group-hover:opacity-100 opacity-80')}
            style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}
