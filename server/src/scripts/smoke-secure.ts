/**
 * Secure PDF pipeline integration test (Phase 3b): phone-gate, watermarked
 * page-image streaming, paid/ISM gating, access logging.
 *
 *   npm run test:smoke:secure
 */
import { createDecipheriv } from 'node:crypto';
import dns from 'node:dns';
import { rm } from 'node:fs/promises';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { PDFDocument } from 'pdf-lib';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { hashPassword } from '../modules/auth/auth.password.js';
import { UserModel } from '../modules/auth/user.model.js';
import { ExamCategoryModel } from '../modules/content/exam-category.model.js';
import { StageModel } from '../modules/content/stage.model.js';
import { SubjectModel } from '../modules/content/subject.model.js';
import { AccessLogModel } from '../modules/lessons/access-log.model.js';

const PORT = 4103;
const ROOT = `http://localhost:${PORT}/api`;
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const PNG_SIG = '89504e470d0a1a0a';

let failures = 0;
function check(name: string, passed: boolean, detail = ''): void {
  if (!passed) failures++;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function loginToken(email: string, password: string): Promise<string> {
  const r = await fetch(`${ROOT}/auth/login`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ email, password }) });
  return ((await r.json()) as { accessToken?: string }).accessToken ?? '';
}

async function main(): Promise<void> {
  if (env.DNS_SERVERS) dns.setServers(env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
  await mongoose.connect(env.MONGODB_URI, { dbName: 'parallax_flow_test' });
  await mongoose.connection.dropDatabase();

  const pw = 'password123';
  await UserModel.create({ name: 'Admin', email: `a_${Date.now()}@x.com`, passwordHash: await hashPassword(pw), role: 'admin', emailVerified: true });
  await UserModel.create({ name: 'Stud', email: `s_${Date.now()}@x.com`, passwordHash: await hashPassword(pw), role: 'student', emailVerified: true });
  const adminEmail = (await UserModel.findOne({ role: 'admin' }))!.email;
  const studentEmail = (await UserModel.findOne({ role: 'student' }))!.email;

  const cat = await ExamCategoryModel.create({ name: 'CA', slug: `ca-${Date.now()}` });
  const stage = await StageModel.create({ name: 'Inter', examCategoryId: cat._id });
  const subject = await SubjectModel.create({ name: 'Taxation', stageId: stage._id });
  const subjectId = String(subject._id);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([300, 400]);
  pdfDoc.addPage([300, 400]);
  const pdfBytes = await pdfDoc.save();
  const form = (isFree: boolean) => {
    const fd = new FormData();
    fd.append('title', isFree ? 'Free notes' : 'Paid notes');
    fd.append('subjectId', subjectId);
    if (isFree) fd.append('isFree', 'true');
    fd.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'n.pdf');
    return fd;
  };

  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });

  try {
    const adminToken = await loginToken(adminEmail, pw);
    const studentToken = await loginToken(studentEmail, pw);
    const adminHdr = { Authorization: `Bearer ${adminToken}` };
    const studHdr = { Authorization: `Bearer ${studentToken}` };

    const freeId = ((await (await fetch(`${ROOT}/admin/lessons/pdf`, { method: 'POST', headers: adminHdr, body: form(true) })).json()) as { lesson?: { id?: string } }).lesson?.id ?? '';
    const paidId = ((await (await fetch(`${ROOT}/admin/lessons/pdf`, { method: 'POST', headers: adminHdr, body: form(false) })).json()) as { lesson?: { id?: string } }).lesson?.id ?? '';
    const ismId = ((await (await fetch(`${ROOT}/admin/lessons/ism`, { method: 'POST', headers: { ...JSON_HEADERS, ...adminHdr }, body: JSON.stringify({ title: 'gov', subjectId, externalUrl: 'https://icai.org' }) })).json()) as { lesson?: { id?: string } }).lesson?.id ?? '';
    check('uploaded free + paid + ism lessons', !!freeId && !!paidId && !!ismId);

    // Phone gate (student has no phone yet)
    let r = await fetch(`${ROOT}/lessons/${freeId}/view`, { headers: studHdr });
    const gate = (await r.json()) as { details?: { code?: string } };
    check('view without phone -> 403 PHONE_REQUIRED', r.status === 403 && gate.details?.code === 'PHONE_REQUIRED', `got ${r.status}`);

    r = await fetch(`${ROOT}/auth/phone`, { method: 'PATCH', headers: { ...JSON_HEADERS, ...studHdr }, body: JSON.stringify({ phone: '9998887777' }) });
    check('set phone -> 200', r.status === 200, `got ${r.status}`);

    // View now works and issues a per-view key
    r = await fetch(`${ROOT}/lessons/${freeId}/view`, { headers: studHdr });
    const view = (await r.json()) as { pageCount?: number; key?: string };
    const viewKey = view.key ? Buffer.from(view.key, 'base64') : Buffer.alloc(0);
    check('view free lesson -> 200, pageCount 2, key issued', r.status === 200 && view.pageCount === 2 && !!view.key, `got ${r.status} pages=${view.pageCount}`);

    // Page comes back ENCRYPTED — not a downloadable image in the Network tab
    r = await fetch(`${ROOT}/lessons/${freeId}/pages/1`, { headers: studHdr });
    const ct = r.headers.get('content-type') ?? '';
    const cipher = Buffer.from(await r.arrayBuffer());
    check('page 1 -> 200 octet-stream (not an image)', r.status === 200 && ct.includes('application/octet-stream'), `got ${r.status} ${ct}`);
    check(
      'wire bytes are NOT a PNG/PDF (ciphertext)',
      cipher.subarray(0, 8).toString('hex') !== PNG_SIG && !cipher.subarray(0, 5).toString('latin1').startsWith('%PDF'),
    );

    // Decrypt with the per-view key → a valid, heavily watermarked PNG
    const iv = cipher.subarray(0, 12);
    const tag = cipher.subarray(cipher.length - 16);
    const ctBody = cipher.subarray(12, cipher.length - 16);
    const decipher = createDecipheriv('aes-256-gcm', viewKey, iv);
    decipher.setAuthTag(tag);
    const png = Buffer.concat([decipher.update(ctBody), decipher.final()]);
    check('decrypts to a valid watermarked PNG', png.subarray(0, 8).toString('hex') === PNG_SIG && png.length > 1000, `${png.length} bytes`);

    // Out-of-range + invalid page
    r = await fetch(`${ROOT}/lessons/${freeId}/pages/99`, { headers: studHdr });
    check('page 99 -> 404', r.status === 404, `got ${r.status}`);
    r = await fetch(`${ROOT}/lessons/${freeId}/pages/0`, { headers: studHdr });
    check('page 0 -> 400', r.status === 400, `got ${r.status}`);

    // Paid lesson blocked for student; ISM not a secured PDF
    r = await fetch(`${ROOT}/lessons/${paidId}/view`, { headers: studHdr });
    check('paid lesson view -> 402', r.status === 402, `got ${r.status}`);
    r = await fetch(`${ROOT}/lessons/${ismId}/view`, { headers: studHdr });
    check('ISM lesson view -> 400 (not a secured PDF)', r.status === 400, `got ${r.status}`);

    // Admin can view paid without phone (internal)
    r = await fetch(`${ROOT}/lessons/${paidId}/view`, { headers: adminHdr });
    check('admin views paid lesson -> 200', r.status === 200, `got ${r.status}`);

    // Forensic access log recorded, with the ref code baked into the watermark
    const logs = await AccessLogModel.countDocuments({ lessonId: freeId });
    check('access log recorded for views', logs >= 1, `${logs} entries`);
    const log = await AccessLogModel.findOne({ lessonId: freeId }).lean();
    check('access log has forensic ref code', !!log?.code && /^[0-9A-F]{10}$/.test(String(log.code)), String(log?.code));
  } finally {
    await mongoose.connection.dropDatabase();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
    await rm(env.STORAGE_DIR ?? 'storage', { recursive: true, force: true });
  }

  console.log(failures === 0 ? '\n✅ All secure-PDF smoke tests passed' : `\n❌ ${failures} test(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
