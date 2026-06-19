/**
 * Auth integration smoke test — drives the real Express app over HTTP against
 * an isolated test database (parallax_flow_test). No browser required.
 *
 *   npm run test:smoke
 */
import dns from 'node:dns';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { setMailer } from '../services/mail.js';

const PORT = 4100;
const BASE = `http://localhost:${PORT}/api/auth`;

// Capture the OTP that the app "sends" instead of emailing it.
let lastOtp = '';
setMailer({
  async send({ text, html }) {
    const match = (text ?? html ?? '').match(/\b(\d{6})\b/);
    if (match) lastOtp = match[1] ?? '';
  },
});

let failures = 0;
function check(name: string, passed: boolean, detail = ''): void {
  if (!passed) failures++;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

const json = { 'Content-Type': 'application/json' };

async function main(): Promise<void> {
  if (env.DNS_SERVERS) {
    dns.setServers(
      env.DNS_SERVERS.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }
  await mongoose.connect(env.MONGODB_URI, { dbName: 'parallax_flow_test' });
  await mongoose.connection.dropDatabase();

  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });

  try {
    const email = `smoke_${Date.now()}@example.com`;
    const password = 'secret123';
    const signupBody = JSON.stringify({ name: 'Smoke Test', email, phone: '9998887777', password });

    let r = await fetch(`${BASE}/signup`, { method: 'POST', headers: json, body: signupBody });
    check('signup -> 201', r.status === 201, `got ${r.status}`);
    check('otp captured from mailer', /^\d{6}$/.test(lastOtp), lastOtp || '(none)');

    r = await fetch(`${BASE}/verify-otp`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ email, code: lastOtp }),
    });
    const verify = (await r.json()) as { user?: { emailVerified?: boolean }; accessToken?: string };
    check('verify-otp -> 200', r.status === 200, `got ${r.status}`);
    check('verify returns token + emailVerified', !!verify.accessToken && verify.user?.emailVerified === true);
    const tokenA = verify.accessToken ?? '';

    r = await fetch(`${BASE}/me`, { headers: { Authorization: `Bearer ${tokenA}` } });
    check('me with token A -> 200', r.status === 200, `got ${r.status}`);

    r = await fetch(`${BASE}/login`, { method: 'POST', headers: json, body: JSON.stringify({ email, password }) });
    const login = (await r.json()) as { accessToken?: string };
    const refreshCookie = r.headers
      .getSetCookie()
      .map((c) => c.split(';')[0] ?? '')
      .find((c) => c.startsWith('pf_refresh='));
    check('login -> 200', r.status === 200, `got ${r.status}`);
    check('login sets refresh cookie', !!refreshCookie);
    const tokenB = login.accessToken ?? '';

    r = await fetch(`${BASE}/me`, { headers: { Authorization: `Bearer ${tokenA}` } });
    check('single-device: old token A -> 401', r.status === 401, `got ${r.status}`);
    r = await fetch(`${BASE}/me`, { headers: { Authorization: `Bearer ${tokenB}` } });
    check('new token B -> 200', r.status === 200, `got ${r.status}`);

    r = await fetch(`${BASE}/refresh`, { method: 'POST', headers: { Cookie: refreshCookie ?? '' } });
    const refreshed = (await r.json()) as { accessToken?: string };
    check('refresh -> 200 with new token', r.status === 200 && !!refreshed.accessToken, `got ${r.status}`);

    r = await fetch(`${BASE}/logout`, { method: 'POST', headers: { Authorization: `Bearer ${tokenB}` } });
    check('logout -> 200', r.status === 200, `got ${r.status}`);

    r = await fetch(`${BASE}/me`, { headers: { Authorization: `Bearer ${tokenB}` } });
    check('me after logout -> 401', r.status === 401, `got ${r.status}`);

    r = await fetch(`${BASE}/login`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ email, password: 'wrongpass' }),
    });
    check('wrong password -> 401', r.status === 401, `got ${r.status}`);

    r = await fetch(`${BASE}/signup`, { method: 'POST', headers: json, body: signupBody });
    check('duplicate signup (verified) -> 409', r.status === 409, `got ${r.status}`);

    r = await fetch(`${BASE}/login`, { method: 'POST', headers: json, body: JSON.stringify({ email: 'nope' }) });
    check('validation: bad body -> 400', r.status === 400, `got ${r.status}`);
  } finally {
    await mongoose.connection.dropDatabase();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }

  console.log(failures === 0 ? '\n✅ All auth smoke tests passed' : `\n❌ ${failures} test(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
