import mongoose from 'mongoose';
import { HttpError } from '../../middleware/error.js';
import { UserModel } from '../auth/user.model.js';
import { AccessLogModel } from '../lessons/access-log.model.js';
import { LessonModel } from '../lessons/lesson.model.js';
import { ProgressModel } from '../lessons/progress.model.js';
import { SubjectModel } from '../content/subject.model.js';
import { StageModel } from '../content/stage.model.js';
import { ExamCategoryModel } from '../content/exam-category.model.js';
import { RevisionModel } from './revision.model.js';
import { StudySessionModel, type StudySessionDoc } from './study-session.model.js';
import { IST_TIMEZONE, istDayKey } from '../../lib/day.js';
import type { SettingsInput } from './tracker.validation.js';

const MAX_SESSION_MINUTES = 480; // 8h cap
const AUTO_CLOSE_AFTER_MINUTES = 480;
const DAY_MS = 86_400_000;

// Day buckets are IST (the app's timezone), so streaks/today/heatmap roll over
// at IST midnight — not UTC's 05:30-IST boundary. Subtracting whole 24h days
// from any instant still moves the IST calendar date back exactly one (no DST).
const dayKey = istDayKey;
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
  try {
    await StudySessionModel.create({ userId, checkInAt: now, day: dayKey(now) });
  } catch (err) {
    // Lost the race to a concurrent check-in (partial-unique index on the open
    // session) — treat as already checked in rather than erroring.
    if ((err as { code?: number }).code === 11000) return { alreadyCheckedIn: true };
    throw err;
  }
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

  // Materialise an over-8h abandoned session as closed on load, so `checkedIn`
  // and today's minutes reflect reality (not just on the next check-in/out).
  const openSession = await autoCloseStale(userId);

  const [streak, todayMins, syllabus, revAgg, lastLog] = await Promise.all([
    computeStreak(userId),
    todayMinutes(userId),
    computeSyllabus(userId, stageId),
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

  // Resolve the active stage to its exam + name so the client can display and
  // pre-select it (the raw id alone can't say which exam it belongs to).
  let activeStage:
    | { id: string; name: string; categoryId: string; categoryName: string }
    | null = null;
  if (stageId) {
    const stage = await StageModel.findById(stageId).select('name examCategoryId').lean();
    if (stage) {
      const cat = await ExamCategoryModel.findById(stage.examCategoryId).select('name').lean();
      activeStage = {
        id: String(stage._id),
        name: stage.name,
        categoryId: String(stage.examCategoryId),
        categoryName: cat?.name ?? '',
      };
    }
  }

  return {
    checkedIn: !!openSession,
    streak,
    todayMinutes: todayMins,
    targetMinutes: user.dailyTargetMinutes ?? 60,
    momentum,
    syllabus,
    totalRevisions,
    exam: { date: user.examDate ?? null, label: user.examLabel ?? null, daysLeft, pressure },
    lastLesson,
    activeStageId: stageId ?? null,
    activeStage,
  };
}

/** Per top-level subject progress (rolled up through the tree) for a stage. */
async function subjectProgress(userId: string, stageId: string) {
  const subjects = await SubjectModel.find({ stageId })
    .select('name order parentSubjectId isActive')
    .sort({ order: 1, createdAt: 1 })
    .lean();
  if (subjects.length === 0) return [];

  const byId = new Map(subjects.map((s) => [String(s._id), s]));
  const rootOf = (id: string): string => {
    let cur = byId.get(id);
    let guard = 0;
    while (cur?.parentSubjectId && guard++ < 20) {
      const parent = byId.get(String(cur.parentSubjectId));
      if (!parent) break;
      cur = parent;
    }
    return cur ? String(cur._id) : id;
  };

  const lessons = await LessonModel.find({
    subjectId: { $in: subjects.map((s) => s._id) },
    isActive: true,
  })
    .select('_id subjectId')
    .lean();
  if (lessons.length === 0) return [];

  const completed = new Set(
    (
      await ProgressModel.find({ userId, lessonId: { $in: lessons.map((l) => l._id) } })
        .select('lessonId')
        .lean()
    ).map((p) => String(p.lessonId)),
  );

  type Row = { id: string; name: string; order: number; total: number; completed: number };
  const roots = new Map<string, Row>();
  for (const s of subjects) {
    if (!s.parentSubjectId && s.isActive) {
      roots.set(String(s._id), {
        id: String(s._id),
        name: s.name,
        order: s.order,
        total: 0,
        completed: 0,
      });
    }
  }
  for (const l of lessons) {
    const row = roots.get(rootOf(String(l.subjectId)));
    if (!row) continue;
    row.total += 1;
    if (completed.has(String(l._id))) row.completed += 1;
  }

  return [...roots.values()]
    .filter((r) => r.total > 0)
    .sort((a, b) => a.order - b.order)
    .map(({ id, name, total, completed }) => ({ id, name, total, completed }));
}

/** Study-activity insights: daily minutes, per-subject progress, study-time-of-day + pace. */
export async function getStudyInsights(userId: string) {
  const uid = new mongoose.Types.ObjectId(userId);
  const user = await UserModel.findById(userId).select('activeStageId').lean();
  const stageId = user?.activeStageId ? String(user.activeStageId) : null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const DAYS = 84; // 12 weeks — enough for a heatmap + charts
  const since = new Date(startOfToday.getTime() - (DAYS - 1) * DAY_MS);
  const sinceKey = dayKey(since);

  const [byDay, totalAgg, distinctDays, completedLessons, recentCompleted14, hourAgg, subjects] =
    await Promise.all([
      StudySessionModel.aggregate([
        { $match: { userId: uid, day: { $gte: sinceKey } } },
        { $group: { _id: '$day', minutes: { $sum: '$durationMins' } } },
      ]),
      StudySessionModel.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: null, sum: { $sum: '$durationMins' } } },
      ]),
      StudySessionModel.aggregate([
        { $match: { userId: uid } },
        { $group: { _id: '$day', m: { $sum: '$durationMins' } } },
        { $match: { m: { $gt: 0 } } },
        { $count: 'n' },
      ]),
      ProgressModel.countDocuments({ userId }),
      ProgressModel.countDocuments({
        userId,
        completedAt: { $gte: new Date(Date.now() - 14 * DAY_MS) },
      }),
      StudySessionModel.aggregate([
        { $match: { userId: uid, checkOutAt: { $ne: null } } },
        {
          $group: {
            _id: { $hour: { date: '$checkInAt', timezone: IST_TIMEZONE } },
            mins: { $sum: '$durationMins' },
          },
        },
      ]),
      stageId ? subjectProgress(userId, stageId) : Promise.resolve([]),
    ]);

  const dayMap = new Map(
    (byDay as { _id: string; minutes: number }[]).map((r) => [r._id, r.minutes]),
  );
  const daily: { date: string; minutes: number }[] = [];
  for (let i = 0; i < DAYS; i++) {
    const key = dayKey(new Date(since.getTime() + i * DAY_MS));
    daily.push({ date: key, minutes: dayMap.get(key) ?? 0 });
  }

  const hourly = new Array<number>(24).fill(0);
  for (const h of hourAgg as { _id: number; mins: number }[]) {
    if (typeof h._id === 'number' && h._id >= 0 && h._id < 24) hourly[h._id] = h.mins;
  }
  const peakMins = Math.max(...hourly);
  const peakHour = peakMins > 0 ? hourly.indexOf(peakMins) : null;

  const sumRange = (arr: { minutes: number }[]) => arr.reduce((a, b) => a + b.minutes, 0);
  const totalMinutes = (totalAgg as { sum?: number }[])[0]?.sum ?? 0;
  const daysStudied = (distinctDays as { n?: number }[])[0]?.n ?? 0;
  const best = daily.reduce((m, d) => (d.minutes > m.minutes ? d : m), { date: '', minutes: 0 });

  return {
    daily,
    hourly,
    peakHour,
    subjects,
    summary: {
      totalMinutes,
      daysStudied,
      avgPerActiveDay: daysStudied ? Math.round(totalMinutes / daysStudied) : 0,
      weekMinutes: sumRange(daily.slice(-7)),
      lastWeekMinutes: sumRange(daily.slice(-14, -7)),
      bestDayMinutes: best.minutes,
      bestDayDate: best.minutes > 0 ? best.date : null,
      completedLessons,
      recentCompleted14,
    },
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
