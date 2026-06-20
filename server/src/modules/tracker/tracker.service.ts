import mongoose from 'mongoose';
import { HttpError } from '../../middleware/error.js';
import { UserModel } from '../auth/user.model.js';
import { AccessLogModel } from '../lessons/access-log.model.js';
import { LessonModel } from '../lessons/lesson.model.js';
import { ProgressModel } from '../lessons/progress.model.js';
import { SubjectModel } from '../content/subject.model.js';
import { RevisionModel } from './revision.model.js';
import { StudySessionModel, type StudySessionDoc } from './study-session.model.js';
import type { SettingsInput } from './tracker.validation.js';

const MAX_SESSION_MINUTES = 480; // 8h cap
const AUTO_CLOSE_AFTER_MINUTES = 480;
const DAY_MS = 86_400_000;

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function minsSince(start: Date): number {
  return Math.round((Date.now() - start.getTime()) / 60000);
}

// ── Check-in / out ──
async function autoCloseStale(userId: string): Promise<StudySessionDoc | null> {
  const open = await StudySessionModel.findOne({ userId, checkOutAt: null });
  if (!open) return null;
  if (minsSince(open.checkInAt) > AUTO_CLOSE_AFTER_MINUTES) {
    open.checkOutAt = new Date(open.checkInAt.getTime() + MAX_SESSION_MINUTES * 60000);
    open.durationMins = MAX_SESSION_MINUTES;
    open.autoClosed = true;
    await open.save();
    return null;
  }
  return open;
}

export async function checkIn(userId: string) {
  const open = await autoCloseStale(userId);
  if (open) return { alreadyCheckedIn: true };
  const now = new Date();
  await StudySessionModel.create({ userId, checkInAt: now, day: dayKey(now) });
  return { alreadyCheckedIn: false };
}

export async function checkOut(userId: string) {
  const open = await StudySessionModel.findOne({ userId, checkOutAt: null });
  if (!open) throw new HttpError(400, "You're not checked in");
  const mins = Math.min(MAX_SESSION_MINUTES, minsSince(open.checkInAt));
  open.checkOutAt = new Date();
  open.durationMins = mins;
  await open.save();
  return { durationMins: mins };
}

// ── Metrics ──
async function computeStreak(userId: string): Promise<number> {
  const sessions = await StudySessionModel.find({ userId }).select('day').lean();
  const days = new Set(sessions.map((s) => s.day));
  let streak = 0;
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setUTCDate(cursor.getUTCDate() - 1); // grace for today
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

async function todayMinutes(userId: string): Promise<number> {
  const sessions = await StudySessionModel.find({ userId, day: dayKey(new Date()) }).lean();
  let mins = 0;
  for (const s of sessions) {
    mins += s.checkOutAt ? s.durationMins : Math.min(MAX_SESSION_MINUTES, minsSince(s.checkInAt));
  }
  return mins;
}

async function computeSyllabus(userId: string, stageId?: string) {
  if (!stageId) return { total: 0, completed: 0, percent: 0 };
  const subjectIds = (await SubjectModel.find({ stageId }).select('_id').lean()).map((s) => s._id);
  const lessonIds = (await LessonModel.find({ subjectId: { $in: subjectIds }, isActive: true }).select('_id').lean()).map(
    (l) => l._id,
  );
  const total = lessonIds.length;
  const completed = await ProgressModel.countDocuments({ userId, lessonId: { $in: lessonIds } });
  return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
}

async function computeMomentum(userId: string, streak: number): Promise<number> {
  const recentCompleted = await ProgressModel.countDocuments({
    userId,
    completedAt: { $gte: new Date(Date.now() - 7 * DAY_MS) },
  });
  const completion = Math.min(recentCompleted / 7, 1) * 100;

  const recentSessions = await StudySessionModel.find({
    userId,
    checkInAt: { $gte: new Date(Date.now() - 14 * DAY_MS) },
  })
    .select('day')
    .lean();
  const consistency = (Math.min(new Set(recentSessions.map((s) => s.day)).size, 14) / 14) * 100;
  const streakScore = Math.min(streak / 14, 1) * 100;

  return Math.round(0.4 * completion + 0.3 * consistency + 0.3 * streakScore);
}

function computePressure(examDate: Date | null | undefined, syllabusPercent: number) {
  if (!examDate) return { pressure: 0, daysLeft: null as number | null };
  const daysLeft = Math.ceil((examDate.getTime() - Date.now()) / DAY_MS);
  const incomplete = 100 - syllabusPercent;
  const timePressure = daysLeft <= 0 ? 100 : Math.max(0, Math.min(100, Math.round(100 * (1 - daysLeft / 90))));
  const pressure = Math.min(100, Math.round(timePressure * (0.4 + 0.6 * (incomplete / 100))));
  return { pressure, daysLeft };
}

export async function getTracker(userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) throw new HttpError(404, 'Account not found');
  const stageId = user.activeStageId ? String(user.activeStageId) : undefined;

  const [streak, todayMins, syllabus, open, revAgg, lastLog] = await Promise.all([
    computeStreak(userId),
    todayMinutes(userId),
    computeSyllabus(userId, stageId),
    StudySessionModel.exists({ userId, checkOutAt: null }),
    RevisionModel.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, sum: { $sum: '$count' } } },
    ]),
    AccessLogModel.findOne({ userId }).sort({ createdAt: -1 }).lean(),
  ]);
  const momentum = await computeMomentum(userId, streak);
  const { pressure, daysLeft } = computePressure(user.examDate, syllabus.percent);
  const totalRevisions = (revAgg as { sum?: number }[])[0]?.sum ?? 0;

  let lastLesson: { id: string; title: string } | null = null;
  if (lastLog) {
    const l = await LessonModel.findById(lastLog.lessonId).select('title').lean();
    if (l) lastLesson = { id: String(l._id), title: l.title };
  }

  return {
    checkedIn: !!open,
    streak,
    todayMinutes: todayMins,
    targetMinutes: user.dailyTargetMinutes ?? 60,
    momentum,
    syllabus,
    totalRevisions,
    exam: { date: user.examDate ?? null, label: user.examLabel ?? null, daysLeft, pressure },
    lastLesson,
    activeStageId: stageId ?? null,
  };
}

export async function updateSettings(userId: string, input: SettingsInput) {
  const user = await UserModel.findById(userId);
  if (!user) throw new HttpError(404, 'Account not found');
  if (input.examDate !== undefined) user.examDate = input.examDate ? new Date(input.examDate) : null;
  if (input.examLabel !== undefined) user.examLabel = input.examLabel ?? null;
  if (input.dailyTargetMinutes !== undefined) user.dailyTargetMinutes = input.dailyTargetMinutes;
  if (input.activeStageId !== undefined) {
    user.activeStageId = input.activeStageId ? new mongoose.Types.ObjectId(input.activeStageId) : null;
  }
  await user.save();
  return getTracker(userId);
}
