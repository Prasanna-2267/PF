import { useQuery } from '@tanstack/react-query';
import { Alert, Card, ErrorState, Skeleton } from '../../components/ui';
import { BarChart, TrendChart } from '../../components/admin/Charts';
import { trackerApi, type StudyInsights, type Tracker } from './tracker.api';
import { errorMessage } from '../auth/auth.api';
import { formatMinutes } from '../../lib/format';
import { cn } from '../../lib/cn';

function niceDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
function formatHour(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hour = ((h + 11) % 12) + 1;
  return `${hour} ${period}`;
}
function weekDelta(week: number, last: number): string {
  if (last === 0) return week > 0 ? 'new this week' : 'no study yet';
  const pct = Math.round(((week - last) / last) * 100);
  if (pct === 0) return 'same as last week';
  return `${pct > 0 ? '▲' : '▼'} ${Math.abs(pct)}% vs last week`;
}
function tierClass(minutes: number): string {
  if (minutes <= 0) return 'bg-sunken';
  if (minutes < 30) return 'bg-success/25';
  if (minutes < 60) return 'bg-success/45';
  if (minutes < 120) return 'bg-success/70';
  return 'bg-success';
}

const Eyebrow = ({ children }: { children: string }) => (
  <p className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-strong">
    <span className="pf-gold-rule" aria-hidden="true" />
    {children}
  </p>
);

/** Rich study-analytics block: activity, syllabus progress + readiness, and patterns. */
export function StudyActivity({ t }: { t: Tracker }) {
  const q = useQuery({ queryKey: ['tracker', 'insights'], queryFn: trackerApi.insights });
  const d = q.data;

  if (q.isLoading) {
    return (
      <Card>
        <div className="space-y-3">
          <Skeleton shape="block" className="h-20" />
          <Skeleton shape="block" className="h-28" />
        </div>
      </Card>
    );
  }
  if (q.isError) {
    return (
      <Card>
        <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      </Card>
    );
  }
  if (!d) return null;

  return (
    <div className="space-y-4 lg:space-y-6">
      <ActivityCard d={d} target={t.targetMinutes} />
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <SyllabusCard d={d} t={t} />
        <PatternsCard d={d} />
      </div>
    </div>
  );
}

/* ── Activity: summary tiles + goal-lined bar chart + heatmap ── */
function ActivityCard({ d, target }: { d: StudyInsights; target: number }) {
  const last30 = d.daily.slice(-30);
  const hitDays = target > 0 ? last30.filter((x) => x.minutes >= target).length : 0;

  return (
    <Card>
      <Eyebrow>Study activity</Eyebrow>
      <h2 className="font-display text-lg font-bold text-fg">Your last 12 weeks</h2>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Tile label="This week" value={formatMinutes(d.summary.weekMinutes)} sub={weekDelta(d.summary.weekMinutes, d.summary.lastWeekMinutes)} />
        <Tile label="Goal hit" value={`${hitDays}/30`} sub={`days ≥ ${formatMinutes(target)}`} />
        <Tile label="Total studied" value={formatMinutes(d.summary.totalMinutes)} sub={`${d.summary.completedLessons} lesson${d.summary.completedLessons === 1 ? '' : 's'} done`} />
        <Tile label="Days studied" value={String(d.summary.daysStudied)} sub={`avg ${formatMinutes(d.summary.avgPerActiveDay)}/day`} />
        <Tile label="Best day" value={formatMinutes(d.summary.bestDayMinutes)} sub={d.summary.bestDayDate ? niceDate(d.summary.bestDayDate) : '—'} />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
          Daily minutes · last 14 days
        </p>
        <BarChart
          tone="gold"
          height={110}
          reference={target}
          referenceLabel={`Goal ${target}m`}
          data={d.daily.slice(-14).map((x) => ({ label: niceDate(x.date), value: x.minutes }))}
        />
      </div>

      <div className="mt-5">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Consistency</p>
        <Heatmap daily={d.daily} />
      </div>
    </Card>
  );
}

/* ── Syllabus by subject + exam-readiness projection ── */
function SyllabusCard({ d, t }: { d: StudyInsights; t: Tracker }) {
  return (
    <Card className="flex flex-col">
      <Eyebrow>Syllabus</Eyebrow>
      <h2 className="font-display text-lg font-bold text-fg">Progress by subject</h2>

      {d.subjects.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Subject progress appears once your stage has published lessons.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {d.subjects.map((s) => (
            <SubjectBar key={s.id} name={s.name} completed={s.completed} total={s.total} />
          ))}
        </div>
      )}

      <div className="mt-4">
        <Readiness t={t} recent14={d.summary.recentCompleted14} />
      </div>
    </Card>
  );
}

function Readiness({ t, recent14 }: { t: Tracker; recent14: number }) {
  const remaining = Math.max(0, t.syllabus.total - t.syllabus.completed);
  if (t.syllabus.total === 0) {
    return <Alert tone="info">Set your stage to unlock a readiness projection.</Alert>;
  }
  if (remaining === 0) {
    return <Alert tone="success" title="Syllabus complete 🎉">You've finished every published lesson for this stage.</Alert>;
  }
  const pace = recent14 / 14; // lessons/day over the last 2 weeks
  if (pace <= 0) {
    return (
      <Alert tone="warn" title="Pace has stalled">
        No lessons completed in the last 2 weeks. {remaining} lesson{remaining === 1 ? '' : 's'} left —
        get moving to stay on track.
      </Alert>
    );
  }
  const daysToFinish = Math.ceil(remaining / pace);
  const perWeek = Math.round(pace * 7);

  if (t.exam.daysLeft == null) {
    return (
      <Alert tone="info">
        At ~{perWeek} lesson{perWeek === 1 ? '' : 's'}/week, you'll finish the remaining {remaining} in
        about <strong>{daysToFinish} days</strong>. Set an exam date to see if you're on track.
      </Alert>
    );
  }
  const slack = t.exam.daysLeft - daysToFinish;
  if (slack >= 0) {
    return (
      <Alert tone="success" title="On track">
        At your current pace (~{perWeek}/week) you'll finish about <strong>{slack} day{slack === 1 ? '' : 's'}</strong> before
        your exam.
      </Alert>
    );
  }
  return (
    <Alert tone="danger" title="Behind schedule">
      At your current pace you'd finish <strong>{Math.abs(slack)} day{Math.abs(slack) === 1 ? '' : 's'}</strong> after
      your exam. You need ~{Math.ceil(remaining / Math.max(1, t.exam.daysLeft))} lessons/day to catch up.
    </Alert>
  );
}

/* ── Patterns: time-of-day + weekly trend ── */
function PatternsCard({ d }: { d: StudyInsights }) {
  const weekly: number[] = [];
  for (let i = 0; i < d.daily.length; i += 7) {
    weekly.push(d.daily.slice(i, i + 7).reduce((a, b) => a + b.minutes, 0));
  }

  return (
    <Card className="flex flex-col">
      <Eyebrow>Patterns</Eyebrow>
      <h2 className="font-display text-lg font-bold text-fg">When you study</h2>

      <p className="mt-3 text-sm text-muted">
        {d.peakHour != null ? (
          <>You study most around <strong className="text-fg">{formatHour(d.peakHour)}</strong>.</>
        ) : (
          'Check in and out to build your study-time pattern.'
        )}
      </p>
      <BarChart
        tone="primary"
        height={72}
        className="mt-2"
        data={d.hourly.map((v, h) => ({ label: formatHour(h), value: v }))}
      />
      <div className="mt-1 flex justify-between text-[10px] text-faint">
        <span>12 AM</span>
        <span>12 PM</span>
        <span>11 PM</span>
      </div>

      <p className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
        Weekly study time · 12 weeks
      </p>
      <TrendChart points={weekly} tone="gold" height={90} ariaLabel="Weekly study minutes trend" />
    </Card>
  );
}

/* ── shared bits ── */
function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-field border border-line bg-sunken/40 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 font-display text-xl font-extrabold tabular text-fg">{value}</p>
      {sub ? <p className="truncate text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

function SubjectBar({ name, completed, total }: { name: string; completed: number; total: number }) {
  const pct = total ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="truncate font-medium text-fg">{name}</span>
        <span className="shrink-0 text-xs tabular text-muted">
          {completed}/{total}
        </span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-sunken">
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500',
            pct === 100 ? 'bg-success' : 'bg-primary',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

type Cell = { date: string; minutes: number; weekday: number };
function Heatmap({ daily }: { daily: { date: string; minutes: number }[] }) {
  const cells: Cell[] = daily.map((d) => ({
    ...d,
    weekday: new Date(`${d.date}T00:00:00`).getDay(),
  }));
  const weeks: (Cell | null)[][] = [];
  let col: (Cell | null)[] = Array.from({ length: cells[0]?.weekday ?? 0 }, () => null);
  for (const c of cells) {
    col.push(c);
    if (c.weekday === 6) {
      weeks.push(col);
      col = [];
    }
  }
  if (col.length) {
    while (col.length < 7) col.push(null);
    weeks.push(col);
  }

  return (
    <div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto pb-1">
        {weeks.map((wk, i) => (
          <div key={i} className="flex flex-col gap-1">
            {wk.map((cell, j) => (
              <span
                key={j}
                title={cell ? `${niceDate(cell.date)} · ${formatMinutes(cell.minutes)}` : undefined}
                className={cn('h-3 w-3 rounded-[3px]', cell ? tierClass(cell.minutes) : 'bg-transparent')}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-muted">
        <span>Less</span>
        <span className="h-3 w-3 rounded-[3px] bg-sunken" />
        <span className="h-3 w-3 rounded-[3px] bg-success/25" />
        <span className="h-3 w-3 rounded-[3px] bg-success/45" />
        <span className="h-3 w-3 rounded-[3px] bg-success/70" />
        <span className="h-3 w-3 rounded-[3px] bg-success" />
        <span>More</span>
      </div>
    </div>
  );
}
