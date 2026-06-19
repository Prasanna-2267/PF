import { Outlet, useNavigate } from 'react-router-dom';
import { authApi } from '../../features/auth/auth.api';
import { useAuthStore } from '../../lib/auth-store';

export function AdminLayout() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      clear();
      navigate('/admin/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <div className="flex items-baseline gap-2">
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-lg font-semibold text-transparent">
            Parallax Flow
          </span>
          <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">Admin</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-400">{user?.email}</span>
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
