import { useNavigate } from 'react-router-dom';
import { AppHeader, Button, Card } from '../components/ui';
import { authApi } from '../features/auth/auth.api';
import { useAuthStore } from '../lib/auth-store';

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  async function logout() {
    try {
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
          <Button variant="secondary" size="sm" onClick={logout}>
            Log out
          </Button>
        }
      />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome, {user?.name}</h1>
        <p className="mt-1 text-sm text-muted">Pick up where you left off.</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => navigate('/notes')}>Open Notes</Button>
          {isAdmin && (
            <Button variant="secondary" onClick={() => navigate('/admin')}>
              Admin panel
            </Button>
          )}
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-3">
          <Info label="Email" value={user?.email ?? '—'} />
          <Info label="Phone" value={user?.phone ?? '—'} />
          <Info label="Role" value={user?.role ?? '—'} />
          <Info label="Email verified" value={user?.emailVerified ? 'Yes' : 'No'} />
        </dl>
      </main>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </Card>
  );
}
