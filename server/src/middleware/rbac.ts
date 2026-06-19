import type { RequestHandler } from 'express';
import { HttpError } from './error.js';
import type { UserRole } from '../modules/auth/user.model.js';

/** Allow only the given roles. Must run after requireAuth. */
export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.auth) return next(new HttpError(401, 'Authentication required'));
    if (!roles.includes(req.auth.role as UserRole)) {
      return next(new HttpError(403, 'You do not have permission to do that'));
    }
    next();
  };
