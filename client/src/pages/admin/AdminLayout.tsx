import { Outlet, useNavigate } from 'react-router-dom';
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
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  );
}
