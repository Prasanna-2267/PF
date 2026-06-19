import type { Request, RequestHandler } from 'express';
import * as content from './content.service.js';
import {
  createCategorySchema,
  createStageSchema,
  createSubjectSchema,
  updateCategorySchema,
  updateStageSchema,
  updateSubjectSchema,
} from './content.validation.js';

/** Admins (on the /api/admin/content routes) also see unpublished items. */
function includeInactive(req: Request): boolean {
  const role = req.auth?.role;
  return role === 'admin' || role === 'superadmin';
}

// ── Categories ──
export const listCategories: RequestHandler = async (req, res) => {
  res.json({ categories: await content.listCategories(includeInactive(req)) });
};
export const createCategory: RequestHandler = async (req, res) => {
  res.status(201).json({ category: await content.createCategory(createCategorySchema.parse(req.body)) });
};
export const updateCategory: RequestHandler = async (req, res) => {
  res.json({ category: await content.updateCategory(req.params.id!, updateCategorySchema.parse(req.body)) });
};
export const deleteCategory: RequestHandler = async (req, res) => {
  await content.deleteCategory(req.params.id!);
  res.json({ ok: true });
};

// ── Stages ──
export const listStages: RequestHandler = async (req, res) => {
  res.json({ stages: await content.listStages(req.params.categoryId!, includeInactive(req)) });
};
export const createStage: RequestHandler = async (req, res) => {
  res.status(201).json({ stage: await content.createStage(createStageSchema.parse(req.body)) });
};
export const updateStage: RequestHandler = async (req, res) => {
  res.json({ stage: await content.updateStage(req.params.id!, updateStageSchema.parse(req.body)) });
};
export const deleteStage: RequestHandler = async (req, res) => {
  await content.deleteStage(req.params.id!);
  res.json({ ok: true });
};

// ── Subjects (tree) ──
export const getSubjectTree: RequestHandler = async (req, res) => {
  res.json({ subjects: await content.getSubjectTree(req.params.stageId!, includeInactive(req)) });
};
export const createSubject: RequestHandler = async (req, res) => {
  res.status(201).json({ subject: await content.createSubject(createSubjectSchema.parse(req.body)) });
};
export const updateSubject: RequestHandler = async (req, res) => {
  res.json({ subject: await content.updateSubject(req.params.id!, updateSubjectSchema.parse(req.body)) });
};
export const deleteSubject: RequestHandler = async (req, res) => {
  await content.deleteSubject(req.params.id!);
  res.json({ ok: true });
};
