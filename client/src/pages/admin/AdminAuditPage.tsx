import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge, Card, Select, Spinner } from '../../components/ui';
import { adminAuditApi } from '../../features/admin/audit.api';

const RESOURCES = ['', 'content', 'lessons', 'commerce', 'questions'];

export function AdminAuditPage() {
  const [resource, setResource] = useState('');
  const audit = useQuery({
    queryKey: ['admin', 'audit', resource],
    queryFn: () => adminAuditApi.list(resource || undefined),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-semibold tracking-tight">Audit log</h1>
        <Select value={resource} onChange={(e) => setResource(e.target.value)} className="w-44">
          {RESOURCES.map((r) => (
            <option key={r} value={r}>
              {r === '' ? 'All resources' : r}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-sm text-muted">Every admin create / update / delete, most recent first.</p>

      {audit.isLoading ? (
        <div className="flex justify-center py-10"><Spinner /></div>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-2 font-medium">When</th>
                  <th className="px-4 py-2 font-medium">Admin</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 font-medium">Resource</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {audit.data?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted">No admin actions recorded yet.</td>
                  </tr>
                )}
                {audit.data?.map((e) => (
                  <tr key={e.id} className="border-b border-line/60 last:border-0">
                    <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-muted">
                      {new Date(e.at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">{e.actor?.email ?? '—'}</td>
                    <td className="px-4 py-2">
                      <Badge tone={e.method === 'DELETE' ? 'danger' : e.method === 'POST' ? 'success' : 'accent'}>
                        {e.method}
                      </Badge>
                      <span className="ml-2 font-mono text-xs text-muted">{e.path}</span>
                    </td>
                    <td className="px-4 py-2">{e.resource}</td>
                    <td className="px-4 py-2 font-mono text-xs">{e.statusCode}</td>
                    <td className="px-4 py-2 font-mono text-xs text-muted">{e.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
