/**
 * Question Bank + AI grading smoke test (Phase 6). Proves admin CRUD + RBAC,
 * answer-key stripping on student listings, MCQ auto-grade, written grading
 * (heuristic fallback when no OPENAI_API_KEY), and stats.
 *
 *   npm run test:smoke:questions
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

const PORT = 4107;
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
  if (env.DNS_SERVERS) dns.setServers(env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
  await mongoose.connect(env.MONGODB_URI, { dbName: 'parallax_flow_test' });
  await mongoose.connection.dropDatabase();

  const pw = 'password123';
  const adminEmail = `admin_${Date.now()}@x.com`;
  const studentEmail = `stud_${Date.now()}@x.com`;
  await UserModel.create({ name: 'Admin', email: adminEmail, passwordHash: await hashPassword(pw), role: 'admin', emailVerified: true });
  await UserModel.create({ name: 'Stud', email: studentEmail, passwordHash: await hashPassword(pw), role: 'student', emailVerified: true });

  const cat = await ExamCategoryModel.create({ name: 'CA', slug: `ca-${Date.now()}` });
  const stage = await StageModel.create({ name: 'Inter', examCategoryId: cat._id });
  const subject = await SubjectModel.create({ name: 'Taxation', stageId: stage._id });
  const stageId = String(stage._id);
  const subjectId = String(subject._id);

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

    const mcqBody = JSON.stringify({
      stageId,
      subjectId,
      type: 'mcq',
      prompt: 'Under the Income Tax Act, what is the basic exemption limit slab concept called?',
      options: ['Slab rate', 'Flat rate', 'Surcharge', 'Cess'],
      correctOption: 0,
      explanation: 'India uses slab rates for individual taxation.',
    });

    // RBAC
    let r = await fetch(`${ROOT}/admin/questions`, { method: 'POST', headers: sHdr, body: mcqBody });
    check('student create question -> 403 (RBAC)', r.status === 403, `got ${r.status}`);

    // Admin creates an MCQ
    r = await fetch(`${ROOT}/admin/questions`, { method: 'POST', headers: aHdr, body: mcqBody });
    const mcq = (await r.json()) as { question?: { _id?: string; maxScore?: number } };
    const mcqId = mcq.question?._id ?? '';
    check('admin create MCQ -> 201', r.status === 201, `got ${r.status}`);
    check('MCQ default maxScore = 1', mcq.question?.maxScore === 1, `${mcq.question?.maxScore}`);

    // Validation: bad correctOption
    r = await fetch(`${ROOT}/admin/questions`, {
      method: 'POST',
      headers: aHdr,
      body: JSON.stringify({ stageId, type: 'mcq', prompt: 'X', options: ['a', 'b'], correctOption: 5 }),
    });
    check('MCQ with out-of-range correctOption -> 400', r.status === 400, `got ${r.status}`);

    // Validation: written without model answer
    r = await fetch(`${ROOT}/admin/questions`, {
      method: 'POST',
      headers: aHdr,
      body: JSON.stringify({ stageId, type: 'short', prompt: 'Explain GST.' }),
    });
    check('written without modelAnswer -> 400', r.status === 400, `got ${r.status}`);

    // Admin creates a short written question
    r = await fetch(`${ROOT}/admin/questions`, {
      method: 'POST',
      headers: aHdr,
      body: JSON.stringify({
        stageId,
        type: 'short',
        prompt: 'Define GST and its main components.',
        modelAnswer: 'GST is a destination based indirect tax with components CGST SGST and IGST levied on supply of goods and services.',
        maxScore: 10,
      }),
    });
    const short = (await r.json()) as { question?: { _id?: string } };
    const shortId = short.question?._id ?? '';
    check('admin create short question -> 201', r.status === 201, `got ${r.status}`);

    // Student listing must NOT leak the answer key
    r = await fetch(`${ROOT}/questions?stageId=${stageId}`, { headers: sHdr });
    const listed = (await r.json()) as { questions?: Record<string, unknown>[] };
    const leaks = (listed.questions ?? []).some(
      (q) => 'correctOption' in q || 'modelAnswer' in q || 'explanation' in q,
    );
    check('student list returns 2 questions', listed.questions?.length === 2, `${listed.questions?.length}`);
    check('student list does NOT leak answers', !leaks);

    // MCQ correct answer
    r = await fetch(`${ROOT}/questions/${mcqId}/answer`, { method: 'POST', headers: sHdr, body: JSON.stringify({ selectedOption: 0 }) });
    let g = (await r.json()) as { score: number; isCorrect: boolean; correctOption: number; explanation?: string; gradedBy: string };
    check('MCQ correct -> score 1, isCorrect true', g.score === 1 && g.isCorrect === true, JSON.stringify(g));
    check('MCQ reveals correctOption + explanation', g.correctOption === 0 && !!g.explanation);
    check('MCQ gradedBy auto', g.gradedBy === 'auto');

    // MCQ wrong answer
    r = await fetch(`${ROOT}/questions/${mcqId}/answer`, { method: 'POST', headers: sHdr, body: JSON.stringify({ selectedOption: 1 }) });
    g = (await r.json()) as typeof g;
    check('MCQ wrong -> score 0, isCorrect false', g.score === 0 && g.isCorrect === false);

    // Written: strong answer scores higher than a weak one (heuristic offline)
    r = await fetch(`${ROOT}/questions/${shortId}/answer`, {
      method: 'POST',
      headers: sHdr,
      body: JSON.stringify({ answerText: 'GST is a destination based indirect tax with components CGST SGST and IGST on supply of goods and services.' }),
    });
    const strong = (await r.json()) as { score: number; maxScore: number; feedback: string; modelAnswer?: string; gradedBy: string };
    check('written strong answer graded in range', strong.score > 0 && strong.score <= strong.maxScore, JSON.stringify({ s: strong.score, m: strong.maxScore }));
    check('written reveals modelAnswer + feedback', !!strong.modelAnswer && !!strong.feedback);
    check('written gradedBy ai|heuristic', strong.gradedBy === 'ai' || strong.gradedBy === 'heuristic', strong.gradedBy);

    r = await fetch(`${ROOT}/questions/${shortId}/answer`, {
      method: 'POST',
      headers: sHdr,
      body: JSON.stringify({ answerText: 'Some random unrelated words here.' }),
    });
    const weak = (await r.json()) as { score: number };
    check('strong answer scores >= weak answer', strong.score >= weak.score, `${strong.score} vs ${weak.score}`);

    // Bad submission
    r = await fetch(`${ROOT}/questions/${mcqId}/answer`, { method: 'POST', headers: sHdr, body: JSON.stringify({}) });
    check('empty submission -> 400', r.status === 400, `got ${r.status}`);

    // Stats
    r = await fetch(`${ROOT}/questions/stats?stageId=${stageId}`, { headers: sHdr });
    const stats = (await r.json()) as { attempts: number; mcqAccuracy: number; averagePercent: number };
    check('stats counts attempts', stats.attempts === 4, `${stats.attempts}`);
    check('stats mcqAccuracy 50%', stats.mcqAccuracy === 50, `${stats.mcqAccuracy}`);

    // Admin update + delete
    r = await fetch(`${ROOT}/admin/questions/${mcqId}`, { method: 'PATCH', headers: aHdr, body: JSON.stringify({ difficulty: 'hard' }) });
    check('admin update question -> 200', r.status === 200, `got ${r.status}`);
    r = await fetch(`${ROOT}/admin/questions/${shortId}`, { method: 'DELETE', headers: aHdr });
    check('admin delete question -> 200', r.status === 200, `got ${r.status}`);
    r = await fetch(`${ROOT}/questions?stageId=${stageId}`, { headers: sHdr });
    check('listing drops the deleted question', ((await r.json()) as { questions?: unknown[] }).questions?.length === 1);
  } finally {
    await mongoose.connection.dropDatabase();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }

  console.log(failures === 0 ? '\n✅ All question-bank smoke tests passed' : `\n❌ ${failures} test(s) failed`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
