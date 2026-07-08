import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.js';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { auditMutations } from '../audit/audit.js';
import * as settings from './settings.controller.js';

/** Home banner (announcement + Telegram) for signed-in users. Mounted at /api/settings. */
export const settingsRouter = Router();
settingsRouter.get('/home', requireAuth, asyncHandler(settings.home));

/** Admin editor, mounted at /api/admin/settings. */
export const adminSettingsRouter = Router();
adminSettingsRouter.use(requireAuth, requireRole('admin', 'superadmin'), auditMutations('settings'));
adminSettingsRouter.get('/', asyncHandler(settings.getAdmin));
adminSettingsRouter.patch('/', asyncHandler(settings.update));
