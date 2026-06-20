import { api } from '../../lib/api';

export type AuditEntry = {
  id: string;
  actor: { email?: string; name?: string } | null;
  actorRole: string;
  method: string;
  resource: string;
  path: string;
  resourceId: string | null;
  statusCode: number;
  ip: string | null;
  at: string;
};

export const adminAuditApi = {
  list: (resource?: string) =>
    api
      .get<{ logs: AuditEntry[] }>('/admin/audit', { params: { resource } })
      .then((r) => r.data.logs),
};
