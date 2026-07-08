import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { auditMutations } from '../audit/audit.js';
import * as content from './content.controller.js';

/** Public, read-only — active (published) content only. Mounted at /api/content. */
export const contentRouter = Router();
contentRouter.get('/categories', asyncHandler(content.listCategories));
contentRouter.get('/categories/:categoryId/stages', asyncHandler(content.listStages));
contentRouter.get('/stages/:stageId/subjects', asyncHandler(content.getSubjectTree));

/** Admin-only management — includes unpublished items. Mounted at /api/admin/content. */
export const adminContentRouter = Router();
adminContentRouter.use(requireAuth, requireRole('admin', 'superadmin'), auditMutations('content'));

adminContentRouter.get('/categories', asyncHandler(content.listCategories));
adminContentRouter.post('/categories', asyncHandler(content.createCategory));
adminContentRouter.patch('/categories/:id', asyncHandler(content.updateCategory));
adminContentRouter.delete('/categories/:id', asyncHandler(content.deleteCategory));

adminContentRouter.get('/categories/:categoryId/stages', asyncHandler(content.listStages));
adminContentRouter.post('/stages', asyncHandler(content.createStage));
adminContentRouter.patch('/stages/:id', asyncHandler(content.updateStage));
adminContentRouter.delete('/stages/:id', asyncHandler(content.deleteStage));

adminContentRouter.get('/stages/:stageId/subjects', asyncHandler(content.getSubjectTree));
adminContentRouter.post('/subjects', asyncHandler(content.createSubject));
adminContentRouter.post('/subjects/:id/subdivide', asyncHandler(content.subdivideSubject));
adminContentRouter.patch('/subjects/:id', asyncHandler(content.updateSubject));
adminContentRouter.delete('/subjects/:id', asyncHandler(content.deleteSubject));
