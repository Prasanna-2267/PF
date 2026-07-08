import type { ReactNode } from 'react';
import { EyeMark, Logo } from '../brand';
import { OrbitArt } from '../decor';
import { ThemeToggle } from '../ui';

/**
 * Split auth layout: a branded navy panel (desktop) beside the form column.
 * The panel carries the real logo on a light plaque for true-colour contrast.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-canvas text-fg lg:grid lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <div className="pf-hero hidden p-12 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-[28rem] w-[28rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 top-16 h-72 w-72 rounded-full border border-gold-400/20"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"
        />
        <OrbitArt className="pointer-events-none absolute -bottom-16 right-8 h-72 w-72 text-white/20" />

        <span className="relative inline-flex items-center gap-2 text-white">
          <EyeMark size={26} />
          <span className="font-display text-lg font-extrabold tracking-tight">Parallax Flow</span>
        </span>

        <div className="relative max-w-md">
          <div className="inline-flex rounded-2xl bg-white p-5 shadow-pop">
            <Logo height={46} />
          </div>
          <h2 className="mt-8 font-display text-4xl font-extrabold leading-tight tracking-tight">
            Shift perspective.
            <br />
            Unlock potential.
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/70">
            A focused, secure home for your exam preparation — structured notes, real progress, and
            calm study discipline.
          </p>
        </div>

        <p className="relative text-sm text-white/50">© Parallax Flow</p>
      </div>

      {/* Form column */}
      <div className="flex min-h-dvh flex-col">
        <div className="flex items-center justify-between px-5 py-4 lg:justify-end lg:px-8 lg:py-6">
          <span className="inline-flex items-center gap-2 text-brand lg:hidden">
            <EyeMark size={22} />
            <span className="font-display text-base font-extrabold tracking-tight">
              Parallax Flow
            </span>
          </span>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-16 pt-2 sm:px-8">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-[26px] font-bold tracking-tight text-fg">{title}</h1>
            {subtitle ? <p className="mt-1.5 text-sm text-muted">{subtitle}</p> : null}
            <div className="mt-7">{children}</div>
            {footer ? <div className="mt-6 text-center text-sm text-muted">{footer}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
