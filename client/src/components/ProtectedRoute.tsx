import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../lib/auth-store';
import { Spinner } from './ui';

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  if (status === 'loading') return <Spinner />;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  return <Outlet />;
}
