import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import * as audit from './audit.controller.js';

/** Admin-only audit trail viewer, mounted at /api/admin/audit. */
export const adminAuditRouter = Router();
adminAuditRouter.use(requireAuth, requireRole('admin', 'superadmin'));
adminAuditRouter.get('/', asyncHandler(audit.list));
