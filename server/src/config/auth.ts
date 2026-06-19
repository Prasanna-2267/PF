import { env, isProd } from './env.js';
import { logger } from '../lib/logger.js';

/**
 * Resolve a JWT secret. In production a strong secret is required; in dev we
 * fall back to a stable (insecure) value so the app runs without setup.
 */
function resolveSecret(value: string | undefined, name: string): string {
  if (value && value.length >= 16) return value;
  if (isProd) {
    throw new Error(`${name} must be set (min 16 chars) in production. See server/.env.example.`);
  }
  logger.warn(`${name} is not set — using an insecure, dev-only secret. Set it in .env before deploying.`);
  return `dev-insecure-secret-${name}`;
}

export const authConfig = {
  accessSecret: resolveSecret(env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET'),
  refreshSecret: resolveSecret(env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET'),
  accessTtlSec: 15 * 60, // 15 minutes
  refreshTtlSec: 7 * 24 * 60 * 60, // 7 days
  otpTtlMinutes: 10,
  otpMaxAttempts: 5,
  refreshCookieName: 'pf_refresh',
  cookie: {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/api/auth',
  },
};
