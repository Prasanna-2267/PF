import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  SegmentedControl,
  Skeleton,
  ShieldIcon,
  type BadgeTone,
  type Column,
} from '../../components/ui';
import { PageHeader } from '../../components/layout';
import { adminAuditApi, type AuditEntry } from '../../features/admin/audit.api';
import { errorMessage } from '../../features/auth/auth.api';

const RESOURCE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'content', label: 'Content' },
  { value: 'lessons', label: 'Lessons' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'questions', label: 'Questions' },
];

const METHOD_TONE: Record<string, BadgeTone> = {
  POST: 'success',
  PATCH: 'info',
  PUT: 'info',
  DELETE: 'danger',
  GET: 'neutral',
};

function methodTone(method: string): BadgeTone {
  return METHOD_TONE[method] ?? 'neutral';
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function AdminAuditPage() {
  const [resource, setResource] = useState('');

  const audit = useQuery({
    queryKey: ['admin', 'audit', resource || 'all'],
    queryFn: () => adminAuditApi.list(resource || undefined),
  });

  const columns: Column<AuditEntry>[] = [
    {
      key: 'when',
      header: 'When',
      render: (e) => <span className="whitespace-nowrap font-mono text-xs text-muted">{formatWhen(e.at)}</span>,
    },
    {
      key: 'admin',
      header: 'Admin',
      render: (e) => <span className="text-fg">{e.actor?.email ?? '—'}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      render: (e) => (
        <span className="flex items-center gap-2">
          <Badge tone={methodTone(e.method)} size="sm">
            {e.method}
          </Badge>
          <span className="truncate font-mono text-xs text-muted">{e.path}</span>
        </span>
      ),
    },
    {
      key: 'resource',
      header: 'Resource',
      render: (e) => (
        <span className="min-w-0">
          <span className="block text-fg">{e.resource}</span>
          {e.resourceId ? (
            <span className="block truncate font-mono text-[11px] text-muted">{e.resourceId}</span>
          ) : null}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (e) => (
        <span className={`font-mono text-xs ${e.statusCode >= 400 ? 'text-danger' : 'text-muted'}`}>
          {e.statusCode}
        </span>
      ),
    },
    {
      key: 'ip',
      header: 'IP',
      render: (e) => <span className="font-mono text-xs text-muted">{e.ip ?? '—'}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Audit' }]}
        title="Audit log"
        description="Every admin create, update and delete — most recent first. Read-only."
      />

      <div className="mb-4 -mx-1 overflow-x-auto px-1 pb-1">
        <SegmentedControl
          aria-label="Filter by resource"
          size="sm"
          value={resource}
          onChange={setResource}
          options={RESOURCE_OPTIONS}
        />
      </div>

      {audit.isLoading ? (
        <div className="space-y-2">
          <Skeleton shape="block" className="h-12" />
          <Skeleton shape="block" className="h-12" />
          <Skeleton shape="block" className="h-12" />
        </div>
      ) : audit.isError ? (
        <ErrorState message={errorMessage(audit.error)} onRetry={() => void audit.refetch()} />
      ) : audit.data && audit.data.length > 0 ? (
        <>
          {/* Mobile / tablet: stacked cards */}
          <div className="space-y-3 lg:hidden">
            {audit.data.map((e) => (
              <Card key={e.id} className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Badge tone={methodTone(e.method)} size="sm">
                      {e.method}
                    </Badge>
                    <span className="truncate font-mono text-xs text-muted">{e.path}</span>
                  </span>
                  <span
                    className={`shrink-0 font-mono text-xs ${e.statusCode >= 400 ? 'text-danger' : 'text-muted'}`}
                  >
                    {e.statusCode}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <span className="text-fg">{e.actor?.email ?? '—'}</span>
                  <span>{e.resource}</span>
                  <span className="font-mono">{e.ip ?? '—'}</span>
                </div>
                {e.resourceId ? (
                  <p className="truncate font-mono text-[11px] text-muted">{e.resourceId}</p>
                ) : null}
                <p className="font-mono text-[11px] text-muted">{formatWhen(e.at)}</p>
              </Card>
            ))}
          </div>

          {/* Desktop: dense data table */}
          <div className="hidden lg:block">
            <DataTable columns={columns} rows={audit.data} keyField={(e) => e.id} dense />
          </div>
        </>
      ) : (
        <EmptyState
          icon={<ShieldIcon size={22} />}
          title="No admin actions recorded"
          description="Admin changes will appear here as they happen."
        />
      )}
    </>
  );
}
