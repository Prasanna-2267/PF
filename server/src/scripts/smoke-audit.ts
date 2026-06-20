/**
 * Admin audit-log smoke test (Phase 7). Proves admin mutations are recorded,
 * failed writes and reads are NOT recorded, RBAC protects the viewer, and the
 * actor identity + resource filter work.
 *
 *   npm run test:smoke:audit
 */
import dns from 'node:dns';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { hashPassword } from '../modules/auth/auth.password.js';
import { UserModel } from '../modules/auth/user.model.js';

const PORT = 4108;
const ROOT = `http://localhost:${PORT}/api`;
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let failures = 0;
function check(name: string, passed: boolean, detail = ''): void {
  if (!passed) failures++;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function login(email: string, password: string): Promise<string> {
  const r = await fetch(`${ROOT}/auth/login`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ email, password }) });
  return ((await r.json()) as { accessToken?: string }).accessToken ?? '';
}

type AuditEntry = { actor: { email?: string } | null; method: string; resource: string; statusCode: number; resourceId: string | null };

async function main(): Promise<void> {
  if (env.DNS_SERVERS) dns.setServers(env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
  await mongoose.connect(env.MONGODB_URI, { dbName: 'parallax_flow_test' });
  await mongoose.connection.dropDatabase();

  const pw = 'password123';
  const adminEmail = `admin_${Date.now()}@x.com`;
  const studentEmail = `stud_${Date.now()}@x.com`;
  await UserModel.create({ name: 'Admin', email: adminEmail, passwordHash: await hashPassword(pw), role: 'admin', emailVerified: true });
  await UserModel.create({ name: 'Stud', email: studentEmail, passwordHash: await hashPassword(pw), role: 'student', emailVerified: true });

  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });

  try {
    const adminToken = await login(adminEmail, pw);
    const studentToken = await login(studentEmail, pw);
    const aHdr = { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` };
    const sHdr = { ...JSON_HEADERS, Authorization: `Bearer ${studentToken}` };
    check('admin + student login', !!adminToken && !!studentToken);

    // RBAC on the viewer
    let r = await fetch(`${ROOT}/admin/audit`, { headers: sHdr });
    check('student GET /admin/audit -> 403', r.status === 403, `got ${r.status}`);

    // Two successful admin mutations
    r = await fetch(`${ROOT}/admin/content/categories`, { method: 'POST', headers: aHdr, body: JSON.stringify({ name: 'CA', slug: `ca-${Date.now()}` }) });
    const catId = ((await r.json()) as { category?: { _id?: string } }).category?._id ?? '';
    check('admin create category -> 201', r.status === 201, `got ${r.status}`);
    r = await fetch(`${ROOT}/admin/content/stages`, { method: 'POST', headers: aHdr, body: JSON.stringify({ name: 'Inter', examCategoryId: catId }) });
    check('admin create stage -> 201', r.status === 201, `got ${r.status}`);

    // A failed mutation (should NOT be audited)
    r = await fetch(`${ROOT}/admin/content/categories`, { method: 'POST', headers: aHdr, body: JSON.stringify({ name: 'X', slug: 'Bad Slug!' }) });
    check('invalid create -> 400', r.status === 400, `got ${r.status}`);

    // A read (should NOT be audited)
    await fetch(`${ROOT}/admin/content/categories`, { headers: aHdr });

    // Audit writes are fire-and-forget on response finish — poll briefly.
    let entries: AuditEntry[] = [];
    for (let i = 0; i < 20; i++) {
      const res = await fetch(`${ROOT}/admin/audit`, { headers: aHdr });
      entries = ((await res.json()) as { logs?: AuditEntry[] }).logs ?? [];
      if (entries.length >= 2) break;
      await sleep(100);
    }

    check('audit recorded 2 successful mutations', entries.length === 2, `got ${entries.length}`);
    check('no failed (4xx) writes recorded', entries.every((e) => e.statusCode < 400));
    check('no GET reads recorded', entries.every((e) => e.method !== 'GET'));
    check('entry carries actor email', entries.every((e) => e.actor?.email === adminEmail));
    check('entries are content mutations', entries.every((e) => e.resource === 'content' && e.method === 'POST'));

    // Resource filter
    r = await fetch(`${ROOT}/admin/audit?resource=lessons`, { headers: aHdr });
    check('filter resource=lessons -> 0', ((await r.json()) as { logs?: unknown[] }).logs?.length === 0);
    r = await fetch(`${ROOT}/admin/audit?resource=content`, { headers: aHdr });
    check('filter resource=content -> 2', ((await r.json()) as { logs?: unknown[] }).logs?.length === 2);
  } finally {
    await mongoose.connection.dropDatabase();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }

  console.log(failures === 0 ? '\n✅ All audit smoke tests passed' : `\n❌ ${failures} test(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
