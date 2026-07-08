import type { RequestHandler } from 'express';
import { HttpError } from '../../middleware/error.js';
import * as lessons from './lesson.service.js';
import {
  createIsmSchema,
  createPdfFieldsSchema,
  subjectIdQuery,
  updateLessonSchema,
} from './lesson.validation.js';

// ── Admin ──
export const listAdmin: RequestHandler = async (req, res) => {
  const { subjectId } = subjectIdQuery.parse(req.query);
  res.json({ lessons: await lessons.listLessonsForAdmin(subjectId) });
};

export const uploadPdf: RequestHandler = async (req, res) => {
  const fields = createPdfFieldsSchema.parse(req.body);
  res.status(201).json({ lesson: await lessons.createPdfLesson(fields, req.file, req.auth!.sub) });
};

export const createIsm: RequestHandler = async (req, res) => {
  const data = createIsmSchema.parse(req.body);
  res.status(201).json({ lesson: await lessons.createIsmLesson(data, req.auth!.sub) });
};

export const update: RequestHandler = async (req, res) => {
  res.json({ lesson: await lessons.updateLesson(req.params.id!, updateLessonSchema.parse(req.body)) });
};

export const remove: RequestHandler = async (req, res) => {
  await lessons.deleteLesson(req.params.id!);
  res.json({ ok: true });
};

export const insights: RequestHandler = async (req, res) => {
  res.json(await lessons.getLessonInsights(req.params.id!));
};

// ── Student ──
export const listForStudent: RequestHandler = async (req, res) => {
  const { subjectId } = subjectIdQuery.parse(req.query);
  res.json({ lessons: await lessons.listLessonsForStudent(subjectId, req.auth!.sub) });
};

export const complete: RequestHandler = async (req, res) => {
  res.json(await lessons.markComplete(req.auth!.sub, req.params.id!));
};

export const uncomplete: RequestHandler = async (req, res) => {
  res.json(await lessons.unmarkComplete(req.auth!.sub, req.params.id!));
};

export const revise: RequestHandler = async (req, res) => {
  res.json(await lessons.reviseLesson(req.auth!.sub, req.params.id!));
};

export const subjectProgress: RequestHandler = async (req, res) => {
  const { subjectId } = subjectIdQuery.parse(req.query);
  res.json(await lessons.getSubjectProgress(req.auth!.sub, subjectId));
};

// ── Secure viewing ──
export const viewLesson: RequestHandler = async (req, res) => {
  const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
  res.json(await lessons.getLessonForView(req.auth!.sub, req.params.id!, meta));
};

export const pageImage: RequestHandler = async (req, res) => {
  const pageNumber = Number(req.params.n);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new HttpError(400, 'Invalid page number');
  }
  const data = await lessons.renderLessonPage(req.auth!.sub, req.params.id!, pageNumber);
  // Encrypted bytes, not an image — keeps it un-downloadable from the Network tab.
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store, private');
  res.send(data);
};
