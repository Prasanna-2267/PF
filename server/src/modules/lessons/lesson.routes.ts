import { Router } from 'express';
import multer from 'multer';
import { asyncHandler } from '../../middleware/error.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as lessons from './lesson.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

/** Student-facing, mounted at /api/lessons. */
export const lessonsRouter = Router();
lessonsRouter.use(requireAuth);
lessonsRouter.get('/', asyncHandler(lessons.listForStudent));
lessonsRouter.get('/progress', asyncHandler(lessons.subjectProgress));
lessonsRouter.get('/:id/view', asyncHandler(lessons.viewLesson));
lessonsRouter.get('/:id/pages/:n', asyncHandler(lessons.pageImage));
lessonsRouter.post('/:id/complete', asyncHandler(lessons.complete));
lessonsRouter.delete('/:id/complete', asyncHandler(lessons.uncomplete));

/** Admin-only, mounted at /api/admin/lessons. */
export const adminLessonsRouter = Router();
adminLessonsRouter.use(requireAuth, requireRole('admin', 'superadmin'));
adminLessonsRouter.get('/', asyncHandler(lessons.listAdmin));
adminLessonsRouter.post('/pdf', upload.single('file'), asyncHandler(lessons.uploadPdf));
adminLessonsRouter.post('/ism', asyncHandler(lessons.createIsm));
adminLessonsRouter.patch('/:id', asyncHandler(lessons.update));
adminLessonsRouter.delete('/:id', asyncHandler(lessons.remove));
