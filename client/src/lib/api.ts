import axios from 'axios';

/**
 * Shared API client. `withCredentials` carries the refresh cookie for auth
 * (Phase 1+).
 *
 * - Dev: `VITE_API_BASE_URL` is unset → requests go to `/api` and are proxied
 *   to the Express server (see vite.config.ts).
 * - Prod: set `VITE_API_BASE_URL` at build time if the API is on a different
 *   origin; leave it as `/api` when served same-origin behind a reverse proxy.
 */
const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});
