import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AppHeader, Badge, Button, Card, Progress, Spinner, Stat } from '../components/ui';
import { authApi } from '../features/auth/auth.api';
import { trackerApi } from '../features/tracker/tracker.api';
import { useAuthStore } from '../lib/auth-store';
import { formatMinutes, pressureTone } from '../lib/format';

export function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

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
            <Button variant="ghost" size="sm" onClick={() => navigate('/notes')}>
              Notes
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tracker')}>
              Tracker
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
                Admin
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={() => void logout()}>
              Log out
            </Button>
          </>
        }
      />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              {greeting()}, {user?.name?.split(' ')[0] ?? 'there'}
            </h1>
            <p className="mt-1 text-sm text-muted">Here's your study snapshot.</p>
          </div>
        </div>

        {tracker.isLoading && (
          <div className="mt-16 flex justify-center">
            <Spinner />
          </div>
        )}

        {t && (
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Session hero */}
            <Card className="p-5 lg:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Study session</p>
                  <p className="mt-1 font-display text-xl font-semibold">
                    {t.checkedIn ? 'You are checked in' : 'Ready to study?'}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {t.checkedIn ? 'Timer running — check out when you take a break.' : 'Check in to start your timer and keep your streak alive.'}
                  </p>
                </div>
                <Button
                  size="lg"
                  variant={t.checkedIn ? 'secondary' : 'primary'}
                  onClick={() => toggle.mutate()}
                  disabled={toggle.isPending}
                >
                  {toggle.isPending ? '…' : t.checkedIn ? 'Check out' : 'Check in'}
                </Button>
              </div>

              <div className="mt-5">
                <div className="mb-1 flex items-center justify-between text-xs text-muted">
                  <span>Today</span>
                  <span className="font-mono">
                    {formatMinutes(t.todayMinutes)} / {formatMinutes(t.targetMinutes)}
                  </span>
                </div>
                <Progress
                  value={t.targetMinutes ? (t.todayMinutes / t.targetMinutes) * 100 : 0}
                  tone={t.todayMinutes >= t.targetMinutes ? 'success' : 'accent'}
                />
              </div>
            </Card>

            {/* Continue studying / streak */}
            <Card className="flex flex-col justify-between p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">Continue studying</p>
                {t.lastLesson ? (
                  <p className="mt-1 line-clamp-2 font-display text-base font-semibold">{t.lastLesson.title}</p>
                ) : (
                  <p className="mt-1 text-sm text-muted">No lessons opened yet.</p>
                )}
              </div>
              {t.lastLesson ? (
                <Button className="mt-4 w-full" onClick={() => navigate(`/lesson/${t.lastLesson!.id}`)}>
                  Resume
                </Button>
              ) : (
                <Button className="mt-4 w-full" variant="secondary" onClick={() => navigate('/notes')}>
                  Browse notes
                </Button>
              )}
            </Card>

            {/* Stats */}
            <Stat
              label="Momentum"
              value={t.momentum}
              unit="/ 100"
              footer={<Progress value={t.momentum} tone={t.momentum >= 60 ? 'success' : t.momentum >= 30 ? 'accent' : 'warn'} />}
            />
            <Stat
              label="Streak"
              value={t.streak}
              unit={t.streak === 1 ? 'day' : 'days'}
              hint={t.checkedIn ? 'Active today' : 'Check in to extend'}
            />
            <Stat
              label="Syllabus"
              value={`${t.syllabus.percent}%`}
              hint={`${t.syllabus.completed}/${t.syllabus.total} lessons`}
              footer={<Progress value={t.syllabus.percent} tone="accent" />}
            />

            {/* Exam pressure */}
            <Card className="p-4 lg:col-span-3">
              {t.exam.date ? (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      {t.exam.label || 'Exam'} countdown
                    </p>
                    <p className="mt-1 font-display text-2xl font-semibold tracking-tight">
                      {t.exam.daysLeft} <span className="text-sm font-normal text-muted">days left</span>
                    </p>
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted">
                      <span>Pressure</span>
                      <Badge tone={pressureTone(t.exam.pressure)}>{pressureLabel(t.exam.pressure)}</Badge>
                    </div>
                    <Progress value={t.exam.pressure} tone={pressureTone(t.exam.pressure)} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted">Set your exam date to unlock the countdown and pressure meter.</p>
                  <Button variant="secondary" size="sm" onClick={() => navigate('/tracker')}>
                    Set exam date
                  </Button>
                </div>
              )}
            </Card>

            <Stat label="Revisions" value={t.totalRevisions} hint="lessons revised" />
          </div>
        )}
      </main>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function pressureLabel(p: number): string {
  if (p >= 70) return 'High';
  if (p >= 40) return 'Medium';
  return 'Low';
}
