/**
 * Tracker integration test (Phase 5): check-in/out, streak, syllabus %,
 * revisions, exam settings + pressure, momentum.
 *
 *   npm run test:smoke:tracker
 */
import dns from 'node:dns';
import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { hashPassword } from '../modules/auth/auth.password.js';
import { UserModel } from '../modules/auth/user.model.js';
import { ExamCategoryModel } from '../modules/content/exam-category.model.js';
import { StageModel } from '../modules/content/stage.model.js';
import { SubjectModel } from '../modules/content/subject.model.js';
import { LessonModel } from '../modules/lessons/lesson.model.js';

const PORT = 4106;
const ROOT = `http://localhost:${PORT}/api`;
const JSON_HEADERS = { 'Content-Type': 'application/json' };

let failures = 0;
function check(name: string, passed: boolean, detail = ''): void {
  if (!passed) failures++;
  console.log(`  [${passed ? 'PASS' : 'FAIL'}] ${name}${detail ? ` — ${detail}` : ''}`);
}

type Tracker = {
  checkedIn: boolean;
  streak: number;
  todayMinutes: number;
  targetMinutes: number;
  momentum: number;
  syllabus: { total: number; completed: number; percent: number };
  totalRevisions: number;
  exam: { daysLeft: number | null; pressure: number };
};

async function main(): Promise<void> {
  if (env.DNS_SERVERS) dns.setServers(env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
  await mongoose.connect(env.MONGODB_URI, { dbName: 'parallax_flow_test' });
  await mongoose.connection.dropDatabase();

  const pw = 'password123';
  await UserModel.create({ name: 'Stud', email: `s_${Date.now()}@x.com`, passwordHash: await hashPassword(pw), role: 'student', emailVerified: true, phone: '9998887777' });
  const student = (await UserModel.findOne({ role: 'student' }))!;

  const cat = await ExamCategoryModel.create({ name: 'CA', slug: `ca-${Date.now()}` });
  const stage = await StageModel.create({ name: 'Inter', examCategoryId: cat._id });
  const subject = await SubjectModel.create({ name: 'Taxation', stageId: stage._id });
  const l1 = await LessonModel.create({ title: 'L1', subjectId: subject._id, type: 'pdf', isFree: true, isActive: true, fileKey: 'k1', pageCount: 1 });
  await LessonModel.create({ title: 'L2', subjectId: subject._id, type: 'pdf', isFree: true, isActive: true, fileKey: 'k2', pageCount: 1 });

  const app = createApp();
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });

  try {
    const token = ((await (await fetch(`${ROOT}/auth/login`, { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ email: student.email, password: pw }) })).json()) as { accessToken?: string }).accessToken ?? '';
    const hdr = { Authorization: `Bearer ${token}` };
    const jhdr = { ...JSON_HEADERS, ...hdr };
    const tracker = async () => (await fetch(`${ROOT}/tracker`, { headers: hdr }).then((r) => r.json())) as Tracker;

    check('student login', !!token);

    // Active stage + complete one of two lessons -> syllabus 50%
    let r = await fetch(`${ROOT}/tracker/settings`, { method: 'PATCH', headers: jhdr, body: JSON.stringify({ activeStageId: String(stage._id), dailyTargetMinutes: 90 }) });
    check('set settings -> 200', r.status === 200, `got ${r.status}`);
    await fetch(`${ROOT}/lessons/${l1.id}/complete`, { method: 'POST', headers: hdr });
    let t = await tracker();
    check('syllabus = 1/2 (50%)', t.syllabus.total === 2 && t.syllabus.completed === 1 && t.syllabus.percent === 50, JSON.stringify(t.syllabus));
    check('daily target reflects 90', t.targetMinutes === 90);

    // Check-in / out
    r = await fetch(`${ROOT}/tracker/checkin`, { method: 'POST', headers: hdr });
    check('check-in -> 200', r.status === 200, `got ${r.status}`);
    t = await tracker();
    check('checkedIn true + streak 1', t.checkedIn === true && t.streak === 1, `streak=${t.streak}`);
    r = await fetch(`${ROOT}/tracker/checkin`, { method: 'POST', headers: hdr });
    check('second check-in -> alreadyCheckedIn', ((await r.json()) as { alreadyCheckedIn?: boolean }).alreadyCheckedIn === true);
    r = await fetch(`${ROOT}/tracker/checkout`, { method: 'POST', headers: hdr });
    check('check-out -> 200', r.status === 200, `got ${r.status}`);
    t = await tracker();
    check('checkedIn false after checkout', t.checkedIn === false);

    // Revisions
    await fetch(`${ROOT}/lessons/${l1.id}/revise`, { method: 'POST', headers: hdr });
    r = await fetch(`${ROOT}/lessons/${l1.id}/revise`, { method: 'POST', headers: hdr });
    check('revise -> count 2', ((await r.json()) as { count?: number }).count === 2);
    r = await fetch(`${ROOT}/lessons?subjectId=${String(subject._id)}`, { headers: hdr });
    const list = (await r.json()) as { lessons?: { id: string; revisions: number }[] };
    check('lesson list shows revisions=2', list.lessons?.find((l) => l.id === l1.id)?.revisions === 2);
    t = await tracker();
    check('tracker totalRevisions = 2', t.totalRevisions === 2, `${t.totalRevisions}`);

    // Exam date + pressure + momentum
    r = await fetch(`${ROOT}/tracker/settings`, { method: 'PATCH', headers: jhdr, body: JSON.stringify({ examDate: new Date(Date.now() + 30 * 86_400_000).toISOString(), examLabel: 'CA Inter May' }) });
    t = (await r.json()) as Tracker;
    check('exam countdown ~30 days', t.exam.daysLeft !== null && t.exam.daysLeft >= 29 && t.exam.daysLeft <= 31, `${t.exam.daysLeft}`);
    check('pressure is a number 0-100', typeof t.exam.pressure === 'number' && t.exam.pressure >= 0 && t.exam.pressure <= 100, `${t.exam.pressure}`);
    check('momentum is a number 0-100', typeof t.momentum === 'number' && t.momentum >= 0 && t.momentum <= 100, `${t.momentum}`);
  } finally {
    await mongoose.connection.dropDatabase();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }

  console.log(failures === 0 ? '\n✅ All tracker smoke tests passed' : `\n❌ ${failures} test(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
