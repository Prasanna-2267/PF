import { useAuthStore } from '@/lib/auth-store';

export function isDemoSession(accessToken = useAuthStore.getState().accessToken, userId = useAuthStore.getState().user?.id) {
  return Boolean(accessToken?.startsWith('ui-only-') || userId?.startsWith('demo-') || userId?.startsWith('student-'));
}

