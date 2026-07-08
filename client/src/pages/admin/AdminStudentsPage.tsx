import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Input,
  SegmentedControl,
  Skeleton,
  ChevronLeftIcon,
  ChevronRightIcon,
  SearchIcon,
  UsersIcon,
  type BadgeTone,
  type Column,
} from '../../components/ui';
import { PageHeader } from '../../components/layout';
import { useDebouncedValue } from '../../hooks';
import { consoleApi, type AdminUserRole, type AdminUserRow } from '../../features/admin/console.api';
import { errorMessage } from '../../features/auth/auth.api';
import { formatINR } from '../../lib/format';

const ROLE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'student', label: 'Students' },
  { value: 'admin', label: 'Admins' },
];

const ROLE_TONE: Record<AdminUserRole, BadgeTone> = {
  student: 'neutral',
  admin: 'primary',
  superadmin: 'gold',
};

const ROLE_LABEL: Record<AdminUserRole, string> = {
  student: 'Student',
  admin: 'Admin',
  superadmin: 'Superadmin',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function RoleBadges({ user }: { user: AdminUserRow }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      <Badge tone={ROLE_TONE[user.role]} size="sm">
        {ROLE_LABEL[user.role]}
      </Badge>
      {user.disabled ? (
        <Badge tone="danger" size="sm">
          Disabled
        </Badge>
      ) : null}
    </span>
  );
}

export function AdminStudentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const limit = 25;
  const query = useQuery({
    queryKey: ['admin', 'users', { search: debouncedSearch, role, page }],
    queryFn: () =>
      consoleApi.users({
        search: debouncedSearch || undefined,
        role: role || undefined,
        page,
        limit,
      }),
  });

  const data = query.data;

  const columns: Column<AdminUserRow>[] = [
    {
      key: 'student',
      header: 'Student',
      render: (u) => (
        <span className="flex min-w-0 items-center gap-2.5">
          <Avatar name={u.name} src={u.avatarUrl} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-fg">{u.name}</span>
            <span className="block truncate text-xs text-muted">{u.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (u) => <span className="whitespace-nowrap text-muted">{u.phone ?? '—'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (u) => <RoleBadges user={u} />,
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (u) => <span className="whitespace-nowrap text-muted">{formatDate(u.createdAt)}</span>,
    },
    {
      key: 'purchases',
      header: 'Purchases',
      align: 'right',
      render: (u) => <span className="tabular text-fg">{u.purchaseCount}</span>,
    },
    {
      key: 'spent',
      header: 'Spent',
      align: 'right',
      render: (u) => <span className="whitespace-nowrap tabular font-semibold text-fg">{formatINR(u.totalSpent)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Students' }]}
        title="Students"
        description="Every learner and admin on Parallax Flow."
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:max-w-xs sm:flex-1">
          <Input
            aria-label="Search students"
            placeholder="Search by name, email or phone"
            leftIcon={<SearchIcon size={18} />}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <SegmentedControl
            aria-label="Filter by role"
            size="sm"
            value={role}
            onChange={(v) => {
              setRole(v);
              setPage(1);
            }}
            options={ROLE_OPTIONS}
          />
        </div>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} shape="block" className="h-14" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
      ) : data && data.rows.length > 0 ? (
        <>
          {/* Mobile / tablet: stacked cards */}
          <div className="space-y-3 lg:hidden">
            {data.rows.map((u) => (
              <Link key={u.id} to={`/admin/students/${u.id}`} className="block">
                <Card className="pf-lift space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-fg">{u.name}</span>
                        <span className="block truncate text-xs text-muted">{u.email}</span>
                      </span>
                    </span>
                    <RoleBadges user={u} />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted">
                    <span>{u.phone ?? 'No phone'}</span>
                    <span>Joined {formatDate(u.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-line pt-2 text-sm">
                    <span className="text-muted">
                      {u.purchaseCount} purchase{u.purchaseCount === 1 ? '' : 's'}
                    </span>
                    <span className="tabular font-semibold text-fg">{formatINR(u.totalSpent)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop: data table */}
          <div className="hidden lg:block">
            <DataTable
              columns={columns}
              rows={data.rows}
              keyField={(u) => u.id}
              onRowClick={(u) => navigate(`/admin/students/${u.id}`)}
            />
          </div>

          <PaginationFooter
            page={data.page}
            limit={data.limit}
            total={data.total}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      ) : (
        <EmptyState
          icon={<UsersIcon size={22} />}
          title="No students found"
          description="Try a different search or role filter."
        />
      )}
    </>
  );
}

function PaginationFooter({
  page,
  limit,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  limit: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const atStart = page <= 1;
  const atEnd = to >= total;
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      <p className="text-xs text-muted">
        Showing <span className="tabular font-semibold text-fg">{from}</span>–
        <span className="tabular font-semibold text-fg">{to}</span> of{' '}
        <span className="tabular font-semibold text-fg">{total}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onPrev}
          disabled={atStart}
          leftIcon={<ChevronLeftIcon size={16} />}
        >
          Prev
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onNext}
          disabled={atEnd}
          rightIcon={<ChevronRightIcon size={16} />}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
