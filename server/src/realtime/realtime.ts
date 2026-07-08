import type { Server } from 'socket.io';
import { logger } from '../lib/logger.js';
import { verifyAccessToken } from '../modules/auth/auth.tokens.js';

let io: Server | null = null;

/**
 * Attach auth + room handling to the Socket.io server. Each socket presents its
 * access token; we record its userId + deviceId and join a per-user room so we
 * can push an instant logout to other devices on a new login.
 */
export function bindRealtime(server: Server): void {
  io = server;
  server.on('connection', (socket) => {
    const token = (socket.handshake.auth as { token?: string } | undefined)?.token;
    if (!token) {
      socket.disconnect();
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      socket.data.deviceId = payload.deviceId;
      void socket.join(`user:${payload.sub}`);
    } catch {
      socket.disconnect();
    }
  });
}

/** Instantly log out the user's other devices after a new login. */
export async function kickOtherDevices(userId: string, keepDeviceId: string): Promise<void> {
  if (!io) return;
  try {
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    for (const s of sockets) {
      const deviceId = (s.data as { deviceId?: string }).deviceId;
      if (deviceId && deviceId !== keepDeviceId) s.emit('force-logout');
    }
  } catch (err) {
    logger.warn({ err: String(err) }, 'kickOtherDevices failed');
  }
}

/** Instantly log out ALL of a user's devices (admin force-logout / deactivate). */
export async function kickAllDevices(userId: string): Promise<void> {
  if (!io) return;
  try {
    const sockets = await io.in(`user:${userId}`).fetchSockets();
    for (const s of sockets) s.emit('force-logout');
  } catch (err) {
    logger.warn({ err: String(err) }, 'kickAllDevices failed');
  }
}
