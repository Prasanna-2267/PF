import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../lib/auth-store';
import { FullPageLoader } from './ui';

/** Requires any authenticated user. */
export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  return <Outlet />;
}
