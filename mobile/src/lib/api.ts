import axios, { isAxiosError, type InternalAxiosRequestConfig } from 'axios';
import { clearLocalSession, refreshSession } from '@/lib/auth-session';
import { useAuthStore } from '@/lib/auth-store';
import { API_BASE_URL } from '@/lib/env';

type RetriableRequest = InternalAxiosRequestConfig & { _authRetry?: boolean };

const isAuthenticationAttempt = (url?: string): boolean => Boolean(url && (
  url.includes('/auth/registrations') || [
    '/auth/login',
    '/auth/register',
    '/auth/google',
    '/auth/refresh',
  ].some((path) => url.endsWith(path))
));

/** Shared API client with in-memory access tokens and single-flight refresh. */
// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({ baseURL: API_BASE_URL, timeout: 15_000 });
api.interceptors.request.use((config) => { const token = useAuthStore.getState().accessToken; if (token) config.headers.Authorization = `Bearer ${token}`; return config; });

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!isAxiosError(error) || error.response?.status !== 401 || !error.config) throw error;

    const request = error.config as RetriableRequest;
    if (request._authRetry || isAuthenticationAttempt(request.url)) throw error;
    request._authRetry = true;

    try {
      const session = await refreshSession();
      request.headers.Authorization = `Bearer ${session.accessToken}`;
      return await api.request(request);
    } catch {
      await clearLocalSession();
      throw error;
    }
  },
);
