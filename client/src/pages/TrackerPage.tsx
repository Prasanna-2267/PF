import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AnimatedNumber,
  Badge,
  Button,
  Card,
  CardDescription,
  CardTitle,
  ErrorState,
  IconButton,
  Input,
  Progress,
  ProgressRing,
  Skeleton,
  Stat,
  useToast,
  CalendarIcon,
  ClockIcon,
  GraduationIcon,
  MinusIcon,
  NotesIcon,
  PlayIcon,
  PlusIcon,
  RefreshIcon,
  StopIcon,
  TrendingUpIcon,
} from '../components/ui';
import { CapArt, OrbitArt, RocketArt, StreakFlame } from '../components/decor';
import { PageHeader } from '../components/layout';
import { CatalogPicker, type CatalogSelection } from '../features/catalog';
import { errorMessage } from '../features/auth/auth.api';
import { trackerApi, type Tracker, type TrackerSettings } from '../features/tracker/tracker.api';
import { StudyActivity } from '../features/tracker/StudyActivity';
import { cn } from '../lib/cn';
import { formatMinutes, pressureTone } from '../lib/format';

export function TrackerPage() {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const navigate = useNavigate();
  const tracker = useQuery({ queryKey: ['tracker'], queryFn: trackerApi.get });
  const t = tracker.data;

  const toggle = useMutation({
    mutationFn: () => (t?.checkedIn ? trackerApi.checkout() : trackerApi.checkin()),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tracker'] });
      success(t?.checkedIn ? 'Checked out — your minutes are saved.' : 'Checked in. Timer running.');
    },
    onError: (err) => toastError(errorMessage(err)),
  });

  const active = t?.checkedIn ?? false;

  return (
    <>
      <PageHeader
        eyebrow="Discipline"
        title="Tracker"
        description="Your study rhythm and exam plan."
      />

      {tracker.isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6 lg:gap-5">
          <Skeleton shape="block" className="col-span-2 h-52 lg:col-span-4" />
          <Skeleton shape="block" className="col-span-2 h-52 lg:col-span-2" />
          <Skeleton shape="block" className="col-span-1 h-28 lg:col-span-2" />
          <Skeleton shape="block" className="col-span-1 h-28 lg:col-span-2" />
          <Skeleton shape="block" className="col-span-1 h-28 lg:col-span-2" />
          <Skeleton shape="block" className="col-span-1 h-28 lg:col-span-2" />
          <Skeleton shape="block" className="col-span-2 h-64 lg:col-span-6" />
        </div>
      )}

      {tracker.isError && (
        <ErrorState onRetry={() => void tracker.refetch()} message={errorMessage(tracker.error)} />
      )}

      {t && (
        <div className="pf-stagger grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6 lg:gap-5">
          {/* Timer hero — navy while a session is running, calm light card when idle */}
          <Card
            variant={active ? 'navy' : 'default'}
            className="col-span-2 sm:p-6 lg:col-span-4"
          >
            {active ? (
              <>
                <span className="pf-hero-ring -right-16 -top-24 h-64 w-64" aria-hidden="true" />
                <span className="pf-hero-ring-gold -right-8 -top-12 h-40 w-40" aria-hidden="true" />
                <OrbitArt className="pointer-events-none absolute -bottom-14 -left-16 h-64 w-64 text-white/15 max-lg:hidden" />
              </>
            ) : null}

            <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              <ProgressRing
                value={targetPct(t.todayMinutes, t.targetMinutes)}
                size={130}
                strokeWidth={11}
                tone={
                  active
                    ? 'gold'
                    : t.targetMinutes > 0 && t.todayMinutes >= t.targetMinutes
                      ? 'success'
                      : 'primary'
                }
                trackClassName={active ? 'text-white/15' : undefined}
                label="Today's study progress"
              >
                <span
                  className={cn(
                    'font-display text-2xl font-extrabold tracking-tight tabular',
                    active ? 'text-white' : 'text-fg',
                  )}
                >
                  <AnimatedNumber value={t.todayMinutes} />
                  <span className="ml-0.5 text-sm font-semibold">m</span>
                </span>
                <span
                  className={cn('text-[11px] font-medium', active ? 'text-white/60' : 'text-muted')}
                >
                  of {formatMinutes(t.targetMinutes)}
                </span>
              </ProgressRing>

              <div className="flex w-full min-w-0 flex-1 flex-col">
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      'text-[11px] font-bold uppercase tracking-[0.14em]',
                      active ? 'text-white/60' : 'text-muted',
                    )}
                  >
                    Study session
                  </p>
                  {active ? (
                    <span className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2 text-xs font-semibold text-gold-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-gold-400" aria-hidden="true" />
                      Session active
                    </span>
                  ) : (
                    <Badge tone="neutral" dot>
                      Not checked in
                    </Badge>
                  )}
                </div>
                <p
                  className={cn(
                    'mt-2 font-display text-xl font-bold tracking-tight sm:text-2xl',
                    active ? 'text-white' : 'text-fg',
                  )}
                >
                  {active ? 'Focus mode is on.' : 'Ready for today’s session?'}
                </p>
                <p className={cn('mt-1 text-sm', active ? 'text-white/60' : 'text-muted')}>
                  {active
                    ? 'Every minute is counting toward today’s target.'
                    : 'Check in to start counting minutes toward your target.'}
                </p>
                <div className="mt-4">
                  <Button
                    size="lg"
                    variant={active ? 'gold' : 'primary'}
                    onClick={() => toggle.mutate()}
                    loading={toggle.isPending}
                    leftIcon={active ? <StopIcon size={18} /> : <PlayIcon size={18} />}
                    fullWidth
                  >
                    {active ? 'Check out · End session' : 'Check in · Start studying'}
                  </Button>
                  <p className={cn('mt-2 text-xs', active ? 'text-white/50' : 'text-muted')}>
                    Long sessions check out on their own after 8 hours, so your minutes are always
                    counted — just check in again to keep studying.
                  </p>
                </div>
              </div>

              {!active ? (
                <RocketArt className="pointer-events-none h-36 w-auto shrink-0 self-center max-lg:hidden" />
              ) : null}
            </div>
          </Card>

          {/* Exam countdown + numeric pressure */}
          <Card className="pf-lift col-span-2 flex flex-col gap-4 lg:col-span-2 lg:self-start">
            {t.exam.date ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-gold-strong">
                      {t.exam.label || 'Exam'}
                    </p>
                    <p className="mt-1 font-display text-4xl font-extrabold tracking-tight tabular">
                      <span className="pf-text-gold">
                        <AnimatedNumber value={t.exam.daysLeft ?? 0} />
                      </span>
                      <span className="ml-2 text-sm font-medium tracking-normal text-muted">
                        days left
                      </span>
                    </p>
                    <p className="mt-1.5 text-xs text-muted tabular">
                      {new Date(t.exam.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-soft-fg">
                    <CalendarIcon size={18} />
                  </span>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted">Pressure</span>
                    <Badge tone={pressureTone(t.exam.pressure)}>
                      <span className="tabular">{t.exam.pressure} / 100</span>
                    </Badge>
                  </div>
                  <Progress
                    value={t.exam.pressure}
                    tone={pressureTone(t.exam.pressure)}
                    label="Exam pressure"
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <CapArt className="h-24 w-auto shrink-0" />
                <div className="min-w-0">
                  <p className="font-display text-base font-bold text-fg">No exam date yet</p>
                  <p className="mt-1 text-sm text-muted">
                    Set your exam date in settings below to see your countdown and pressure.
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Rhythm bento — a row of differently placed tiles */}
          <p className="col-span-2 -mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted lg:col-span-6">
            Your rhythm
          </p>
          <Stat
            className="pf-lift col-span-1 lg:col-span-2"
            label="Streak"
            value={<AnimatedNumber value={t.streak} />}
            unit={t.streak === 1 ? 'day' : 'days'}
            icon={<StreakFlame active={active && t.streak > 0} className="h-5 w-4" />}
          />
          <Stat
            className="pf-lift col-span-1 lg:col-span-2"
            label="Momentum"
            value={<AnimatedNumber value={t.momentum} />}
            unit="/ 100"
            icon={<TrendingUpIcon size={18} />}
            footer={
              <Progress
                value={t.momentum}
                tone={t.momentum >= 60 ? 'success' : t.momentum >= 30 ? 'primary' : 'warn'}
                size="sm"
              />
            }
          />
          <Stat
            className="pf-lift col-span-1 lg:col-span-2"
            label="Syllabus"
            value={<AnimatedNumber value={t.syllabus.percent} />}
            unit="%"
            icon={<GraduationIcon size={18} />}
            hint={`${t.syllabus.completed}/${t.syllabus.total} lessons`}
          />
          <Stat
            className="pf-lift col-span-1 lg:col-span-2"
            label="Revisions"
            value={<AnimatedNumber value={t.totalRevisions} />}
            icon={<RefreshIcon size={18} />}
            hint="lessons revised"
          />

          {/* Jump back in — the last lesson you opened */}
          <Card className="pf-lift col-span-2 flex items-center gap-4 lg:col-span-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary-soft-fg">
              <NotesIcon size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                {t.lastLesson ? 'Pick up where you left off' : 'Start studying'}
              </p>
              <p className="truncate font-display text-base font-bold text-fg">
                {t.lastLesson ? t.lastLesson.title : 'Open your first lesson'}
              </p>
            </div>
            <Button
              variant={t.lastLesson ? 'primary' : 'secondary'}
              onClick={() => navigate(t.lastLesson ? `/lesson/${t.lastLesson.id}` : '/notes')}
            >
              {t.lastLesson ? 'Resume' : 'Browse notes'}
            </Button>
          </Card>

          {/* Study activity — graphs, subject progress, readiness + patterns */}
          <div className="col-span-2 lg:col-span-6">
            <StudyActivity t={t} />
          </div>

          {/* Settings */}
          <div className="col-span-2 lg:col-span-6">
            <SettingsForm t={t} />
          </div>
        </div>
      )}
    </>
  );
}

function targetPct(minutes: number, target: number): number {
  return target > 0 ? Math.min(100, (minutes / target) * 100) : 0;
}

const GOAL_PRESETS = [30, 45, 60, 90, 120, 180];

function GoalStepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div className="text-center">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="flex items-center gap-1.5">
        <IconButton
          size="sm"
          variant="secondary"
          aria-label={`Decrease ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
          icon={<MinusIcon size={16} />}
        />
        <span className="w-10 font-display text-2xl font-extrabold tabular text-fg">{value}</span>
        <IconButton
          size="sm"
          variant="secondary"
          aria-label={`Increase ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + step))}
          icon={<PlusIcon size={16} />}
        />
      </div>
    </div>
  );
}

/** Hours + minutes stepper with quick presets — replaces the plain minutes field. */
function DailyGoalPicker({
  minutes,
  onChange,
  error,
}: {
  minutes: number;
  onChange: (m: number) => void;
  error?: string;
}) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return (
    <div className="sm:col-span-2">
      <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-fg">
        <ClockIcon size={15} className="text-gold-strong" />
        Daily study goal
      </p>
      <div className="rounded-field border border-line bg-sunken/40 p-4">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-start">
          <GoalStepper
            label="Hours"
            value={hours}
            min={0}
            max={12}
            onChange={(h) => onChange(h * 60 + mins)}
          />
          <span className="mt-4 text-2xl font-bold text-faint">:</span>
          <GoalStepper
            label="Minutes"
            value={mins}
            min={0}
            max={55}
            step={5}
            onChange={(m) => onChange(hours * 60 + m)}
          />
          <div className="mt-3 flex-1 text-center sm:mt-4 sm:text-right">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Your goal</p>
            <p className="font-display text-2xl font-extrabold text-gold-strong">
              {minutes > 0 ? formatMinutes(minutes) : '—'}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
          <span className="mr-1 text-xs font-medium text-muted">Quick</span>
          {GOAL_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                minutes === p
                  ? 'border-primary bg-primary-soft text-primary-soft-fg'
                  : 'border-line text-muted hover:border-primary/40 hover:text-fg',
              )}
            >
              {formatMinutes(p)}
            </button>
          ))}
        </div>
      </div>
      {error ? <p className="mt-1.5 text-xs font-medium text-danger-fg">{error}</p> : null}
    </div>
  );
}

/**
 * Mounted only after the tracker loads, so local state is seeded once from the
 * loaded values — user edits survive background refetches.
 */
function SettingsForm({ t }: { t: Tracker }) {
  const qc = useQueryClient();
  const { success, error: toastError } = useToast();

  const [examDate, setExamDate] = useState(t.exam.date ? t.exam.date.slice(0, 10) : '');
  const [examLabel, setExamLabel] = useState(t.exam.label ?? '');
  const [goalMins, setGoalMins] = useState(t.targetMinutes);
  const [goalError, setGoalError] = useState('');
  // Seed once from the saved stage so the picker reflects the current selection.
  const [picker, setPicker] = useState<CatalogSelection>(() => ({
    categoryId: t.activeStage?.categoryId ?? null,
    stageId: t.activeStage?.id ?? null,
    subjectId: null,
  }));

  const save = useMutation({
    mutationFn: (d: TrackerSettings) => trackerApi.settings(d),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tracker'] }),
  });

  const stageSave = useMutation({
    mutationFn: (activeStageId: string) => trackerApi.settings({ activeStageId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tracker'] });
      success('Active stage updated');
    },
    onError: (err) => toastError(errorMessage(err)),
  });

  function onPickerChange(next: CatalogSelection) {
    setPicker(next);
    if (next.stageId && next.stageId !== t.activeStageId) stageSave.mutate(next.stageId);
  }

  function onSave() {
    setGoalError('');
    if (goalMins < 5 || goalMins > 1440) {
      setGoalError('Pick a goal of at least 5 minutes.');
      return;
    }
    save.mutate(
      {
        examDate: examDate ? new Date(examDate).toISOString() : null,
        examLabel: examLabel.trim() || null,
        dailyTargetMinutes: goalMins,
      },
      {
        onSuccess: () => success('Saved'),
        onError: (err) => toastError(errorMessage(err)),
      },
    );
  }

  return (
    <Card>
      <p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-strong">
        <span className="pf-gold-rule" aria-hidden="true" />
        Plan
      </p>
      <CardTitle>Study settings</CardTitle>
      <CardDescription>Set your exam, daily goal, and the stage you&apos;re tracking.</CardDescription>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Input
          label="Exam date"
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
        />
        <Input
          label="Exam label"
          placeholder="e.g. CA Inter May 2026"
          value={examLabel}
          onChange={(e) => setExamLabel(e.target.value)}
        />
        <DailyGoalPicker minutes={goalMins} onChange={setGoalMins} error={goalError} />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          Active stage
        </p>
        {t.activeStage ? (
          <p className="mb-2.5 inline-flex items-center gap-2 rounded-field bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary-soft-fg">
            <GraduationIcon size={16} />
            {t.activeStage.categoryName} · {t.activeStage.name}
            {stageSave.isPending ? (
              <span className="text-xs font-medium opacity-70">saving…</span>
            ) : null}
          </p>
        ) : null}
        <CatalogPicker value={picker} onChange={onPickerChange} includeSubject={false} layout="grid" />
        <p className="mt-2 text-xs text-muted">
          {t.activeStageId
            ? 'Your syllabus % is calculated from this stage. Pick a different exam and stage above to switch — it saves instantly.'
            : 'Choose the stage you’re studying — it drives your syllabus completion %.'}
        </p>
      </div>

      <div className="mt-5">
        <Button onClick={onSave} loading={save.isPending}>
          Save settings
        </Button>
      </div>
    </Card>
  );
}
