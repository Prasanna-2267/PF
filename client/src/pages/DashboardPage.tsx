import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AnimatedNumber,
  Badge,
  Button,
  Card,
  ErrorState,
  Progress,
  ProgressRing,
  Skeleton,
  Spinner,
  useToast,
  ArrowRightIcon,
  CalendarIcon,
  ChevronRightIcon,
  LibraryIcon,
  NotesIcon,
  PlayIcon,
  PracticeIcon,
  StopIcon,
  TrackerIcon,
} from '../components/ui';
import { CapArt, OrbitArt, RocketArt, StreakFlame } from '../components/decor';
import { useMediaQuery } from '../hooks';
import { StageSetupCard } from '../features/catalog';
import { HomeBanner } from '../features/home/HomeBanner';
import { errorMessage } from '../features/auth/auth.api';
import { trackerApi } from '../features/tracker/tracker.api';
import { useAuthStore } from '../lib/auth-store';
import { cn } from '../lib/cn';
import { formatMinutes, pressureTone } from '../lib/format';

export function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';

  const tracker = useQuery({ queryKey: ['tracker'], queryFn: trackerApi.get });
  const t = tracker.data;
  const active = t?.checkedIn ?? false;

  const toggle = useMutation({
    mutationFn: () => (t?.checkedIn ? trackerApi.checkout() : trackerApi.checkin()),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tracker'] });
      success(t?.checkedIn ? 'Checked out — nice work.' : 'Checked in. Your timer is running.');
    },
    onError: (err) => toastError(errorMessage(err)),
  });

  if (tracker.isLoading) {
    // Mirrors the real layout's mobile order (hero first) so content doesn't
    // reorder when data lands.
    return (
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        <div className="flex flex-col gap-3 sm:gap-4 lg:order-2 lg:col-span-2 lg:gap-5">
          <Skeleton shape="block" className="h-[420px] lg:h-72" />
          <Skeleton shape="block" className="h-40 lg:h-52" />
        </div>
        <Skeleton shape="block" className="h-24 lg:order-4 lg:col-span-4" />
        <div className="flex flex-col gap-3 sm:gap-4 lg:order-1 lg:gap-5">
          <Skeleton shape="block" className="h-72" />
          <Skeleton shape="block" className="h-24" />
          <Skeleton shape="block" className="h-32" />
        </div>
        <div className="flex flex-col gap-3 sm:gap-4 lg:order-3 lg:gap-5">
          <Skeleton shape="block" className="h-44" />
          <Skeleton shape="block" className="hidden h-56 lg:block" />
        </div>
      </div>
    );
  }
  if (tracker.isError || !t) {
    return (
      <ErrorState onRetry={() => void tracker.refetch()} message={errorMessage(tracker.error)} />
    );
  }

  const orbProps = {
    active,
    loading: toggle.isPending,
    onToggle: () => toggle.mutate(),
    baseMinutes: t.todayMinutes,
    targetMinutes: t.targetMinutes,
    since: tracker.dataUpdatedAt,
  };

  return (
    <div className="pf-stagger">
      {!t.activeStageId ? (
        <div className="mb-3 sm:mb-4">
          <StageSetupCard />
        </div>
      ) : null}

      {/* DOM order == mobile visual order (hero → announcements → stats), so
          keyboard/screen-reader focus follows what's on screen. lg:order-*
          rearranges the three desktop columns without touching mobile. */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {/* ── CENTER — hero + session orb + two feature cards ── */}
        <div className="flex flex-col lg:order-2 lg:col-span-2">
          <Card
            variant="navy"
            // sm:pb duplicate is REQUIRED: Card's own `sm:p-5` shorthand would
            // otherwise out-cascade the unprefixed pb at 640–1023px and let
            // the orb cover the hero text. px (not rem) so the reserve moves
            // in lockstep with the px-sized orb/pull-up.
            className="relative flex flex-1 flex-col justify-center overflow-hidden pt-7 pb-[132px] text-center sm:pt-6 sm:pb-[132px] lg:pt-5 lg:pb-44"
          >
            <OrbitArt className="pf-float pointer-events-none absolute -bottom-16 -left-14 h-56 w-56 text-white/10 [animation-delay:1s]" />
            <OrbitArt className="pf-orbit pointer-events-none absolute -right-14 -top-16 h-48 w-48 text-white/[0.07] max-sm:hidden" />
            <span className="pf-hero-ring pf-float -right-16 top-24 h-40 w-40 [animation-delay:0.4s] max-sm:hidden" aria-hidden="true" />
            <span className="pf-hero-ring-gold pf-float -left-10 -top-8 h-32 w-32 [animation-delay:1.6s]" aria-hidden="true" />
            <FloatBlob className="-bottom-4 -left-6 h-32 w-32 bg-primary/30 [animation-delay:1s]" />
            <FloatBlob className="-right-4 top-10 h-28 w-28 bg-gold-500/25 [animation-delay:2s] max-sm:hidden" />
            <span className="pf-sparkle absolute left-10 top-9 h-1.5 w-1.5 rounded-full bg-gold-400" aria-hidden="true" />
            <span className="pf-sparkle absolute right-16 top-20 h-1 w-1 rounded-full bg-white/70 [animation-delay:1.3s]" aria-hidden="true" />
            <span className="pf-sparkle absolute bottom-8 left-1/3 h-1 w-1 rounded-full bg-gold-400 [animation-delay:0.7s] max-sm:hidden" aria-hidden="true" />

            <p className="relative text-[11px] font-bold uppercase tracking-[0.14em] text-gold-400">
              {todayLine()}
            </p>
            <h1 className="relative mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-[40px]">
              {greeting()}, {firstName}
            </h1>
            <p className="relative mx-auto mt-2 max-w-sm text-sm text-white/70">
              {active
                ? 'Your session is running — stay in the zone.'
                : 'Check in below and make today count.'}
            </p>

          </Card>

          <div className="relative mt-3 grid flex-1 grid-cols-2 gap-3 sm:mt-4 sm:gap-4 lg:gap-5">
            {/* The orb straddles the hero/cards seam on EVERY breakpoint —
                the feature cards rise up to flank it, no blank band between.
                z-10 keeps it under the sticky chrome (z-30); the shell is
                pointer-events-none so only the button takes taps and the card
                corners underneath stay tappable. */}
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 lg:hidden">
              <SessionOrb size="sm" {...orbProps} />
            </div>
            <div className="pointer-events-none absolute -top-16 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
              <SessionOrb size="lg" {...orbProps} />
            </div>

            {/* Feature 1 — continue studying */}
            <Link
              to={t.lastLesson ? `/lesson/${t.lastLesson.id}` : '/notes'}
              className="pf-lift pf-dots group relative flex min-h-[200px] flex-col overflow-hidden rounded-card border border-line bg-gradient-to-br from-primary-soft/45 via-surface to-surface px-4 pb-4 pt-20 shadow-card sm:px-5 sm:pb-5 lg:min-h-[188px] lg:pt-[84px]"
            >
              <NotesIcon
                size={150}
                className="pointer-events-none absolute -right-4 -top-3 text-primary opacity-[0.09] max-sm:hidden"
              />
              <FloatBlob className="-left-8 top-2 h-28 w-28 bg-primary/30" />
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-fg shadow-sm">
                <NotesIcon size={20} />
              </span>
              <p className="relative mt-3 font-display text-base font-bold text-fg">
                Continue studying
              </p>
              <p className="relative mt-1 line-clamp-2 text-sm text-muted">
                {t.lastLesson ? t.lastLesson.title : 'Open your first lesson and get going.'}
              </p>
              <span className="relative mt-auto inline-flex items-center gap-1 pt-2.5 text-xs font-bold text-primary">
                {t.lastLesson ? 'Resume' : 'Start now'}
                <ArrowRightIcon size={13} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>

            {/* Feature 2 — practice */}
            <Link
              to="/practice"
              className="pf-lift pf-dots group relative flex min-h-[200px] flex-col overflow-hidden rounded-card border border-line bg-gradient-to-br from-success-soft/45 via-surface to-surface px-4 pb-4 pt-20 shadow-card sm:px-5 sm:pb-5 lg:min-h-[188px] lg:pt-[84px]"
            >
              <PracticeIcon
                size={150}
                className="pointer-events-none absolute -right-4 -top-3 text-success opacity-[0.1] max-sm:hidden"
              />
              <FloatBlob className="-right-8 top-2 h-28 w-28 bg-success/30" />
              <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-success text-white shadow-sm">
                <PracticeIcon size={20} />
              </span>
              <p className="relative mt-3 font-display text-base font-bold text-fg">
                Practice questions
              </p>
              <p className="relative mt-1 line-clamp-2 text-sm text-muted">
                Test yourself and sharpen your exam speed.
              </p>
              <span className="relative mt-auto inline-flex items-center gap-1 pt-2.5 text-xs font-bold text-success-fg">
                Start practising
                <ArrowRightIcon size={13} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>

        {/* ── Announcements + Telegram — right under the hero on mobile ── */}
        <HomeBanner className="lg:order-4 lg:col-span-4" />

        {/* ── LEFT column ── */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:order-1 lg:col-span-1 lg:gap-5">
          {/* Exam countdown (grows to fill) */}
          <Card className="pf-dots relative flex flex-1 flex-col justify-between gap-4 overflow-hidden bg-gradient-to-br from-gold-soft/55 to-transparent sm:gap-6">
            <FloatBlob className="-right-10 -top-10 h-28 w-28 bg-gold-400/25" />
            <FloatBlob className="-bottom-12 -left-8 h-24 w-24 bg-primary/15 [animation-delay:1.5s] max-sm:hidden" />
            {t.exam.date ? (
              <>
                <div className="relative flex items-start justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-soft text-gold-soft-fg">
                    <CalendarIcon size={18} />
                  </span>
                  <Badge tone={pressureTone(t.exam.pressure)}>{pressureLabel(t.exam.pressure)}</Badge>
                </div>
                <ExamCalendar date={new Date(t.exam.date)} />
                <div className="relative">
                  <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-gold-strong">
                    {t.exam.label || 'Your exam'}
                  </p>
                  <p className="pf-text-gold font-display text-4xl font-extrabold leading-none tracking-tight tabular sm:text-5xl">
                    <AnimatedNumber value={t.exam.daysLeft ?? 0} />
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-muted">
                    days left ·{' '}
                    {new Date(t.exam.date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted">Exam pressure</span>
                      <span className="text-xs font-semibold tabular text-muted">
                        {t.exam.pressure}/100
                      </span>
                    </div>
                    <Progress
                      value={t.exam.pressure}
                      tone={pressureTone(t.exam.pressure)}
                      label="Exam pressure"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="relative flex h-full flex-col items-start justify-between gap-4">
                <CapArt className="h-16 w-auto" />
                <div>
                  <p className="font-display text-base font-bold text-fg">No exam date yet</p>
                  <p className="mt-1 text-sm text-muted">Add it to unlock your countdown.</p>
                  <Button variant="secondary" className="mt-3" onClick={() => navigate('/tracker')}>
                    Set exam date
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Streak */}
          <Card className="pf-dots relative overflow-hidden bg-gradient-to-br from-gold-soft/35 to-transparent">
            <FloatBlob className="-right-8 -top-8 h-24 w-24 bg-gold-400/20" />
            <div className="relative flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Streak</p>
                <p className="font-display text-3xl font-extrabold tracking-tight text-gold-strong tabular sm:text-4xl">
                  <AnimatedNumber value={t.streak} />
                  <span className="ml-1 text-sm font-medium text-muted">
                    day{t.streak === 1 ? '' : 's'}
                  </span>
                </p>
              </div>
              <StreakFlame active={active && t.streak > 0} className="h-10 w-8" />
            </div>
            <p className="relative mt-1 text-xs text-muted">
              {active ? 'Active today — keep it lit.' : 'Check in to extend it.'}
            </p>
          </Card>

          {/* CTA — launch into notes */}
          <Card className="pf-dots relative overflow-hidden bg-gradient-to-br from-primary-soft/45 to-transparent">
            <FloatBlob className="-bottom-8 -left-8 h-24 w-24 bg-primary/25" />
            <RocketArt className="pf-float pointer-events-none absolute -right-2 -top-3 h-[74px] w-auto [animation-delay:0.5s]" />
            <p className="relative text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Ready to study?
            </p>
            <p className="relative mb-3 mt-0.5 font-display text-base font-bold text-fg">
              Jump into your notes
            </p>
            <Button
              variant="primary"
              fullWidth
              leftIcon={<NotesIcon size={18} />}
              onClick={() => navigate('/notes')}
              className="relative"
            >
              Browse notes
            </Button>
          </Card>
        </div>

        {/* ── RIGHT column ── */}
        <div className="flex flex-col gap-3 sm:gap-4 lg:order-3 lg:col-span-1 lg:gap-5">
          {/* Syllabus — big headline stat */}
          <Card className="pf-dots relative overflow-hidden bg-gradient-to-br from-info-soft/45 to-transparent">
            <FloatBlob className="-right-8 -top-6 h-24 w-24 bg-info/20" />
            <FloatBlob className="-bottom-8 -left-8 h-24 w-24 bg-primary/15 [animation-delay:1.2s] max-sm:hidden" />
            <p className="pf-text-gradient relative font-display text-4xl font-extrabold tracking-tight tabular sm:text-5xl">
              <AnimatedNumber value={t.syllabus.percent} />%
            </p>
            <p className="relative my-2 text-sm font-semibold text-muted">
              <span className="text-primary">[</span> syllabus complete{' '}
              <span className="text-primary">]</span>
            </p>
            <Progress value={t.syllabus.percent} tone="primary" />
            <p className="relative mt-2 text-xs text-muted">
              {t.syllabus.completed}/{t.syllabus.total} lessons done
            </p>
          </Card>

          {/* Quick links — desktop only: BottomNav already covers these on mobile */}
          <Card className="pf-dots relative hidden flex-1 flex-col overflow-hidden lg:flex">
            <FloatBlob className="-bottom-8 -right-8 h-24 w-24 bg-primary/20" />
            <p className="relative font-display text-base font-bold text-fg">Jump back in</p>
            <p className="relative mt-0.5 text-sm text-muted">Head straight to your study areas.</p>
            <div className="relative mt-3 flex flex-1 flex-col justify-between gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="pf-lift group flex flex-1 items-center gap-3 rounded-field border border-line bg-sunken/40 p-2.5"
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${a.tile}`}>
                    <a.icon size={17} />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-fg">{a.label}</span>
                  <ChevronRightIcon
                    size={15}
                    className="text-faint transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── session orb ─────────────────────────────────────────────────────── */

const ORB = {
  sm: {
    box: 'h-[196px] w-[196px]',
    ring: 180,
    stroke: 10,
    halo: 'h-[240px] w-[240px]',
    sweep: 'h-[232px] w-[232px]',
    // Softer than lg: this orb floats over light canvas + card tops on mobile.
    shadow: 'shadow-[0_20px_48px_-16px_rgba(18,22,60,0.55)]',
  },
  lg: {
    box: 'h-[228px] w-[228px]',
    ring: 212,
    stroke: 12,
    halo: 'h-[300px] w-[300px]',
    sweep: 'h-[268px] w-[268px]',
    shadow: 'shadow-[0_26px_66px_-15px_rgba(18,22,60,0.75)]',
  },
} as const;

/**
 * The round check-in hub: gold progress ring + big session button + live clock.
 * Owns its own 1-second tick so the rest of the page doesn't re-render while a
 * session runs. Shell is pointer-events-none — only the button takes taps, so
 * anything the orb overlaps stays clickable.
 */
function SessionOrb({
  size,
  active,
  loading,
  onToggle,
  baseMinutes,
  targetMinutes,
  since,
}: {
  size: 'sm' | 'lg';
  active: boolean;
  loading: boolean;
  onToggle: () => void;
  baseMinutes: number;
  targetMinutes: number;
  since: number;
}) {
  // Both orb instances stay mounted (one per breakpoint) — only the visible
  // one runs its 1-second tick.
  const visible = useMediaQuery(size === 'lg' ? '(min-width: 1024px)' : '(max-width: 1023.98px)');
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!active || !visible) return;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [active, visible]);

  // Anchor the clock to the values seen when the session became active, so a
  // background refetch (which rounds server-side minutes) can't make the
  // ticking clock jump forwards/backwards mid-session.
  const prevActive = useRef(active);
  const anchor = useRef({ since, base: baseMinutes });
  if (!active || (active && !prevActive.current)) anchor.current = { since, base: baseMinutes };
  prevActive.current = active;

  // `base` counts the open session up to fetch time; add the seconds elapsed
  // since so the clock ticks live client-side.
  const elapsedSec = active ? Math.max(0, Math.floor((Date.now() - anchor.current.since) / 1000)) : 0;
  const liveSec = anchor.current.base * 60 + elapsedSec;
  const liveMin = Math.floor(liveSec / 60);
  const c = ORB[size];

  return (
    // `isolate` pins the -z-10 glow layers inside this box's own stacking
    // context, so they paint above the surface behind the orb (not under it).
    <div className={cn('pointer-events-none relative isolate', c.box)}>
      {/* soft gold glow + rotating light sweep (decorative) */}
      {/* Stronger halo in light mode — 25% gold is invisible on the near-white
          canvas half of the straddle; dark keeps the subtler wash. */}
      <span
        className={cn(
          'absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-400/40 blur-[44px] dark:bg-gold-400/25 motion-reduce:hidden',
          c.halo,
        )}
        aria-hidden="true"
      />
      <span
        className={cn(
          'pf-orbit absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(201,167,106,0.35),transparent_60%)] blur-md motion-reduce:hidden',
          c.sweep,
        )}
        aria-hidden="true"
      />
      <span className="absolute -inset-2.5 -z-10 rounded-full bg-navy-900/35 blur-lg" aria-hidden="true" />

      {/* Normal-flow h-full/w-full (NOT `absolute`): .pf-hero carries its own
          position:relative which out-cascades the position utilities. */}
      <div
        className={cn(
          'pf-hero flex h-full w-full items-center justify-center rounded-full ring-1 ring-white/15',
          c.shadow,
        )}
      >
        <span
          className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/15 via-transparent to-black/15"
          aria-hidden="true"
        />
        <span
          className="pf-orbit pointer-events-none absolute inset-3 rounded-full border border-dashed border-white/10"
          aria-hidden="true"
        />
        <ProgressRing
          value={targetPct(liveMin, targetMinutes)}
          size={c.ring}
          strokeWidth={c.stroke}
          tone="gold"
          trackClassName="text-white/15"
          label="Today's study progress"
          className="relative"
        >
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
              {active ? 'Check out' : 'Check in'}
            </span>
            <SessionButton active={active} loading={loading} onClick={onToggle} />
            {active ? (
              <span className="font-display text-base font-extrabold text-white tabular">
                {formatClock(liveSec)}
              </span>
            ) : (
              <span className="font-display text-sm font-extrabold text-white tabular">
                {formatMinutes(baseMinutes)}
                <span className="text-[11px] font-medium text-white/70">
                  {' '}
                  / {formatMinutes(targetMinutes)}
                </span>
              </span>
            )}
          </div>
        </ProgressRing>
      </div>
    </div>
  );
}

/** Big round check-in / check-out control — live-pulse when active, breathing glow when idle. */
function SessionButton({
  active,
  loading,
  onClick,
}: {
  active: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={active ? 'Check out and end your session' : 'Check in and start studying'}
      className={cn(
        'group pointer-events-auto relative flex h-[64px] w-[64px] items-center justify-center rounded-full text-white shadow-lg outline-none transition-transform duration-200 active:scale-95 disabled:pointer-events-none disabled:opacity-80',
        active
          ? 'bg-danger focus-visible:ring-4 focus-visible:ring-danger/40'
          : 'bg-gradient-to-br from-gold-400 to-gold-600 focus-visible:ring-4 focus-visible:ring-gold-400/40',
      )}
    >
      {active && !loading ? (
        <>
          <span className="absolute inset-0 animate-ping rounded-full bg-danger/50 motion-reduce:hidden" aria-hidden="true" />
          <span className="absolute -inset-1.5 rounded-full border border-white/25" aria-hidden="true" />
        </>
      ) : null}
      {!active && !loading ? (
        <span
          className="absolute -inset-1 animate-pulse rounded-full bg-gold-400/40 blur-md transition-opacity group-hover:opacity-90 motion-reduce:hidden"
          aria-hidden="true"
        />
      ) : null}
      <span className="relative flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
        {loading ? (
          <Spinner size={24} />
        ) : active ? (
          <StopIcon size={25} />
        ) : (
          <PlayIcon size={27} className="translate-x-[2px]" />
        )}
      </span>
    </button>
  );
}

/* ── decorations ─────────────────────────────────────────────────────── */

/** Mini month calendar for the exam card — month follows the exam date, exam day circled. */
function ExamCalendar({ date }: { date: Date }) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const examDay = date.getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);

  return (
    // Decorative — the exam date is stated in text right below it.
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[218px] [perspective:720px]">
      <div className="origin-bottom rounded-card border border-gold/25 bg-gradient-to-br from-surface to-sunken/60 p-3 shadow-[0_16px_34px_-14px_rgba(18,22,60,0.4)] [transform:rotateX(8deg)] sm:[transform:rotateX(12deg)]">
        <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-gold-strong">
          {date.toLocaleDateString('en-IN', { month: 'long' })} {year}
        </p>
        <div className="grid grid-cols-7 gap-y-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
            <span key={i} className="text-center text-[9px] font-bold uppercase text-muted/80">
              {w}
            </span>
          ))}
          {cells.map((d, i) => (
            <span key={i} className="flex justify-center">
              <span
                className={cn(
                  // w-full + max-w lets cells shrink with their grid track on
                  // narrow desktop columns instead of overflowing; ring-inset
                  // keeps the exam-day halo inside its own cell.
                  'flex aspect-square w-full max-w-5 items-center justify-center rounded-full text-[10px] leading-none',
                  d === examDay
                    ? 'bg-gold font-bold text-navy-900 shadow-[0_2px_6px_-1px_rgba(179,138,74,0.6)] ring-2 ring-inset ring-gold/40'
                    : 'font-medium text-fg/80',
                )}
              >
                {d ?? ''}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Soft, slowly-floating colour blob for animated card backgrounds (kept behind content). */
function FloatBlob({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('pf-float pointer-events-none absolute rounded-full blur-2xl', className)}
    />
  );
}

/** One colourful tap-target per app area — desktop sidebar companions. */
const QUICK_ACTIONS = [
  { to: '/notes', label: 'Browse notes', icon: NotesIcon, tile: 'bg-primary-soft text-primary-soft-fg' },
  { to: '/practice', label: 'Practise', icon: PracticeIcon, tile: 'bg-success-soft text-success-fg' },
  { to: '/tracker', label: 'Plan & track', icon: TrackerIcon, tile: 'bg-warn-soft text-warn-fg' },
  { to: '/library', label: 'My library', icon: LibraryIcon, tile: 'bg-info-soft text-info-fg' },
];

/* ── helpers ─────────────────────────────────────────────────────────── */

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayLine(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function targetPct(minutes: number, target: number): number {
  return target > 0 ? Math.min(100, (minutes / target) * 100) : 0;
}

function pressureLabel(p: number): string {
  if (p >= 70) return 'High';
  if (p >= 40) return 'Medium';
  return 'Low';
}

function formatClock(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
