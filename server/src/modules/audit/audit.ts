import type { RequestHandler } from 'express';
import { logger } from '../../lib/logger.js';
import { AuditLogModel } from './audit-log.model.js';

const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Middleware factory: records a successful admin mutation to the AuditLog after
 * the response is sent. Mount on an admin router *after* requireAuth/requireRole
 * so req.auth is populated. Read-only requests and failed writes (status >= 400)
 * are not recorded. Logging is fire-and-forget and never blocks the response.
 */
export function auditMutations(resource: string): RequestHandler {
  return (req, res, next) => {
    if (!MUTATING.has(req.method)) return next();

    res.on('finish', () => {
      if (res.statusCode >= 400 || !req.auth) return;
      void AuditLogModel.create({
        actorId: req.auth.sub,
        actorRole: req.auth.role,
        method: req.method,
        resource,
        path: req.originalUrl,
        resourceId: req.params.id,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      }).catch((err) => logger.warn({ err }, 'Failed to write audit log'));
    });

    next();
  };
}
