import { Router } from 'express';
import { asyncHandler } from '../../middleware/error.js';
import { requireAuth } from '../../middleware/auth.js';
import * as tracker from './tracker.controller.js';

/** Student tracker, mounted at /api/tracker. */
export const trackerRouter = Router();
trackerRouter.use(requireAuth);
trackerRouter.get('/', asyncHandler(tracker.get));
trackerRouter.get('/insights', asyncHandler(tracker.insights));
trackerRouter.post('/checkin', asyncHandler(tracker.checkIn));
trackerRouter.post('/checkout', asyncHandler(tracker.checkOut));
trackerRouter.patch('/settings', asyncHandler(tracker.settings));
