/**
 * Forensic lookup: trace a leaked secured page back to the account that opened
 * it. Every served page bakes a short ref code into the watermark and records
 * an AccessLog row with the same code. Read the code off the leaked image and:
 *
 *   npm run forensic -- <REF_CODE>
 *
 * Prints who opened the lesson, when, and from which IP/user-agent.
 */
import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { AccessLogModel } from '../modules/lessons/access-log.model.js';
import { UserModel } from '../modules/auth/user.model.js';
import { LessonModel } from '../modules/lessons/lesson.model.js';

async function main(): Promise<void> {
  const code = (process.argv[2] ?? '').trim().toUpperCase();
  if (!code) {
    console.error('Usage: npm run forensic -- <REF_CODE>');
    process.exit(1);
  }

  if (env.DNS_SERVERS) {
    dns.setServers(env.DNS_SERVERS.split(',').map((s) => s.trim()).filter(Boolean));
  }
  await mongoose.connect(env.MONGODB_URI);

  const logs = await AccessLogModel.find({ code }).sort({ createdAt: -1 }).lean();
  if (logs.length === 0) {
    console.log(`No access log found for ref code "${code}".`);
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`\n🔎 ${logs.length} match(es) for ref code ${code}:\n`);
  for (const log of logs) {
    const user = await UserModel.findById(log.userId).lean();
    const lesson = await LessonModel.findById(log.lessonId).lean();
    console.log('────────────────────────────────────────');
    console.log(`  When:    ${log.createdAt?.toISOString?.() ?? log.createdAt}`);
    console.log(`  User:    ${user?.name ?? '?'} <${user?.email ?? '?'}>  phone=${user?.phone ?? '—'}`);
    console.log(`  UserID:  ${String(log.userId)}`);
    console.log(`  Lesson:  ${lesson?.title ?? '?'}  (${String(log.lessonId)})`);
    console.log(`  IP:      ${log.ip ?? '—'}`);
    console.log(`  Agent:   ${log.userAgent ?? '—'}`);
  }
  console.log('────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
