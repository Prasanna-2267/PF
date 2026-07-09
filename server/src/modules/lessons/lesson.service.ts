import { createCipheriv, randomBytes, randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { PDFDocument } from 'pdf-lib';
import { HttpError } from '../../middleware/error.js';
import { OrderModel } from '../commerce/order.model.js';
import { PackageModel } from '../commerce/package.model.js';
import { storage } from '../../services/storage.js';
import { renderBasePage, applyWatermark, basePageKey } from '../../services/pdf-render.js';
import { getViewSession, issueViewSession } from '../../services/view-keys.js';
import { createSemaphore } from '../../lib/semaphore.js';
import { env } from '../../config/env.js';
import { UserModel, type UserDoc } from '../auth/user.model.js';
import { SubjectModel } from '../content/subject.model.js';
import { getOwnedLessonIds, hasLessonAccess } from '../commerce/commerce.entitlement.js';
import { RevisionModel } from '../tracker/revision.model.js';
import { AccessLogModel } from './access-log.model.js';
import { LessonModel, type LessonDoc } from './lesson.model.js';
import { ProgressModel } from './progress.model.js';
import type { CreateIsmInput, CreatePdfFields, UpdateLessonInput } from './lesson.validation.js';

type RequestMeta = { ip?: string; userAgent?: string };

/** Client-safe shape — never exposes fileKey/storage internals. */
function publicLesson(l: LessonDoc, completed = false, locked = false, revisions = 0) {
  return {
    id: l.id as string,
    title: l.title,
    type: l.type,
    subjectId: String(l.subjectId),
    externalUrl: l.type === 'ism' ? (l.externalUrl ?? null) : null,
    pageCount: l.type === 'pdf' ? (l.pageCount ?? 0) : null,
    price: l.price,
    isFree: l.isFree,
    order: l.order,
    isActive: l.isActive,
    completed,
    locked,
    revisions,
  };
}

async function ensureSubject(subjectId: string): Promise<void> {
  if (!(await SubjectModel.exists({ _id: subjectId }))) {
    throw new HttpError(400, 'Invalid subjectId');
  }
}

/**
 * A subject holds EITHER sub-subjects OR notes — never both. Notes may only be
 * attached to a leaf subject (one with no sub-subjects).
 */
async function assertLeafSubject(subjectId: string): Promise<void> {
  if (await SubjectModel.exists({ parentSubjectId: subjectId })) {
    throw new HttpError(
      400,
      'This subject has sub-subjects — add notes to a sub-subject instead, not to a subject that contains other subjects.',
    );
  }
}

export async function createPdfLesson(
  fields: CreatePdfFields,
  file: Express.Multer.File | undefined,
  userId: string,
) {
  await ensureSubject(fields.subjectId);
  await assertLeafSubject(fields.subjectId);
  if (!file) throw new HttpError(400, 'A PDF file is required');
  if (file.mimetype !== 'application/pdf') throw new HttpError(400, 'Only PDF files are allowed');

  let pageCount: number;
  try {
    const pdf = await PDFDocument.load(file.buffer, { updateMetadata: false });
    pageCount = pdf.getPageCount();
  } catch {
    throw new HttpError(400, 'Invalid or corrupted PDF');
  }

  const fileKey = `lessons/${randomUUID()}.pdf`;
  await storage.put(fileKey, file.buffer, 'application/pdf');

  const lesson = await LessonModel.create({
    title: fields.title,
    subjectId: fields.subjectId,
    type: 'pdf',
    fileKey,
    originalName: file.originalname,
    pageCount,
    sizeBytes: file.size,
    price: fields.price ?? 0,
    isFree: fields.isFree === 'true',
    order: fields.order ?? 0,
    uploadedBy: userId,
  });
  return publicLesson(lesson);
}

export async function createIsmLesson(data: CreateIsmInput, userId: string) {
  await ensureSubject(data.subjectId);
  await assertLeafSubject(data.subjectId);
  const lesson = await LessonModel.create({
    title: data.title,
    subjectId: data.subjectId,
    type: 'ism',
    externalUrl: data.externalUrl,
    price: data.price ?? 0,
    isFree: data.isFree ?? false,
    order: data.order ?? 0,
    uploadedBy: userId,
  });
  return publicLesson(lesson);
}

export async function listLessonsForAdmin(subjectId: string) {
  const lessons = await LessonModel.find({ subjectId }).sort({ order: 1, createdAt: 1 });
  return lessons.map((l) => publicLesson(l));
}

export async function listLessonsForStudent(subjectId: string, userId: string) {
  const lessons = await LessonModel.find({ subjectId, isActive: true }).sort({ order: 1, createdAt: 1 });
  const completedRows = await ProgressModel.find({
    userId,
    lessonId: { $in: lessons.map((l) => l._id) },
  })
    .select('lessonId')
    .lean();
  const completed = new Set(completedRows.map((p) => String(p.lessonId)));
  const owned = await getOwnedLessonIds(userId);
  const revRows = await RevisionModel.find({ userId, lessonId: { $in: lessons.map((l) => l._id) } })
    .select('lessonId count')
    .lean();
  const revs = new Map(revRows.map((r) => [String(r.lessonId), r.count]));
  return lessons.map((l) => {
    const locked = l.type === 'pdf' && !l.isFree && !owned.has(String(l._id));
    return publicLesson(l, completed.has(String(l._id)), locked, revs.get(String(l._id)) ?? 0);
  });
}

export async function reviseLesson(userId: string, lessonId: string) {
  if (!(await LessonModel.exists({ _id: lessonId }))) throw new HttpError(404, 'Lesson not found');
  const rev = await RevisionModel.findOneAndUpdate(
    { userId, lessonId },
    { $inc: { count: 1 }, $set: { lastRevisedAt: new Date() } },
    { upsert: true, new: true },
  );
  return { count: (rev?.count as number | undefined) ?? 1 };
}

export async function updateLesson(id: string, data: UpdateLessonInput) {
  const existing = await LessonModel.findById(id).select('type').lean();
  if (!existing) throw new HttpError(404, 'Lesson not found');

  // ISM ("government link") lessons are always free, public resources — their
  // externalUrl is served to every student and has no entitlement gate, so a
  // non-free ISM lesson would leak its link. Force free regardless of input.
  const patch: UpdateLessonInput = { ...data };
  if (existing.type === 'ism') {
    patch.isFree = true;
    patch.price = 0;
  }

  const lesson = await LessonModel.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
  if (!lesson) throw new HttpError(404, 'Lesson not found');
  return publicLesson(lesson);
}

/** True if any student has a PAID entitlement to this lesson (directly or via a purchased package). */
async function lessonHasPurchasers(lessonId: string): Promise<boolean> {
  const oid = new mongoose.Types.ObjectId(lessonId);
  if (await OrderModel.exists({ status: 'paid', items: { $elemMatch: { type: 'lesson', refId: oid } } })) {
    return true;
  }
  const pkgIds = (await PackageModel.find({ lessonIds: oid }).select('_id').lean()).map((p) => p._id);
  if (pkgIds.length) {
    return Boolean(
      await OrderModel.exists({
        status: 'paid',
        items: { $elemMatch: { type: 'package', refId: { $in: pkgIds } } },
      }),
    );
  }
  return false;
}

export async function deleteLesson(id: string): Promise<void> {
  const lesson = await LessonModel.findById(id);
  if (!lesson) throw new HttpError(404, 'Lesson not found');
  // Never destroy content that students have paid for — unpublish keeps their
  // access while removing it from the catalogue.
  if (await lessonHasPurchasers(id)) {
    throw new HttpError(
      409,
      'Students have already purchased this lesson. Unpublish it to remove it from the catalogue while keeping their access, or refund those orders first.',
    );
  }
  if (lesson.type === 'pdf' && lesson.fileKey) {
    const { fileKey } = lesson;
    await storage.delete(fileKey);
    // Best-effort, parallel cleanup of cached page renders (orphans are harmless).
    await Promise.all(
      Array.from({ length: lesson.pageCount ?? 0 }, (_, i) =>
        storage.delete(basePageKey(fileKey, i + 1)).catch(() => undefined),
      ),
    );
  }
  await lesson.deleteOne();
  await ProgressModel.deleteMany({ lessonId: id });
}

/** Admin insight for one lesson: who purchased it (directly or via a package), who completed it. */
export async function getLessonInsights(lessonId: string) {
  const lesson = await LessonModel.findById(lessonId).select('title').lean();
  if (!lesson) throw new HttpError(404, 'Lesson not found');
  const oid = new mongoose.Types.ObjectId(lessonId);

  const [directOrders, pkgs, progress, revAgg, viewCount] = await Promise.all([
    OrderModel.find({ status: 'paid', items: { $elemMatch: { type: 'lesson', refId: oid } } })
      .select('userId createdAt')
      .lean(),
    PackageModel.find({ lessonIds: oid }).select('_id title').lean(),
    ProgressModel.find({ lessonId }).select('userId completedAt').lean(),
    RevisionModel.aggregate([{ $match: { lessonId: oid } }, { $group: { _id: null, sum: { $sum: '$count' } } }]),
    AccessLogModel.countDocuments({ lessonId: oid }),
  ]);

  const pkgMap = new Map(pkgs.map((p) => [String(p._id), p.title]));
  const pkgOrders = pkgs.length
    ? await OrderModel.find({
        status: 'paid',
        items: { $elemMatch: { type: 'package', refId: { $in: pkgs.map((p) => p._id) } } },
      })
        .select('userId createdAt items')
        .lean()
    : [];

  const purchaserMap = new Map<string, { at: Date; via: string }>();
  for (const o of directOrders) purchaserMap.set(String(o.userId), { at: o.createdAt, via: 'Direct' });
  for (const o of pkgOrders) {
    if (purchaserMap.has(String(o.userId))) continue;
    const item = o.items.find((it) => it.type === 'package' && pkgMap.has(String(it.refId)));
    purchaserMap.set(String(o.userId), {
      at: o.createdAt,
      via: item ? `Package · ${pkgMap.get(String(item.refId))}` : 'Package',
    });
  }

  const completedSet = new Set(progress.map((p) => String(p.userId)));
  const userIds = [...new Set([...purchaserMap.keys(), ...progress.map((p) => String(p.userId))])];
  const users = await UserModel.find({ _id: { $in: userIds } }).select('name email').lean();
  const uMap = new Map(users.map((u) => [String(u._id), u]));

  return {
    lesson: { id: lessonId, title: lesson.title },
    counts: {
      purchasers: purchaserMap.size,
      completed: progress.length,
      revisions: (revAgg as { sum?: number }[])[0]?.sum ?? 0,
      views: viewCount,
    },
    purchasers: [...purchaserMap.entries()].map(([uid, v]) => ({
      userId: uid,
      name: uMap.get(uid)?.name ?? '—',
      email: uMap.get(uid)?.email ?? '',
      at: v.at,
      via: v.via,
      completed: completedSet.has(uid),
    })),
    completers: progress.map((p) => ({
      userId: String(p.userId),
      name: uMap.get(String(p.userId))?.name ?? '—',
      email: uMap.get(String(p.userId))?.email ?? '',
      at: p.completedAt ?? null,
    })),
  };
}

// ── Progress ──
export async function markComplete(userId: string, lessonId: string) {
  if (!(await LessonModel.exists({ _id: lessonId }))) throw new HttpError(404, 'Lesson not found');
  await ProgressModel.findOneAndUpdate(
    { userId, lessonId },
    { userId, lessonId, status: 'completed', completedAt: new Date() },
    { upsert: true },
  );
  return { completed: true };
}

export async function unmarkComplete(userId: string, lessonId: string) {
  await ProgressModel.deleteOne({ userId, lessonId });
  return { completed: false };
}

export async function getSubjectProgress(userId: string, subjectId: string) {
  const lessonIds = (await LessonModel.find({ subjectId, isActive: true }).select('_id').lean()).map(
    (l) => l._id,
  );
  const completed = await ProgressModel.countDocuments({ userId, lessonId: { $in: lessonIds } });
  return { total: lessonIds.length, completed };
}

// ── Secure viewing ──
async function assertViewable(lesson: LessonDoc, user: UserDoc): Promise<void> {
  if (lesson.type !== 'pdf' || !lesson.fileKey) {
    throw new HttpError(400, 'This lesson is not a secured PDF');
  }
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  if (isAdmin) return; // admins may always preview any lesson

  // A paid owner keeps access even if the lesson is later UNPUBLISHED — they
  // bought it. Non-owners can't see an unpublished lesson at all.
  const owns = lesson.isFree ? false : await hasLessonAccess(user.id as string, lesson.id as string);
  if (!lesson.isActive && !owns) throw new HttpError(404, 'Lesson not found');
  if (!lesson.isFree && !owns) {
    throw new HttpError(402, 'Purchase required to view this lesson', { code: 'PURCHASE_REQUIRED' });
  }
  // Phone required so the watermark always carries it (students only).
  if (user.role === 'student' && !user.phone) {
    throw new HttpError(403, 'Add your phone number to view secured notes', { code: 'PHONE_REQUIRED' });
  }
}

function watermarkLines(user: UserDoc, code: string): string[] {
  const stamp = `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  return [user.name, user.email, user.phone ?? '', `ID ${user.id as string}`, stamp, `Ref ${code}`];
}

export async function getLessonForView(userId: string, lessonId: string, meta: RequestMeta) {
  const lesson = await LessonModel.findById(lessonId);
  if (!lesson) throw new HttpError(404, 'Lesson not found');
  const user = await UserModel.findById(userId);
  if (!user) throw new HttpError(401, 'Account not found');

  await assertViewable(lesson, user);
  const session = issueViewSession(userId, lessonId);
  await AccessLogModel.create({
    userId,
    lessonId,
    action: 'view',
    code: session.code,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  const completed = !!(await ProgressModel.exists({ userId, lessonId }));

  return {
    id: lesson.id as string,
    title: lesson.title,
    pageCount: lesson.pageCount ?? 0,
    completed,
    key: session.key.toString('base64'),
  };
}

// Bound concurrent renders so a burst of page views can't exhaust memory.
const renderSlot = createSemaphore(env.PDF_RENDER_CONCURRENCY ?? 2);

async function tryGetCache(key: string): Promise<Buffer | null> {
  try {
    return await storage.get(key);
  } catch {
    return null; // cache miss (or unreadable) — caller re-renders
  }
}

/**
 * Produce a watermarked page PNG. The expensive BASE render (opening + decoding
 * the whole PDF) is cached per file+page in storage; only the cheap per-user
 * watermark is re-applied on each view. All heavy work runs inside a concurrency
 * slot. Any cache miss/failure transparently falls back to a full render, so
 * behaviour is identical to before — just faster and lighter on memory.
 */
async function renderPageImage(fileKey: string, pageNumber: number, lines: string[]): Promise<Buffer> {
  const cacheKey = basePageKey(fileKey, pageNumber);

  // Everything heavy — the cache read, the MuPDF render, and the watermark — runs
  // inside a single concurrency slot, so total in-flight memory (base-page buffers
  // + the native render peak) is bounded by PDF_RENDER_CONCURRENCY no matter how
  // large the burst of viewers. Queued requests hold nothing until admitted, and
  // the first request through a cold page fills the cache for those behind it.
  return renderSlot(async () => {
    const cachedBase = await tryGetCache(cacheKey);
    if (cachedBase) {
      try {
        return await applyWatermark(cachedBase, lines);
      } catch {
        // Cached base was unusable (e.g. a partial write) — drop it and re-render.
        void storage.delete(cacheKey).catch(() => undefined);
      }
    }
    const pdf = await storage.get(fileKey);
    const base = renderBasePage(pdf, pageNumber);
    void storage.put(cacheKey, base, 'image/png').catch(() => undefined); // best-effort cache
    return applyWatermark(base, lines);
  });
}

export async function renderLessonPage(userId: string, lessonId: string, pageNumber: number): Promise<Buffer> {
  const lesson = await LessonModel.findById(lessonId);
  if (!lesson) throw new HttpError(404, 'Lesson not found');
  const user = await UserModel.findById(userId);
  if (!user) throw new HttpError(401, 'Account not found');

  await assertViewable(lesson, user);
  if (pageNumber < 1 || pageNumber > (lesson.pageCount ?? 0)) {
    throw new HttpError(404, 'Page out of range');
  }

  const session = getViewSession(userId, lessonId);
  if (!session) throw new HttpError(403, 'Open the lesson again', { code: 'VIEW_EXPIRED' });

  const png = await renderPageImage(
    lesson.fileKey as string,
    pageNumber,
    watermarkLines(user, session.code),
  );

  // Encrypt the page (AES-256-GCM) so the Network tab only sees ciphertext.
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', session.key, iv);
  const ciphertext = Buffer.concat([cipher.update(png), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ciphertext, tag]); // iv(12) || ciphertext || tag(16)
}
