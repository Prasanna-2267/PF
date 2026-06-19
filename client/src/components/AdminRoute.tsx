import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../lib/auth-store';
import { Spinner } from './ui';

/** Requires an authenticated admin/superadmin. */
export function AdminRoute() {
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.user?.role);

  if (status === 'loading') return <Spinner />;
  if (status === 'unauthenticated') return <Navigate to="/admin/login" replace />;
  if (role !== 'admin' && role !== 'superadmin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
