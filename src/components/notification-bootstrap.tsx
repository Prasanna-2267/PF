import { useEffect } from 'react';
import { initialiseNotifications } from '@/lib/notification-bootstrap';
import { useAuthStore } from '@/lib/auth-store';

export function NotificationBootstrap() {
  const status = useAuthStore((state) => state.status);
  const accessToken = useAuthStore((state) => state.accessToken);
  useEffect(() => {
    if (status !== 'authenticated' || !accessToken) return;
    let dispose: undefined | (() => void); let cancelled = false;
    void initialiseNotifications().then((cleanup) => { if (cancelled) cleanup(); else dispose = cleanup; }).catch(() => undefined);
    return () => { cancelled = true; dispose?.(); };
  }, [accessToken, status]);
  return null;
}
