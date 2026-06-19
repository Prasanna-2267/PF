import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'node:crypto';
import { authConfig } from '../../config/auth.js';

export type AccessPayload = { sub: string; role: string; deviceId: string };
export type RefreshPayload = { sub: string; deviceId: string };

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, authConfig.accessSecret, { expiresIn: authConfig.accessTtlSec });
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, authConfig.accessSecret) as AccessPayload;
}

export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, authConfig.refreshSecret, { expiresIn: authConfig.refreshTtlSec });
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, authConfig.refreshSecret) as RefreshPayload;
}

export function newDeviceId(): string {
  return randomUUID();
}

/** Store only a hash of refresh tokens, never the raw token. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
