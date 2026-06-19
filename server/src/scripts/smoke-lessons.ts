/**
 * Lessons + progress + RBAC integration test (Phase 3a). Uploads a real PDF,
 * checks page-count, student/admin separation, progress, and file cleanup.
 *
 *   npm run test:smoke:lessons
 */
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
import { LessonModel } from '../modules/lessons/lesson.model.js';
import { storage } from '../services/storage.js';

const PORT = 4102;
const ROOT = `http://localhost:${PORT}/api`;
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let failures = 0;
function check(name: string, passed: boolean, detail = ''): void {
  if (!passed) failures++;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function loginToken(email: string, password: string): Promise<string> {
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

  const pw = 'password123';
  await UserModel.create({ name: 'Admin', email: `a_${Date.now()}@x.com`, passwordHash: await hashPassword(pw), role: 'admin', emailVerified: true });
  await UserModel.create({ name: 'Stud', email: `s_${Date.now()}@x.com`, passwordHash: await hashPassword(pw), role: 'student', emailVerified: true });
  const adminEmail = (await UserModel.findOne({ role: 'admin' }))!.email;
  const studentEmail = (await UserModel.findOne({ role: 'student' }))!.email;

  const cat = await ExamCategoryModel.create({ name: 'CA', slug: `ca-${Date.now()}` });
  const stage = await StageModel.create({ name: 'Inter', examCategoryId: cat._id });
  const subject = await SubjectModel.create({ name: 'Taxation', stageId: stage._id });
  const subjectId = String(subject._id);

  // a real 2-page PDF
  const pdf = await PDFDocument.create();
  pdf.addPage([300, 400]);
  pdf.addPage([300, 400]);
  const pdfBytes = await pdf.save();
  const makeForm = () => {
    const fd = new FormData();
    fd.append('title', 'Intro to Taxation');
    fd.append('subjectId', subjectId);
    fd.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'intro.pdf');
    return fd;
  };

  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });

  try {
    const adminToken = await loginToken(adminEmail, pw);
    const studentToken = await loginToken(studentEmail, pw);
    check('admin + student login', !!adminToken && !!studentToken);

    // RBAC: student cannot upload
    let r = await fetch(`${ROOT}/admin/lessons/pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` },
      body: makeForm(),
    });
    check('student PDF upload -> 403 (RBAC)', r.status === 403, `got ${r.status}`);

    // Admin uploads a PDF; page-count computed
    r = await fetch(`${ROOT}/admin/lessons/pdf`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: makeForm(),
    });
    const up = (await r.json()) as { lesson?: { id?: string; pageCount?: number; type?: string } };
    const pdfId = up.lesson?.id ?? '';
    check('admin PDF upload -> 201', r.status === 201, `got ${r.status}`);
    check('page count detected = 2', up.lesson?.pageCount === 2, String(up.lesson?.pageCount));

    // fileKey is stored privately and never returned to the client
    const stored = await LessonModel.findById(pdfId).lean();
    const fileKey = stored?.fileKey ?? '';
    check('fileKey saved + file exists in storage', !!fileKey && (await storage.exists(fileKey)));
    check('fileKey NOT exposed in API response', !('fileKey' in (up.lesson ?? {})));

    // Admin adds an ISM link
    r = await fetch(`${ROOT}/admin/lessons/ism`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ title: 'Govt notes', subjectId, externalUrl: 'https://icai.org/notes' }),
    });
    check('admin ISM create -> 201', r.status === 201, `got ${r.status}`);

    // validation
    r = await fetch(`${ROOT}/admin/lessons/ism`, {
      method: 'POST',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ title: 'Bad', subjectId, externalUrl: 'not-a-url' }),
    });
    check('ISM bad url -> 400', r.status === 400, `got ${r.status}`);

    const noFile = new FormData();
    noFile.append('title', 'No file');
    noFile.append('subjectId', subjectId);
    r = await fetch(`${ROOT}/admin/lessons/pdf`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: noFile });
    check('PDF upload without file -> 400', r.status === 400, `got ${r.status}`);

    // Student sees 2 active lessons, none completed
    r = await fetch(`${ROOT}/lessons?subjectId=${subjectId}`, { headers: { Authorization: `Bearer ${studentToken}` } });
    const list = (await r.json()) as { lessons?: { id: string; completed: boolean }[] };
    check('student lists 2 lessons', list.lessons?.length === 2, String(list.lessons?.length));

    // Mark complete + progress
    r = await fetch(`${ROOT}/lessons/${pdfId}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${studentToken}` } });
    check('mark complete -> 200', r.status === 200, `got ${r.status}`);

    r = await fetch(`${ROOT}/lessons/progress?subjectId=${subjectId}`, { headers: { Authorization: `Bearer ${studentToken}` } });
    const prog = (await r.json()) as { total?: number; completed?: number };
    check('progress = 1/2', prog.total === 2 && prog.completed === 1, `${prog.completed}/${prog.total}`);

    r = await fetch(`${ROOT}/lessons/${pdfId}/complete`, { method: 'DELETE', headers: { Authorization: `Bearer ${studentToken}` } });
    const prog2 = await fetch(`${ROOT}/lessons/progress?subjectId=${subjectId}`, { headers: { Authorization: `Bearer ${studentToken}` } }).then((x) => x.json() as Promise<{ completed?: number }>);
    check('unmark complete -> 0 completed', prog2.completed === 0, String(prog2.completed));

    // Delete lesson also removes the stored file
    r = await fetch(`${ROOT}/admin/lessons/${pdfId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` } });
    check('admin delete lesson -> 200', r.status === 200, `got ${r.status}`);
    check('stored file removed on delete', !(await storage.exists(fileKey)));
  } finally {
    await mongoose.connection.dropDatabase();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
    await rm(env.STORAGE_DIR ?? 'storage', { recursive: true, force: true });
  }

  console.log(failures === 0 ? '\n✅ All lessons smoke tests passed' : `\n❌ ${failures} test(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
