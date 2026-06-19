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
const JSON_HEADERS = { 'Content-Type': 'application/json' };

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

function cookie(res: Response, name: string): string | undefined {
  return res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0] ?? '')
    .find((c) => c.startsWith(`${name}=`));
}

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
    const password = 'secret123';
    const email = `smoke_${Date.now()}@example.com`;
    const body = (extra: object) => JSON.stringify({ name: 'Smoke Test', phone: '9998887777', ...extra });

    // --- Main flow (email A) ---
    let r = await fetch(`${BASE}/signup`, { method: 'POST', headers: JSON_HEADERS, body: body({ email, password }) });
    const signupCookie = cookie(r, 'pf_signup');
    check('signup -> 201', r.status === 201, `got ${r.status}`);
    check('signup sets pf_signup cookie', !!signupCookie);
    check('otp captured from mailer', /^\d{6}$/.test(lastOtp), lastOtp || '(none)');
    const otpA = lastOtp;

    // verify without the signup cookie must be rejected (session binding)
    r = await fetch(`${BASE}/verify-otp`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ code: otpA }) });
    check('verify-otp without session cookie -> 400', r.status === 400, `got ${r.status}`);

    r = await fetch(`${BASE}/verify-otp`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, Cookie: signupCookie ?? '' },
      body: JSON.stringify({ code: otpA }),
    });
    const verify = (await r.json()) as { user?: { emailVerified?: boolean }; accessToken?: string };
    check('verify-otp with session cookie -> 200', r.status === 200, `got ${r.status}`);
    check('verify returns token + emailVerified', !!verify.accessToken && verify.user?.emailVerified === true);
    const tokenA = verify.accessToken ?? '';

    r = await fetch(`${BASE}/me`, { headers: { Authorization: `Bearer ${tokenA}` } });
    check('me with token A -> 200', r.status === 200, `got ${r.status}`);

    r = await fetch(`${BASE}/login`, { method: 'POST', headers: JSON_HEADERS, body: body({ email, password }) });
    const login = (await r.json()) as { accessToken?: string };
    const refreshCookie = cookie(r, 'pf_refresh');
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

    r = await fetch(`${BASE}/login`, { method: 'POST', headers: JSON_HEADERS, body: body({ email, password: 'wrongpass' }) });
    check('wrong password -> 401', r.status === 401, `got ${r.status}`);

    r = await fetch(`${BASE}/signup`, { method: 'POST', headers: JSON_HEADERS, body: body({ email, password }) });
    check('duplicate signup (verified email) -> 409', r.status === 409, `got ${r.status}`);

    r = await fetch(`${BASE}/login`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ email: 'nope' }) });
    check('validation: bad body -> 400', r.status === 400, `got ${r.status}`);

    // Google SSO error paths (no GOOGLE_CLIENT_ID configured in test env)
    r = await fetch(`${BASE}/google`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({}) });
    check('google: missing credential -> 400', r.status === 400, `got ${r.status}`);
    r = await fetch(`${BASE}/google`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ credential: 'fake.invalid.token' }) });
    check('google: invalid/unconfigured -> 401 or 503', r.status === 401 || r.status === 503, `got ${r.status}`);

    // --- Scenario: register, DON'T verify, then log in (should guide to verify) ---
    const email2 = `smoke2_${Date.now()}@example.com`;
    r = await fetch(`${BASE}/signup`, { method: 'POST', headers: JSON_HEADERS, body: body({ email: email2, password }) });
    check('scenario2 signup -> 201', r.status === 201, `got ${r.status}`);

    r = await fetch(`${BASE}/login`, { method: 'POST', headers: JSON_HEADERS, body: body({ email: email2, password }) });
    const rebindCookie = cookie(r, 'pf_signup');
    check('login before verify -> 403', r.status === 403, `got ${r.status}`);
    check('login before verify rebinds pf_signup cookie', !!rebindCookie);
    const otp2 = lastOtp;

    r = await fetch(`${BASE}/verify-otp`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, Cookie: rebindCookie ?? '' },
      body: JSON.stringify({ code: otp2 }),
    });
    check('verify after login-rebind -> 200', r.status === 200, `got ${r.status}`);

    // --- Password reset (email A) ---
    r = await fetch(`${BASE}/forgot-password`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ email }) });
    check('forgot-password -> 200', r.status === 200, `got ${r.status}`);
    const resetCode = lastOtp;
    check('reset code captured', /^\d{6}$/.test(resetCode), resetCode || '(none)');

    r = await fetch(`${BASE}/reset-password`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, code: '000000', newPassword: 'newsecret123' }),
    });
    check('reset-password wrong code -> 400', r.status === 400, `got ${r.status}`);

    r = await fetch(`${BASE}/reset-password`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, code: resetCode, newPassword: 'newsecret123' }),
    });
    check('reset-password valid -> 200', r.status === 200, `got ${r.status}`);

    r = await fetch(`${BASE}/login`, { method: 'POST', headers: JSON_HEADERS, body: body({ email, password }) });
    check('login with old password -> 401', r.status === 401, `got ${r.status}`);
    r = await fetch(`${BASE}/login`, { method: 'POST', headers: JSON_HEADERS, body: body({ email, password: 'newsecret123' }) });
    check('login with new password -> 200', r.status === 200, `got ${r.status}`);

    r = await fetch(`${BASE}/forgot-password`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ email: 'nobody@example.com' }) });
    check('forgot-password unknown email -> 200 (no reveal)', r.status === 200, `got ${r.status}`);
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
