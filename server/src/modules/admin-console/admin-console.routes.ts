import { Router, type RequestHandler } from 'express';
import { asyncHandler } from '../../middleware/error.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { auditMutations } from '../audit/audit.js';
import * as c from './admin-console.controller.js';

/**
 * Admin command-centre: student oversight, orders/revenue, and control actions.
 * Mounted at /api/admin. Middleware is applied PER-ROUTE (not router-level) so
 * requests for the sibling /api/admin/content|lessons|… routers fall through
 * cleanly without double-auditing.
 */
export const adminConsoleRouter = Router();

const read: RequestHandler[] = [requireAuth, requireRole('admin', 'superadmin')];
const write: RequestHandler[] = [
  requireAuth,
  requireRole('admin', 'superadmin'),
  auditMutations('admin'),
];

adminConsoleRouter.get('/overview', ...read, asyncHandler(c.overview));

adminConsoleRouter.get('/users', ...read, asyncHandler(c.listUsers));
adminConsoleRouter.get('/users/:id', ...read, asyncHandler(c.userDetail));
adminConsoleRouter.patch('/users/:id/role', ...write, asyncHandler(c.setRole));
adminConsoleRouter.patch('/users/:id/status', ...write, asyncHandler(c.setStatus));
adminConsoleRouter.post('/users/:id/logout', ...write, asyncHandler(c.forceLogout));
adminConsoleRouter.post('/users/:id/grants', ...write, asyncHandler(c.grant));

adminConsoleRouter.get('/orders', ...read, asyncHandler(c.listOrders));
adminConsoleRouter.post('/orders/:id/refund', ...write, asyncHandler(c.refund));
