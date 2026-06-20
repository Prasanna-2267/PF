import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Connect to the realtime channel (same origin; dev proxies /socket.io). The
 * server pushes `force-logout` to this device when the account logs in
 * elsewhere (single-device enforcement).
 */
export function connectSocket(token: string, onForceLogout: () => void): void {
  disconnectSocket();
  socket = io({ auth: { token } });
  socket.on('force-logout', onForceLogout);
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
