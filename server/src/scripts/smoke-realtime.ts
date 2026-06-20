/**
 * Realtime single-device test: logging in on a second device must instantly
 * push `force-logout` to the first device's socket.
 *
 *   npm run test:smoke:realtime
 */
import dns from 'node:dns';
import { createServer } from 'node:http';
import mongoose from 'mongoose';
import { Server as SocketServer } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { bindRealtime } from '../realtime/realtime.js';
import { hashPassword } from '../modules/auth/auth.password.js';
import { UserModel } from '../modules/auth/user.model.js';

const PORT = 4104;
const ROOT = `http://localhost:${PORT}/api`;
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let failures = 0;
function check(name: string, passed: boolean, detail = ''): void {
  if (!passed) failures++;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function login(email: string, password: string): Promise<string> {
  const r = await fetch(`${ROOT}/auth/login`, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ email, password }),
  });
  return ((await r.json()) as { accessToken?: string }).accessToken ?? '';
}

async function main(): Promise<void> {
  if (env.DNS_SERVERS) {
    dns.setServers(env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
  }
  await mongoose.connect(env.MONGODB_URI, { dbName: 'parallax_flow_test' });
  await mongoose.connection.dropDatabase();

  const email = `rt_${Date.now()}@x.com`;
  const pw = 'password123';
  await UserModel.create({ name: 'RT', email, passwordHash: await hashPassword(pw), role: 'student', emailVerified: true });

  const app = createApp();
  const httpServer = createServer(app);
  const sio = new SocketServer(httpServer, { cors: { origin: '*' } });
  bindRealtime(sio);
  await new Promise<void>((resolve) => httpServer.listen(PORT, () => resolve()));

  const sockA = ioClient(`http://localhost:${PORT}`, { transports: ['websocket'] });
  try {
    const tokenA = await login(email, pw);
    sockA.auth = { token: tokenA };
    sockA.connect();
    await new Promise<void>((resolve, reject) => {
      sockA.on('connect', () => resolve());
      sockA.on('connect_error', (e) => reject(e));
      setTimeout(() => reject(new Error('connect timeout')), 4000);
    });
    check('device A socket connected', sockA.connected);

    const forced = new Promise<boolean>((resolve) => {
      sockA.on('force-logout', () => resolve(true));
      setTimeout(() => resolve(false), 4000);
    });

    const tokenB = await login(email, pw); // second device
    check('second login succeeds', !!tokenB);
    check('device A received force-logout instantly', await forced);
  } finally {
    sockA.disconnect();
    sio.close();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }

  console.log(failures === 0 ? '\n✅ Realtime smoke test passed' : `\n❌ ${failures} test(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
