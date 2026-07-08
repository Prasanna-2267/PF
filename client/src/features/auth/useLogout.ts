import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth-store';
import { disconnectSocket } from '../../lib/socket';
import { authApi } from './auth.api';
import { trackerApi } from '../tracker/tracker.api';

/** Log out: auto check-out any active study session, end the server session, disconnect realtime, clear + redirect. */
export function useLogout(): () => Promise<void> {
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);
  return useCallback(async () => {
    try {
      await trackerApi.checkout();
    } catch {
      /* not checked in — ignore */
    }
    try {
      await authApi.logout();
    } catch {
      /* ignore network/session errors on logout */
    }
    disconnectSocket();
    clear();
    navigate('/login', { replace: true });
  }, [clear, navigate]);
}
