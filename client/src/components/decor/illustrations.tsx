import { useId } from 'react';
import { cn } from '../../lib/cn';

/**
 * Brand spot illustrations — theme-aware (CSS-var fills) with animated details
 * (pf-float / pf-sparkle / pf-orbit / pf-flicker). Decorative: aria-hidden.
 */

type ArtProps = { className?: string };

function Sparkle({
  x,
  y,
  size = 10,
  delay = 0,
  fill = 'var(--gold)',
}: {
  x: number;
  y: number;
  size?: number;
  delay?: number;
  fill?: string;
}) {
  const s = size / 2;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path
        d={`M0 ${-s} Q ${s * 0.22} ${-s * 0.22} ${s} 0 Q ${s * 0.22} ${s * 0.22} 0 ${s} Q ${-s * 0.22} ${s * 0.22} ${-s} 0 Q ${-s * 0.22} ${-s * 0.22} 0 ${-s} Z`}
        fill={fill}
        className="pf-sparkle"
        style={{ animationDelay: `${delay}s` }}
      />
    </g>
  );
}

/** Abstract lens/orbit hero decoration. Inherits `currentColor` for the rings. */
export function OrbitArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 220 220" fill="none" className={className} aria-hidden="true">
      <circle cx="110" cy="110" r="102" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="110" cy="110" r="76" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 7" />
      <circle cx="110" cy="110" r="50" stroke="currentColor" strokeWidth="1.5" />
      {/* Eye / lens core */}
      <path
        d="M70 110C86 92 134 92 150 110C134 128 86 128 70 110Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="110" cy="110" r="13" stroke="currentColor" strokeWidth="2" />
      <circle cx="110" cy="110" r="5" fill="var(--gold)" />
      {/* Orbiting satellites */}
      <g className="pf-orbit">
        <circle cx="110" cy="8" r="5" fill="var(--gold)" />
        <circle cx="212" cy="110" r="3" fill="currentColor" />
      </g>
      <g className="pf-orbit" style={{ animationDuration: '34s', animationDirection: 'reverse' }}>
        <circle cx="110" cy="34" r="3.5" fill="currentColor" />
      </g>
      <Sparkle x={38} y={48} size={12} />
      <Sparkle x={186} y={168} size={9} delay={0.8} />
    </svg>
  );
}

/** Stack of study notes with a floating sparkle — catalogue / lessons. */
export function BooksArt({ className }: ArtProps) {
  const id = useId();
  return (
    <svg viewBox="0 0 170 140" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--gold)" />
          <stop offset="1" stopColor="var(--gold-strong)" />
        </linearGradient>
      </defs>
      <ellipse cx="85" cy="124" rx="56" ry="8" fill="var(--sunken)" />
      <circle cx="85" cy="66" r="56" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 8" />
      {/* bottom book */}
      <rect x="34" y="96" width="102" height="18" rx="4" fill="var(--primary-strong)" />
      <rect x="34" y="96" width="10" height="18" rx="4" fill={`url(#${id}-g)`} />
      {/* middle book */}
      <rect x="44" y="78" width="88" height="18" rx="4" fill="var(--primary)" />
      <rect x="122" y="78" width="10" height="18" rx="4" fill="var(--primary-soft)" />
      {/* top open book */}
      <g className="pf-float">
        <path
          d="M85 46C74 39 58 38 48 41V70C58 67 74 68 85 75C96 68 112 67 122 70V41C112 38 96 39 85 46Z"
          fill="var(--surface)"
          stroke="var(--primary)"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M85 46V75" stroke="var(--primary)" strokeWidth="2.5" />
        <path d="M56 49c7-1.5 15-1 22 2M56 57c7-1.5 15-1 22 2" stroke="var(--line-strong)" strokeWidth="2" strokeLinecap="round" />
        <path d="M114 49c-7-1.5-15-1-22 2M114 57c-7-1.5-15-1-22 2" stroke="var(--line-strong)" strokeWidth="2" strokeLinecap="round" />
      </g>
      <Sparkle x={128} y={30} size={13} />
      <Sparkle x={38} y={22} size={9} delay={0.7} />
      <Sparkle x={148} y={62} size={7} delay={1.3} fill="var(--primary)" />
    </svg>
  );
}

/** Arrow in the bullseye — practice, goals, accuracy. */
export function TargetArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 170 140" fill="none" className={className} aria-hidden="true">
      <ellipse cx="80" cy="126" rx="52" ry="7" fill="var(--sunken)" />
      <circle cx="80" cy="72" r="46" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="3" />
      <circle cx="80" cy="72" r="31" stroke="var(--primary)" strokeWidth="3" />
      <circle cx="80" cy="72" r="16" stroke="var(--primary)" strokeWidth="3" />
      <circle cx="80" cy="72" r="6" fill="var(--gold)" />
      {/* arrow */}
      <g className="pf-float" style={{ animationDuration: '4.2s' }}>
        <path d="M84 68 129 23" stroke="var(--gold-strong)" strokeWidth="4" strokeLinecap="round" />
        <path d="M129 23l-16 2 6-8zM129 23l-2 16 8-6z" fill="var(--gold-strong)" />
        <path d="M124 34l14 3M111 20l3 14" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
      </g>
      <Sparkle x={26} y={34} size={11} />
      <Sparkle x={142} y={92} size={8} delay={0.9} fill="var(--primary)" />
    </svg>
  );
}

/** Open box with drifting pages — empty states. */
export function EmptyArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 170 140" fill="none" className={className} aria-hidden="true">
      <ellipse cx="85" cy="127" rx="52" ry="7" fill="var(--sunken)" />
      <circle cx="85" cy="66" r="54" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 8" />
      {/* floating papers */}
      <g className="pf-float">
        <rect x="52" y="26" width="34" height="42" rx="4" transform="rotate(-8 52 26)" fill="var(--surface)" stroke="var(--line-strong)" strokeWidth="2" />
        <path d="M56 38l20-3M57 46l20-3M58 54l14-2" stroke="var(--line-strong)" strokeWidth="2" strokeLinecap="round" transform="rotate(-8 52 26)" />
      </g>
      <g className="pf-float" style={{ animationDelay: '0.6s', animationDuration: '3.9s' }}>
        <rect x="94" y="24" width="32" height="40" rx="4" transform="rotate(9 94 24)" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
        <path d="M100 36l18 3M99 44l18 3M98 52l13 2" stroke="var(--line-strong)" strokeWidth="2" strokeLinecap="round" transform="rotate(9 94 24)" />
      </g>
      {/* box */}
      <path d="M43 78l42 12 42-12v34a4 4 0 0 1-3 4l-37 10a8 8 0 0 1-4 0l-37-10a4 4 0 0 1-3-4z" fill="var(--primary)" />
      <path d="M85 90v38" stroke="var(--primary-strong)" strokeWidth="1.5" />
      <path d="M43 78l-8 12 42 13 8-13zM127 78l8 12-42 13-8-13z" fill="var(--primary-soft)" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" />
      <Sparkle x={140} y={42} size={10} />
      <Sparkle x={30} y={58} size={8} delay={1.1} />
    </svg>
  );
}

/** Gold trophy with rays — streaks, wins, milestones. */
export function TrophyArt({ className }: ArtProps) {
  const id = useId();
  return (
    <svg viewBox="0 0 170 140" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-cup`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8bc86" />
          <stop offset="0.5" stopColor="var(--gold)" />
          <stop offset="1" stopColor="var(--gold-strong)" />
        </linearGradient>
      </defs>
      <ellipse cx="85" cy="127" rx="46" ry="7" fill="var(--sunken)" />
      {/* rays */}
      <g stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" className="pf-sparkle">
        <path d="M85 8v10M52 18l6 9M118 18l-6 9M32 44l10 5M138 44l-10 5" />
      </g>
      {/* cup */}
      <g className="pf-float" style={{ animationDuration: '4.4s' }}>
        <path d="M60 34h50v18c0 16-11 28-25 28S60 68 60 52z" fill={`url(#${id}-cup)`} />
        <path d="M60 40c-10 0-16 5-16 12 0 8 8 13 18 13M110 40c10 0 16 5 16 12 0 8-8 13-18 13" stroke="var(--gold-strong)" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M78 88h14l3 12H75z" fill="var(--gold-strong)" />
        <rect x="64" y="100" width="42" height="10" rx="3" fill="var(--primary)" />
        <rect x="70" y="103" width="30" height="4" rx="2" fill="var(--primary-strong)" />
        {/* star on cup */}
        <path d="M85 46l3.2 6.6 7.2 1-5.2 5.1 1.2 7.2-6.4-3.4-6.4 3.4 1.2-7.2-5.2-5.1 7.2-1z" fill="#fff" opacity="0.9" />
      </g>
      <Sparkle x={132} y={80} size={10} />
      <Sparkle x={38} y={90} size={8} delay={0.8} />
    </svg>
  );
}

/** Rocket lifting off — momentum, getting started. */
export function RocketArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 170 140" fill="none" className={className} aria-hidden="true">
      <circle cx="85" cy="64" r="52" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 8" />
      <g className="pf-float">
        {/* body */}
        <path d="M85 14c14 10 20 30 20 48l-8 14H73l-8-14c0-18 6-38 20-48z" fill="var(--surface)" stroke="var(--primary)" strokeWidth="3" strokeLinejoin="round" />
        {/* window */}
        <circle cx="85" cy="46" r="10" fill="var(--primary-soft)" stroke="var(--gold)" strokeWidth="3.5" />
        {/* fins */}
        <path d="M65 62c-9 4-13 13-13 22l13-6zM105 62c9 4 13 13 13 22l-13-6z" fill="var(--primary)" />
        <path d="M77 76h16l-3 12h-10z" fill="var(--primary-strong)" />
        {/* flame */}
        <path
          className="pf-flicker"
          d="M85 88c6 6 7 14 0 24-7-10-6-18 0-24z"
          fill="var(--gold)"
          stroke="var(--gold-strong)"
          strokeWidth="2"
        />
      </g>
      {/* speed lines */}
      <path d="M48 96l-10 14M122 96l10 14" stroke="var(--line-strong)" strokeWidth="3" strokeLinecap="round" />
      <Sparkle x={132} y={30} size={12} />
      <Sparkle x={36} y={44} size={8} delay={0.6} />
      <Sparkle x={144} y={72} size={7} delay={1.2} fill="var(--primary)" />
    </svg>
  );
}

/** Graduation cap with a swinging gold tassel — exams, syllabus. */
export function CapArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 170 140" fill="none" className={className} aria-hidden="true">
      <ellipse cx="85" cy="122" rx="50" ry="7" fill="var(--sunken)" />
      <circle cx="85" cy="62" r="52" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 8" />
      <g className="pf-float">
        {/* board */}
        <path d="M85 26 20 52l65 26 65-26z" fill="var(--primary)" stroke="var(--primary-strong)" strokeWidth="2" strokeLinejoin="round" />
        {/* cap base */}
        <path d="M53 66v22c0 8 14 15 32 15s32-7 32-15V66l-32 13z" fill="var(--primary-strong)" />
        {/* tassel */}
        <path d="M85 52v8" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" />
        <path d="M148 54v26" stroke="var(--gold)" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="148" cy="86" r="6" fill="var(--gold)" />
        <circle cx="85" cy="52" r="4" fill="var(--gold)" />
      </g>
      <Sparkle x={34} y={28} size={11} />
      <Sparkle x={140} y={22} size={9} delay={0.9} />
    </svg>
  );
}

/** Shield with a check — security, protected content, verification. */
export function ShieldArt({ className }: ArtProps) {
  return (
    <svg viewBox="0 0 170 140" fill="none" className={className} aria-hidden="true">
      <ellipse cx="85" cy="126" rx="44" ry="7" fill="var(--sunken)" />
      <circle cx="85" cy="64" r="52" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 8" />
      <g className="pf-float" style={{ animationDuration: '4s' }}>
        <path d="M85 14l44 16v34c0 27-19 46-44 56-25-10-44-29-44-56V30z" fill="var(--primary)" stroke="var(--primary-strong)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M85 24l34 12.5V63c0 21-14.5 36.5-34 45.5C65.5 99.5 51 84 51 63V36.5z" fill="var(--primary-strong)" opacity="0.55" />
        <path d="M66 62l13 13 26-27" stroke="var(--gold)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <Sparkle x={136} y={36} size={11} />
      <Sparkle x={32} y={80} size={8} delay={0.7} />
    </svg>
  );
}

/** Tiny inline flame for streaks — pass `active` to make it flicker. */
export function StreakFlame({ active = false, className }: ArtProps & { active?: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 28" fill="none" className={cn('inline-block', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gold)" />
          <stop offset="1" stopColor="var(--gold-strong)" />
        </linearGradient>
      </defs>
      <path
        className={active ? 'pf-flicker' : undefined}
        d="M12 1c1.5 5 7 6.5 7 13a7 7 0 0 1-14 0c0-2.4 1-4 2.2-5.3C8.5 10 10 7 10 4c1.6.8 3 2.2 2 5 0 0 0-4 0-8z"
        fill={`url(#${id}-f)`}
      />
      <path d="M12 27a5 5 0 0 1-3.4-8.6C10 17 11 15.6 11 14c2.2 1.2 4.4 3.4 4.4 6A5 5 0 0 1 12 27z" fill="#fff" opacity="0.35" />
    </svg>
  );
}
