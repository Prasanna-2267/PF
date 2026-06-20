import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AppHeader, Button } from '../../components/ui';
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
    <div className="min-h-screen bg-canvas text-ink">
      <AppHeader
        sub="Admin"
        right={
          <>
            <span className="hidden text-sm text-muted sm:inline">{user?.email}</span>
            <Button variant="secondary" size="sm" onClick={logout}>
              Log out
            </Button>
          </>
        }
      />
      <nav className="flex gap-1 border-b border-line bg-surface px-6 py-2 text-sm">
        <AdminNav to="/admin" label="Content" end />
        <AdminNav to="/admin/packages" label="Packages" />
        <AdminNav to="/admin/coupons" label="Coupons" />
      </nav>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}

function AdminNav({ to, label, end }: { to: string; label: string; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `rounded-md px-3 py-1.5 ${isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink'}`
      }
    >
      {label}
    </NavLink>
  );
}
