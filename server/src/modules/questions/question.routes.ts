import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../../middleware/error.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { auditMutations } from '../audit/audit.js';
import * as questions from './question.controller.js';

// Throttle answer submissions — caps AI grading cost / abuse per user.
const answerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.sub ?? 'anon',
});

/** Student-facing, mounted at /api/questions. Answers are stripped from listings. */
export const questionsRouter = Router();
questionsRouter.use(requireAuth);
questionsRouter.get('/', asyncHandler(questions.listForStudent));
questionsRouter.get('/stats', asyncHandler(questions.stats));
questionsRouter.post('/:id/answer', answerLimiter, asyncHandler(questions.answer));

/** Admin-only, mounted at /api/admin/questions. */
export const adminQuestionsRouter = Router();
adminQuestionsRouter.use(requireAuth, requireRole('admin', 'superadmin'), auditMutations('questions'));
adminQuestionsRouter.get('/', asyncHandler(questions.listAdmin));
adminQuestionsRouter.post('/', asyncHandler(questions.create));
adminQuestionsRouter.patch('/:id', asyncHandler(questions.update));
adminQuestionsRouter.delete('/:id', asyncHandler(questions.remove));
