import { randomUUID } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { HttpError } from '../../middleware/error.js';
import { storage } from '../../services/storage.js';
import { SubjectModel } from '../content/subject.model.js';
import { LessonModel, type LessonDoc } from './lesson.model.js';
import { ProgressModel } from './progress.model.js';
import type { CreateIsmInput, CreatePdfFields, UpdateLessonInput } from './lesson.validation.js';

/** Client-safe shape — never exposes fileKey/storage internals. */
function publicLesson(l: LessonDoc, completed = false) {
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
  };
}

async function ensureSubject(subjectId: string): Promise<void> {
  if (!(await SubjectModel.exists({ _id: subjectId }))) {
    throw new HttpError(400, 'Invalid subjectId');
  }
}

export async function createPdfLesson(
  fields: CreatePdfFields,
  file: Express.Multer.File | undefined,
  userId: string,
) {
  await ensureSubject(fields.subjectId);
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
  return lessons.map((l) => publicLesson(l, completed.has(String(l._id))));
}

export async function updateLesson(id: string, data: UpdateLessonInput) {
  const lesson = await LessonModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!lesson) throw new HttpError(404, 'Lesson not found');
  return publicLesson(lesson);
}

export async function deleteLesson(id: string): Promise<void> {
  const lesson = await LessonModel.findById(id);
  if (!lesson) throw new HttpError(404, 'Lesson not found');
  if (lesson.type === 'pdf' && lesson.fileKey) await storage.delete(lesson.fileKey);
  await lesson.deleteOne();
  await ProgressModel.deleteMany({ lessonId: id });
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
