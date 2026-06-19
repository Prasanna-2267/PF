import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from './auth-store';

/**
 * Shared API client. `withCredentials` carries the httpOnly refresh cookie.
 *
 * - Dev: `VITE_API_BASE_URL` is unset → requests hit `/api` (Vite proxy).
 * - Prod: set `VITE_API_BASE_URL` if the API is on a different origin.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const api = axios.create({ baseURL, withCredentials: true });

// Attach the current access token to every request.
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, try a single silent refresh (using the cookie) then replay the request.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<{ accessToken: string }>(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    useAuthStore.getState().setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

const NO_RETRY = ['/auth/refresh', '/auth/login', '/auth/verify-otp', '/auth/signup'];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = original?.url ?? '';
    const retryable = !NO_RETRY.some((p) => url.includes(p));

    if (error.response?.status === 401 && original && !original._retry && retryable) {
      original._retry = true;
      refreshing = refreshing ?? refreshAccessToken();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);
