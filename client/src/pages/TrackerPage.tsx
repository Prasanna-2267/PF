import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, AppHeader, Badge, Button, Card, Input, Progress, Select, Spinner, Stat } from '../components/ui';
import { authApi } from '../features/auth/auth.api';
import { contentApi } from '../features/content/content.api';
import { trackerApi, type Tracker, type TrackerSettings } from '../features/tracker/tracker.api';
import { useAuthStore } from '../lib/auth-store';
import { formatMinutes, pressureTone } from '../lib/format';

export function TrackerPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const clear = useAuthStore((s) => s.clear);

  const tracker = useQuery({ queryKey: ['tracker'], queryFn: trackerApi.get });
  const t = tracker.data;

  const toggle = useMutation({
    mutationFn: () => (t?.checkedIn ? trackerApi.checkout() : trackerApi.checkin()),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tracker'] }),
  });

  async function logout() {
    try {
      if (t?.checkedIn) await trackerApi.checkout().catch(() => {});
      await authApi.logout();
    } finally {
      clear();
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <AppHeader
        right={
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              Home
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/notes')}>
              Notes
            </Button>
            <Button variant="secondary" size="sm" onClick={() => void logout()}>
              Log out
            </Button>
          </>
        }
      />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Tracker</h1>
        <p className="mt-1 text-sm text-muted">Your study rhythm and exam plan.</p>

        {tracker.isLoading && (
          <div className="mt-16 flex justify-center">
            <Spinner />
          </div>
        )}

        {t && (
          <div className="mt-6 space-y-4">
            {/* Session */}
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-[220px] flex-1">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted">
                    <span>Today's study time</span>
                    <span className="font-mono">
                      {formatMinutes(t.todayMinutes)} / {formatMinutes(t.targetMinutes)}
                    </span>
                  </div>
                  <Progress
                    value={t.targetMinutes ? (t.todayMinutes / t.targetMinutes) * 100 : 0}
                    tone={t.todayMinutes >= t.targetMinutes ? 'success' : 'accent'}
                  />
                </div>
                <Button
                  variant={t.checkedIn ? 'secondary' : 'primary'}
                  onClick={() => toggle.mutate()}
                  disabled={toggle.isPending}
                >
                  {toggle.isPending ? '…' : t.checkedIn ? 'Check out' : 'Check in'}
                </Button>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Stat label="Streak" value={t.streak} unit={t.streak === 1 ? 'day' : 'days'} />
              <Stat
                label="Momentum"
                value={t.momentum}
                unit="/ 100"
                footer={<Progress value={t.momentum} tone={t.momentum >= 60 ? 'success' : t.momentum >= 30 ? 'accent' : 'warn'} />}
              />
              <Stat
                label="Syllabus"
                value={`${t.syllabus.percent}%`}
                hint={`${t.syllabus.completed}/${t.syllabus.total} lessons`}
                footer={<Progress value={t.syllabus.percent} />}
              />
              <Stat label="Revisions" value={t.totalRevisions} hint="lessons revised" />
            </div>

            {/* Exam */}
            {t.exam.date && (
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {t.exam.label || 'Exam'} countdown
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold tracking-tight">
                      {t.exam.daysLeft} <span className="text-sm font-normal text-muted">days left</span>
                    </p>
                  </div>
                  <div className="min-w-[220px] flex-1">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted">
                      <span>Pressure</span>
                      <Badge tone={pressureTone(t.exam.pressure)}>{t.exam.pressure} / 100</Badge>
                    </div>
                    <Progress value={t.exam.pressure} tone={pressureTone(t.exam.pressure)} />
                  </div>
                </div>
              </Card>
            )}

            <SettingsForm t={t} onSaved={() => void qc.invalidateQueries({ queryKey: ['tracker'] })} />
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * Mounted only after the tracker loads, so state is lazily seeded from the
 * loaded values once — no setState-in-effect, and user edits survive refetches.
 */
function SettingsForm({ t, onSaved }: { t: Tracker; onSaved: () => void }) {
  const [examDate, setExamDate] = useState(t.exam.date ? t.exam.date.slice(0, 10) : '');
  const [examLabel, setExamLabel] = useState(t.exam.label ?? '');
  const [target, setTarget] = useState(String(t.targetMinutes));
  const [catId, setCatId] = useState('');
  const [stageId, setStageId] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const categories = useQuery({ queryKey: ['pub', 'categories'], queryFn: contentApi.categories });
  const stages = useQuery({ queryKey: ['pub', 'stages', catId], queryFn: () => contentApi.stages(catId), enabled: !!catId });

  const save = useMutation({
    mutationFn: (d: TrackerSettings) => trackerApi.settings(d),
    onSuccess: () => {
      setError('');
      setSaved(true);
      onSaved();
    },
    onError: () => setError('Could not save settings. Check the values and try again.'),
  });

  function onSave() {
    setSaved(false);
    const minutes = Number(target);
    if (!Number.isFinite(minutes) || minutes < 5 || minutes > 1440) {
      setError('Daily target must be between 5 and 1440 minutes.');
      return;
    }
    save.mutate({
      examDate: examDate ? new Date(examDate).toISOString() : null,
      examLabel: examLabel.trim() || null,
      dailyTargetMinutes: minutes,
      // Only override the active stage when a new one is picked; otherwise keep it.
      activeStageId: stageId || t.activeStageId || null,
    });
  }

  return (
    <Card className="p-5">
      <h2 className="font-display text-base font-semibold">Settings</h2>
      <p className="mt-0.5 text-sm text-muted">Set your exam, daily goal, and the stage you're tracking.</p>

      <Alert>{error}</Alert>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Exam date">
          <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
        </Field>
        <Field label="Exam label">
          <Input
            placeholder="e.g. CA Inter May 2026"
            value={examLabel}
            onChange={(e) => setExamLabel(e.target.value)}
          />
        </Field>
        <Field label="Daily target (minutes)">
          <Input type="number" min={5} max={1440} value={target} onChange={(e) => setTarget(e.target.value)} />
        </Field>
        <Field label="Active stage (for syllabus %)">
          <div className="flex gap-2">
            <Select
              value={catId}
              onChange={(e) => {
                setCatId(e.target.value);
                setStageId('');
              }}
              className="w-1/2"
            >
              <option value="">Exam</option>
              {categories.data?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select value={stageId} onChange={(e) => setStageId(e.target.value)} disabled={!catId} className="w-1/2">
              <option value="">Stage</option>
              {stages.data?.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <p className="mt-1 text-xs text-muted">
            {t.activeStageId ? 'A stage is currently being tracked.' : 'No stage selected yet.'}
          </p>
        </Field>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={onSave} disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save settings'}
        </Button>
        {saved && <span className="text-sm text-success">Saved</span>}
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </div>
  );
}
