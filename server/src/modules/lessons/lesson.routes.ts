import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../middleware/error.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as lessons from './lesson.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// Per-user throttle on page fetches — slows bulk "download every page" scraping.
const pageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.sub ?? 'anon',
});

/** Student-facing, mounted at /api/lessons. */
export const lessonsRouter = Router();
lessonsRouter.use(requireAuth);
lessonsRouter.get('/', asyncHandler(lessons.listForStudent));
lessonsRouter.get('/progress', asyncHandler(lessons.subjectProgress));
lessonsRouter.get('/:id/view', asyncHandler(lessons.viewLesson));
lessonsRouter.get('/:id/pages/:n', pageLimiter, asyncHandler(lessons.pageImage));
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
