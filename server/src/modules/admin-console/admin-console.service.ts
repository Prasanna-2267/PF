import mongoose from 'mongoose';
import { HttpError } from '../../middleware/error.js';
import { UserModel, type UserRole } from '../auth/user.model.js';
import { SessionModel } from '../auth/session.model.js';
import { kickAllDevices } from '../../realtime/realtime.js';
import { OrderModel } from '../commerce/order.model.js';
import { ReceiptModel } from '../commerce/receipt.model.js';
import { generateReceiptForOrder } from '../commerce/receipt.service.js';
import { sendRefundEmail } from '../../services/mail.js';
import { logger } from '../../lib/logger.js';
import { PackageModel } from '../commerce/package.model.js';
import { CouponModel } from '../commerce/coupon.model.js';
import { getOwnedLessonIds } from '../commerce/commerce.entitlement.js';
import { avatarUrlFor } from '../auth/avatar-url.js';
import { IST_TIMEZONE, istDayKey, istStartOfToday } from '../../lib/day.js';
import { LessonModel } from '../lessons/lesson.model.js';
import { ProgressModel } from '../lessons/progress.model.js';
import { AccessLogModel } from '../lessons/access-log.model.js';
import { ExamCategoryModel } from '../content/exam-category.model.js';
import { StageModel } from '../content/stage.model.js';
import { SubjectModel } from '../content/subject.model.js';
import { QuestionModel } from '../questions/question.model.js';
import { StudySessionModel } from '../tracker/study-session.model.js';
import { getTracker } from '../tracker/tracker.service.js';

const DAY_MS = 86_400_000;
const oid = (id: string) => new mongoose.Types.ObjectId(id);
const dayKey = istDayKey;
const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const sumOf = (agg: { sum?: number }[]): number => agg[0]?.sum ?? 0;

/* ─────────────────────────── Overview / stats ─────────────────────────── */

export async function getOverview() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = istStartOfToday(); // IST midnight, so "today" matches the app
  const since30 = new Date(startOfToday.getTime() - 29 * DAY_MS);

  const paid = { status: 'paid' as const };
  const [
    totalStudents,
    newStudentsWeek,
    revenueAll,
    revenueMonth,
    revenueToday,
    ordersByStatus,
    categories,
    stages,
    subjects,
    lessons,
    questions,
    packages,
    coupons,
    revenueSeriesRaw,
    signupSeriesRaw,
    recentOrdersRaw,
  ] = await Promise.all([
    UserModel.countDocuments({ role: 'student' }),
    UserModel.countDocuments({ role: 'student', createdAt: { $gte: weekAgo } }),
    OrderModel.aggregate([{ $match: paid }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    OrderModel.aggregate([
      { $match: { ...paid, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]),
    OrderModel.aggregate([
      { $match: { ...paid, createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]),
    OrderModel.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    ExamCategoryModel.countDocuments(),
    StageModel.countDocuments(),
    SubjectModel.countDocuments(),
    LessonModel.countDocuments(),
    QuestionModel.countDocuments(),
    PackageModel.countDocuments(),
    CouponModel.countDocuments(),
    OrderModel.aggregate([
      { $match: { ...paid, createdAt: { $gte: since30 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: IST_TIMEZONE } },
          sum: { $sum: '$amount' },
          n: { $sum: 1 },
        },
      },
    ]),
    UserModel.aggregate([
      { $match: { role: 'student', createdAt: { $gte: since30 } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: IST_TIMEZONE } },
          n: { $sum: 1 },
        },
      },
    ]),
    OrderModel.find(paid).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const revMap = new Map(
    (revenueSeriesRaw as { _id: string; sum: number; n: number }[]).map((r) => [r._id, r]),
  );
  const signMap = new Map(
    (signupSeriesRaw as { _id: string; n: number }[]).map((r) => [r._id, r.n]),
  );
  const revenueSeries: { date: string; paise: number; orders: number }[] = [];
  const signupSeries: { date: string; count: number }[] = [];
  for (let i = 0; i < 30; i++) {
    const key = dayKey(new Date(since30.getTime() + i * DAY_MS));
    revenueSeries.push({ date: key, paise: revMap.get(key)?.sum ?? 0, orders: revMap.get(key)?.n ?? 0 });
    signupSeries.push({ date: key, count: signMap.get(key) ?? 0 });
  }

  const statusMap = new Map(
    (ordersByStatus as { _id: string; n: number }[]).map((r) => [r._id, r.n]),
  );

  const recent = recentOrdersRaw as {
    _id: unknown;
    userId: unknown;
    amount: number;
    items: unknown[];
    createdAt: Date;
    source?: string;
  }[];
  const buyers = await UserModel.find({ _id: { $in: recent.map((o) => o.userId) } })
    .select('name email')
    .lean();
  const buyerMap = new Map(buyers.map((b) => [String(b._id), b]));
  const recentOrders = recent.map((o) => ({
    id: String(o._id),
    amount: o.amount,
    itemCount: o.items.length,
    createdAt: o.createdAt,
    source: o.source ?? 'purchase',
    buyer: {
      id: String(o.userId),
      name: buyerMap.get(String(o.userId))?.name ?? '—',
      email: buyerMap.get(String(o.userId))?.email ?? '',
    },
  }));

  return {
    students: { total: totalStudents, newThisWeek: newStudentsWeek },
    revenue: {
      totalPaise: sumOf(revenueAll),
      monthPaise: sumOf(revenueMonth),
      todayPaise: sumOf(revenueToday),
    },
    orders: {
      total: [...statusMap.values()].reduce((a, b) => a + b, 0),
      paid: statusMap.get('paid') ?? 0,
      failed: statusMap.get('failed') ?? 0,
      created: statusMap.get('created') ?? 0,
      refunded: statusMap.get('refunded') ?? 0,
    },
    content: { categories, stages, subjects, lessons, questions, packages, coupons },
    revenueSeries,
    signupSeries,
    recentOrders,
  };
}

/* ─────────────────────────── Students ─────────────────────────── */

export async function listUsers(params: {
  search?: string;
  role?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 25));
  const match: Record<string, unknown> = {};
  if (params.role) match.role = params.role;
  if (params.search?.trim()) {
    const rx = new RegExp(escapeRegex(params.search.trim()), 'i');
    match.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [facet] = await UserModel.aggregate([
    { $match: match },
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        rows: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: 'orders',
              let: { uid: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $and: [{ $eq: ['$userId', '$$uid'] }, { $eq: ['$status', 'paid'] }] },
                  },
                },
                { $group: { _id: null, count: { $sum: 1 }, spent: { $sum: '$amount' } } },
              ],
              as: 'ord',
            },
          },
          {
            $project: {
              name: 1,
              email: 1,
              phone: 1,
              role: 1,
              disabled: 1,
              emailVerified: 1,
              createdAt: 1,
              hasAvatar: 1,
              googleAvatarUrl: 1,
              avatarUpdatedAt: 1,
              purchaseCount: { $ifNull: [{ $arrayElemAt: ['$ord.count', 0] }, 0] },
              totalSpent: { $ifNull: [{ $arrayElemAt: ['$ord.spent', 0] }, 0] },
            },
          },
        ],
        total: [{ $count: 'n' }],
      },
    },
  ]);

  const rows = ((facet?.rows ?? []) as Record<string, unknown>[]).map((u) => ({
    id: String(u._id),
    name: u.name as string,
    email: u.email as string,
    phone: (u.phone as string | undefined) ?? null,
    role: u.role as UserRole,
    disabled: Boolean(u.disabled),
    emailVerified: Boolean(u.emailVerified),
    createdAt: u.createdAt as Date,
    avatarUrl: avatarUrlFor(
      String(u._id),
      Boolean(u.hasAvatar),
      u.googleAvatarUrl as string | undefined,
      u.avatarUpdatedAt as Date | undefined,
    ),
    purchaseCount: (u.purchaseCount as number) ?? 0,
    totalSpent: (u.totalSpent as number) ?? 0,
  }));
  return { rows, total: (facet?.total?.[0]?.n as number) ?? 0, page, limit };
}

export async function getUserDetail(userId: string) {
  const user = await UserModel.findById(userId).lean();
  if (!user) throw new HttpError(404, 'User not found');

  const [orders, ownedSet, completedLessons, sessionCount, minutesAgg, accessLogs, activeSessions, tracker] =
    await Promise.all([
      OrderModel.find({ userId }).sort({ createdAt: -1 }).lean(),
      getOwnedLessonIds(userId),
      ProgressModel.countDocuments({ userId }),
      StudySessionModel.countDocuments({ userId }),
      StudySessionModel.aggregate([
        { $match: { userId: oid(userId) } },
        { $group: { _id: null, sum: { $sum: '$durationMins' } } },
      ]),
      AccessLogModel.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
      SessionModel.find({ userId }).select('ip userAgent lastActiveAt createdAt').lean(),
      getTracker(userId),
    ]);

  const receipts = await ReceiptModel.find({ orderId: { $in: orders.map((o) => o._id) } })
    .select('orderId receiptNumber')
    .lean();
  const recMap = new Map(receipts.map((r) => [String(r.orderId), r.receiptNumber]));

  const ownedIds = [...ownedSet];
  const ownedLessons = await LessonModel.find({ _id: { $in: ownedIds } })
    .select('title type')
    .lean();

  const logLessonIds = [...new Set(accessLogs.map((a) => String(a.lessonId)))];
  const logLessons = await LessonModel.find({ _id: { $in: logLessonIds } }).select('title').lean();
  const logTitle = new Map(logLessons.map((l) => [String(l._id), l.title]));

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    disabled: Boolean(user.disabled),
    emailVerified: Boolean(user.emailVerified),
    createdAt: user.createdAt,
    avatarUrl: avatarUrlFor(
      String(user._id),
      user.hasAvatar,
      user.googleAvatarUrl,
      user.avatarUpdatedAt,
    ),
    activeStage: tracker.activeStage,
    exam: tracker.exam,
    stats: {
      streak: tracker.streak,
      momentum: tracker.momentum,
      syllabus: tracker.syllabus,
      totalRevisions: tracker.totalRevisions,
      totalStudyMinutes: sumOf(minutesAgg),
      sessionCount,
      completedLessons,
      ownedLessonCount: ownedIds.length,
    },
    orders: orders.map((o) => ({
      id: String(o._id),
      amount: o.amount,
      status: o.status,
      source: o.source ?? 'purchase',
      itemCount: o.items.length,
      items: o.items.map((it) => ({ type: it.type, title: it.title ?? '', price: it.price ?? 0 })),
      couponCode: o.couponCode ?? null,
      discount: o.discount ?? 0,
      createdAt: o.createdAt,
      refundedAt: o.refundedAt ?? null,
      receiptNumber: recMap.get(String(o._id)) ?? null,
    })),
    ownedLessons: ownedLessons.map((l) => ({ id: String(l._id), title: l.title, type: l.type })),
    activeSessions: activeSessions.map((s) => ({
      ip: s.ip ?? null,
      userAgent: s.userAgent ?? null,
      lastActiveAt: s.lastActiveAt ?? null,
    })),
    accessLogs: accessLogs.map((a) => ({
      id: String(a._id),
      lessonTitle: logTitle.get(String(a.lessonId)) ?? '—',
      at: a.createdAt,
      ip: a.ip ?? null,
    })),
  };
}

/* ─────────────────────────── Orders ─────────────────────────── */

export async function listOrders(params: {
  status?: string;
  userId?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 25));
  const match: Record<string, unknown> = {};
  if (params.status) match.status = params.status;
  if (params.userId) match.userId = oid(params.userId);

  const [orders, total, paidAgg] = await Promise.all([
    OrderModel.find(match).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    OrderModel.countDocuments(match),
    OrderModel.aggregate([
      { $match: { ...match, status: 'paid' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } },
    ]),
  ]);

  const users = await UserModel.find({ _id: { $in: orders.map((o) => o.userId) } })
    .select('name email')
    .lean();
  const uMap = new Map(users.map((u) => [String(u._id), u]));
  const receipts = await ReceiptModel.find({ orderId: { $in: orders.map((o) => o._id) } })
    .select('orderId receiptNumber')
    .lean();
  const recMap = new Map(receipts.map((r) => [String(r.orderId), r.receiptNumber]));

  return {
    rows: orders.map((o) => ({
      id: String(o._id),
      amount: o.amount,
      status: o.status,
      source: o.source ?? 'purchase',
      itemCount: o.items.length,
      items: o.items.map((it) => ({ type: it.type, title: it.title ?? '' })),
      couponCode: o.couponCode ?? null,
      discount: o.discount ?? 0,
      createdAt: o.createdAt,
      refundedAt: o.refundedAt ?? null,
      receiptNumber: recMap.get(String(o._id)) ?? null,
      buyer: {
        id: String(o.userId),
        name: uMap.get(String(o.userId))?.name ?? '—',
        email: uMap.get(String(o.userId))?.email ?? '',
      },
    })),
    total,
    page,
    limit,
    paidTotalPaise: sumOf(paidAgg),
  };
}

/* ─────────────────────────── Controls ─────────────────────────── */

export async function setUserRole(actorId: string, userId: string, role: UserRole) {
  if (actorId === userId) throw new HttpError(400, 'You cannot change your own role.');
  const user = await UserModel.findById(userId);
  if (!user) throw new HttpError(404, 'User not found');
  user.role = role;
  await user.save();
  return { id: String(user._id), role: user.role };
}

export async function setUserDisabled(actorId: string, userId: string, disabled: boolean) {
  if (actorId === userId) throw new HttpError(400, 'You cannot disable your own account.');
  const user = await UserModel.findById(userId);
  if (!user) throw new HttpError(404, 'User not found');
  user.disabled = disabled;
  await user.save();
  if (disabled) {
    await SessionModel.deleteMany({ userId }); // immediate lockout (requireAuth fails)
    await kickAllDevices(userId); // instant client redirect
  }
  return { id: String(user._id), disabled: user.disabled };
}

export async function forceLogoutUser(userId: string) {
  if (!(await UserModel.exists({ _id: userId }))) throw new HttpError(404, 'User not found');
  await SessionModel.deleteMany({ userId });
  await kickAllDevices(userId);
  return { ok: true };
}

export async function grantAccess(userId: string, item: { type: 'lesson' | 'package'; refId: string }) {
  if (!(await UserModel.exists({ _id: userId }))) throw new HttpError(404, 'User not found');

  let title = '';
  if (item.type === 'lesson') {
    const lesson = await LessonModel.findById(item.refId).select('title').lean();
    if (!lesson) throw new HttpError(400, 'Lesson not found');
    title = lesson.title;
    const owned = await getOwnedLessonIds(userId);
    if (owned.has(String(item.refId))) {
      throw new HttpError(409, 'This student already has access to that lesson.');
    }
  } else {
    const pkg = await PackageModel.findById(item.refId).select('title').lean();
    if (!pkg) throw new HttpError(400, 'Package not found');
    title = pkg.title;
    const existing = await OrderModel.exists({
      userId,
      status: 'paid',
      items: { $elemMatch: { type: 'package', refId: oid(item.refId) } },
    });
    if (existing) throw new HttpError(409, 'This student already has that package.');
  }

  const order = await OrderModel.create({
    userId,
    items: [{ type: item.type, refId: oid(item.refId), title, price: 0 }],
    amount: 0,
    status: 'paid',
    source: 'admin_grant',
  });
  // Create the receipt record + notify the student their access is ready
  // (non-fatal internally, like every real purchase path).
  await generateReceiptForOrder(order);
  return { id: String(order._id) };
}

export async function refundOrder(actorId: string, orderId: string) {
  const order = await OrderModel.findById(orderId);
  if (!order) throw new HttpError(404, 'Order not found');
  if (order.status === 'refunded') throw new HttpError(409, 'This order is already refunded.');
  if (order.status !== 'paid') {
    throw new HttpError(400, 'Only a paid order can be refunded or revoked.');
  }
  order.status = 'refunded';
  order.refundedAt = new Date();
  order.refundedBy = oid(actorId);
  await order.save();

  // Notify the buyer their payment was reversed + access removed (non-fatal).
  const buyer = await UserModel.findById(order.userId).select('email').lean();
  const receipt = await ReceiptModel.findOne({ orderId: order._id }).select('receiptNumber').lean();
  if (buyer?.email) {
    await sendRefundEmail(buyer.email, {
      amount: order.amount,
      receiptNumber: receipt?.receiptNumber ?? null,
      refundedAt: order.refundedAt,
    }).catch((err) => logger.warn({ err }, 'refund email failed'));
  }
  return { id: String(order._id), status: order.status };
}
