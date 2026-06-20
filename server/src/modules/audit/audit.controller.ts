import type { RequestHandler } from 'express';
import { AuditLogModel } from './audit-log.model.js';

/** Most-recent admin actions, optionally filtered by resource. Admin-only. */
export const list: RequestHandler = async (req, res) => {
  const { resource, limit } = req.query as Record<string, string | undefined>;
  const filter: Record<string, unknown> = {};
  if (resource) filter.resource = resource;
  const max = Math.min(Number(limit) || 100, 500);

  const logs = await AuditLogModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(max)
    .populate<{ actorId: { email?: string; name?: string } | null }>('actorId', 'email name')
    .lean();

  res.json({
    logs: logs.map((l) => ({
      id: String(l._id),
      actor: l.actorId ? { email: l.actorId.email, name: l.actorId.name } : null,
      actorRole: l.actorRole,
      method: l.method,
      resource: l.resource,
      path: l.path,
      resourceId: l.resourceId ?? null,
      statusCode: l.statusCode,
      ip: l.ip ?? null,
      at: l.createdAt,
    })),
  });
};
