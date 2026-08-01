import axios from 'axios';
import { useAuthStore } from '@/lib/auth-store';
import { API_BASE_URL } from '@/lib/env';

/** Shared API client. Authenticated requests carry the in-memory Bearer token. */
// eslint-disable-next-line import/no-named-as-default-member
export const api = axios.create({ baseURL: API_BASE_URL, timeout: 15_000 });
api.interceptors.request.use((config) => { const token = useAuthStore.getState().accessToken; if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
