import { api } from '../../lib/api';
import { useAuthStore, type AuthUser } from '../../lib/auth-store';

export type AuthResponse = { user: AuthUser; accessToken: string };

export const authApi = {
  signup: (d: { name: string; email: string; phone: string; password: string }) =>
    api.post<{ message: string }>('/auth/signup', d).then((r) => r.data),

  // Resend/verify use the httpOnly pf_signup cookie set at signup — no email needed.
  resendOtp: () => api.post<{ message: string }>('/auth/resend-otp').then((r) => r.data),

  verifyOtp: (d: { code: string }) =>
    api.post<AuthResponse>('/auth/verify-otp', d).then((r) => r.data),

  login: (d: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', d).then((r) => r.data),

  google: (credential: string) =>
    api.post<AuthResponse>('/auth/google', { credential }).then((r) => r.data),

  forgotPassword: (d: { email: string }) =>
    api.post<{ message: string }>('/auth/forgot-password', d).then((r) => r.data),

  resetPassword: (d: { email: string; code: string; newPassword: string }) =>
    api.post<{ message: string }>('/auth/reset-password', d).then((r) => r.data),

  me: () => api.get<{ user: AuthUser }>('/auth/me').then((r) => r.data.user),

  logout: () => api.post('/auth/logout').then((r) => r.data),
};

/** Silent login on app load using the refresh cookie. */
export async function bootstrapAuth(): Promise<void> {
  try {
    const { data } = await api.post<{ accessToken: string }>('/auth/refresh');
    useAuthStore.getState().setAccessToken(data.accessToken);
    const user = await authApi.me();
    useAuthStore.getState().setAuth(user, data.accessToken);
  } catch {
    useAuthStore.getState().clear();
  }
}

/** Pull a friendly message out of an axios error. */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const resp = (err as { response?: { data?: { error?: string } } }).response;
    if (resp?.data?.error) return resp.data.error;
  }
  return fallback;
}
