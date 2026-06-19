import { useNavigate } from 'react-router-dom';
import { authApi } from '../features/auth/auth.api';
import { useAuthStore } from '../lib/auth-store';

export function DashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clear();
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <p className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-xl font-semibold text-transparent">
            Parallax Flow
          </p>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800"
          >
            Log out
          </button>
        </div>

        <h1 className="mt-10 text-2xl font-medium">Welcome, {user?.name} 👋</h1>
        <p className="mt-1 text-slate-400">
          You're signed in. The student experience (notes, tracker, store…) is built in later phases.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-4 text-sm">
          <Info label="Email" value={user?.email ?? '—'} />
          <Info label="Phone" value={user?.phone ?? '—'} />
          <Info label="Role" value={user?.role ?? '—'} />
          <Info label="Email verified" value={user?.emailVerified ? 'Yes' : 'No'} />
        </dl>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
