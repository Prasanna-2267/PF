import axios from 'axios';

/**
 * Shared API client. Requests go to `/api/*` and are proxied to the Express
 * server in dev (see vite.config.ts). `withCredentials` carries the refresh
 * cookie for auth from Phase 1 onward.
 */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});
