import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  SegmentedControl,
  Skeleton,
  ChevronLeftIcon,
  ChevronRightIcon,
  ReceiptIcon,
  type BadgeTone,
  type Column,
} from '../../components/ui';
import { PageHeader } from '../../components/layout';
import { ConfirmDialog } from './admin-shared';
import { consoleApi, type AdminOrder, type AdminOrderStatus } from '../../features/admin/console.api';
import { errorMessage } from '../../features/auth/auth.api';
import { formatINR } from '../../lib/format';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const STATUS_TONE: Record<AdminOrderStatus, BadgeTone> = {
  created: 'warn',
  paid: 'success',
  failed: 'danger',
  refunded: 'neutral',
};

const STATUS_LABEL: Record<AdminOrderStatus, string> = {
  created: 'Created',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

const REFUND_INVALIDATE: unknown[][] = [['admin', 'orders'], ['admin', 'overview'], ['admin', 'user']];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status }: { status: AdminOrderStatus }) {
  return (
    <Badge tone={STATUS_TONE[status]} size="sm">
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function BuyerCell({ order }: { order: AdminOrder }) {
  if (!order.buyer) return <span className="text-muted">—</span>;
  return (
    <Link
      to={`/admin/students/${order.buyer.id}`}
      className="group min-w-0 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      <span className="block truncate font-semibold text-fg group-hover:text-primary">{order.buyer.name}</span>
      <span className="block truncate text-xs text-muted">{order.buyer.email}</span>
    </Link>
  );
}

function AmountCell({ order }: { order: AdminOrder }) {
  if (order.source === 'admin_grant') {
    return (
      <Badge tone="gold" size="sm">
        Comp
      </Badge>
    );
  }
  return <span className="whitespace-nowrap tabular font-semibold text-fg">{formatINR(order.amount)}</span>;
}

function itemsSummary(order: AdminOrder): string {
  const first = order.items[0]?.title;
  const rest = order.itemCount - 1;
  if (!first) return `${order.itemCount} item${order.itemCount === 1 ? '' : 's'}`;
  return rest > 0 ? `${first} +${rest} more` : first;
}

export function AdminOrdersPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState<AdminOrder | null>(null);

  const limit = 25;
  const query = useQuery({
    queryKey: ['admin', 'orders', { status, page }],
    queryFn: () => consoleApi.orders({ status: status || undefined, page, limit }),
  });

  const data = query.data;

  const columns: Column<AdminOrder>[] = [
    {
      key: 'buyer',
      header: 'Buyer',
      render: (o) => <BuyerCell order={o} />,
    },
    {
      key: 'items',
      header: 'Items',
      render: (o) => (
        <span className="min-w-0">
          <span className="block truncate text-fg">{itemsSummary(o)}</span>
          <span className="block text-xs text-muted">
            {o.itemCount} item{o.itemCount === 1 ? '' : 's'}
          </span>
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (o) => <AmountCell order={o} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <StatusBadge status={o.status} />,
    },
    {
      key: 'date',
      header: 'Date',
      render: (o) => <span className="whitespace-nowrap text-muted">{formatDate(o.createdAt)}</span>,
    },
    {
      key: 'receipt',
      header: 'Receipt',
      render: (o) => <span className="font-mono text-xs text-muted">{o.receiptNumber ?? '—'}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (o) =>
        o.status === 'paid' ? (
          <Button variant="secondary" size="sm" onClick={() => setRefundTarget(o)}>
            Refund
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Orders' }]}
        title="Orders & Revenue"
        description="Every purchase and comp across Parallax Flow."
      />

      <div className="mb-4 -mx-1 overflow-x-auto px-1 pb-1">
        <SegmentedControl
          aria-label="Filter by status"
          size="sm"
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={STATUS_OPTIONS}
        />
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
          {/* Summary strip */}
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-card border border-line bg-gradient-to-br from-success-soft/60 to-transparent p-4 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Paid total</p>
              <p className="mt-1 font-display text-2xl font-extrabold tabular text-fg">
                {formatINR(data.paidTotalPaise)}
              </p>
            </div>
            <div className="rounded-card border border-line bg-sunken/50 p-4 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Orders</p>
              <p className="mt-1 font-display text-2xl font-extrabold tabular text-fg">{data.total}</p>
            </div>
          </div>

          {/* Mobile / tablet: stacked cards */}
          <div className="space-y-3 lg:hidden">
            {data.rows.map((o) => (
              <Card key={o.id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <BuyerCell order={o} />
                  <AmountCell order={o} />
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                  <StatusBadge status={o.status} />
                  <span>{itemsSummary(o)}</span>
                  <span>{formatDate(o.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-2">
                  <span className="font-mono text-xs text-muted">{o.receiptNumber ?? '—'}</span>
                  {o.status === 'paid' ? (
                    <Button variant="secondary" size="sm" onClick={() => setRefundTarget(o)}>
                      Refund
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop: data table */}
          <div className="hidden lg:block">
            <DataTable columns={columns} rows={data.rows} keyField={(o) => o.id} />
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
          icon={<ReceiptIcon size={22} />}
          title="No orders found"
          description="No orders match this filter yet."
        />
      )}

      <ConfirmDialog
        open={refundTarget !== null}
        onClose={() => setRefundTarget(null)}
        title="Refund this order?"
        confirmLabel="Refund order"
        description={
          <>
            This revokes the in-app access this order granted
            {refundTarget?.buyer ? (
              <>
                {' '}for <span className="font-semibold text-fg">{refundTarget.buyer.name}</span>
              </>
            ) : null}{' '}
            and marks the order refunded. No money is moved by the app — process the actual refund in your
            payment provider separately.
          </>
        }
        onConfirm={() => consoleApi.refundOrder(refundTarget!.id)}
        invalidate={REFUND_INVALIDATE}
        success="Order refunded"
        onSuccess={() => setRefundTarget(null)}
      />
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
