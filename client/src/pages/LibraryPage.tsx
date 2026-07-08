import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AnimatedNumber,
  Badge,
  buttonClasses,
  Card,
  DataTable,
  EmptyState,
  ErrorState,
  Skeleton,
  LibraryIcon,
  ReceiptIcon,
} from '../components/ui';
import { BooksArt, OrbitArt } from '../components/decor';
import type { BadgeTone, Column } from '../components/ui';
import { PageHeader } from '../components/layout';
import { commerceApi, type Order } from '../features/commerce/commerce.api';
import { errorMessage } from '../features/auth/auth.api';
import { formatINR } from '../lib/format';

const ORDER_STATUS: Record<Order['status'], { tone: BadgeTone; label: string }> = {
  paid: { tone: 'success', label: 'Paid' },
  created: { tone: 'warn', label: 'Created' },
  failed: { tone: 'danger', label: 'Failed' },
  refunded: { tone: 'neutral', label: 'Refunded' },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function itemLabel(count: number): string {
  return `${count} item${count === 1 ? '' : 's'}`;
}

/** A styled `<Link>` to a paid order's receipt, or a dash when unavailable. */
function ReceiptLink({ order }: { order: Order }) {
  if (order.status === 'paid' && order.receiptId) {
    return (
      <Link
        to={`/receipt/${order.receiptId}`}
        className={buttonClasses({ variant: 'secondary', size: 'sm' })}
      >
        Receipt
      </Link>
    );
  }
  return <span className="text-faint">—</span>;
}

export function LibraryPage() {
  const my = useQuery({ queryKey: ['commerce', 'my'], queryFn: commerceApi.my });

  const columns: Column<Order>[] = [
    {
      key: 'receiptNumber',
      header: 'Receipt no.',
      render: (o) => (
        <span className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-fg"
          >
            <ReceiptIcon size={15} />
          </span>
          {o.receiptNumber ? (
            <span className="tabular font-medium text-fg">{o.receiptNumber}</span>
          ) : (
            <span className="text-faint">—</span>
          )}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (o) => <span className="tabular text-muted">{formatDateTime(o.createdAt)}</span>,
    },
    {
      key: 'items',
      header: 'Items',
      render: (o) => <span className="text-fg">{itemLabel(o.itemCount)}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (o) => <span className="tabular font-semibold text-fg">{formatINR(o.amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>,
    },
    {
      key: 'receipt',
      header: '',
      align: 'right',
      render: (o) => <ReceiptLink order={o} />,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Purchases"
        title="My Library"
        description="Your owned lessons, orders and receipts."
      />

      {my.isLoading ? (
        <div className="space-y-6">
          <Skeleton shape="block" className="h-24" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton shape="block" className="h-16" />
            <Skeleton shape="block" className="h-16" />
            <Skeleton shape="block" className="h-16" />
          </div>
        </div>
      ) : my.isError ? (
        <ErrorState onRetry={() => void my.refetch()} message={errorMessage(my.error)} />
      ) : my.data ? (
        <div className="pf-stagger space-y-6">
          {/* Owned summary + access to learning material — hero moment */}
          <Card variant="navy">
            <span className="pf-hero-ring -right-16 -top-24 h-72 w-72" aria-hidden="true" />
            <span className="pf-hero-ring-gold -right-10 -top-14 h-44 w-44" aria-hidden="true" />
            <OrbitArt className="pointer-events-none absolute -bottom-16 -right-12 h-56 w-56 text-white/15 max-sm:hidden" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-gold-400"
                >
                  <LibraryIcon size={22} />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
                    {my.data.ownedLessonIds.length === 1 ? 'Owned lesson' : 'Owned lessons'}
                  </p>
                  <p className="pf-text-gold mt-0.5 font-display text-4xl font-extrabold leading-none tabular">
                    <AnimatedNumber value={my.data.ownedLessonIds.length} />
                  </p>
                  <p className="mt-1.5 text-sm text-white/60">Buy once — yours forever.</p>
                </div>
              </div>
              <Link to="/notes" className={buttonClasses({ variant: 'gold' })}>
                Go to my notes
              </Link>
            </div>
          </Card>

          {/* Order history */}
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              Order history
            </h2>

            {my.data.orders.length === 0 ? (
              <EmptyState
                illustration={<BooksArt className="h-32 w-auto" />}
                title="No orders yet"
                description="When you buy a lesson or package, your orders and receipts show up here."
                action={
                  <Link to="/notes" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
                    Browse notes
                  </Link>
                }
              />
            ) : (
              <>
                {/* Mobile: stacked order cards */}
                <div className="pf-stagger space-y-3 lg:hidden">
                  {my.data.orders.map((o) => (
                    <Card key={o.id} className="pf-lift space-y-3">
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-fg"
                        >
                          <ReceiptIcon size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-fg">{itemLabel(o.itemCount)}</p>
                          <p className="mt-0.5 text-xs text-muted tabular">{formatDateTime(o.createdAt)}</p>
                          {o.receiptNumber ? (
                            <p className="mt-0.5 text-xs text-muted tabular">{o.receiptNumber}</p>
                          ) : null}
                        </div>
                        <Badge tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</Badge>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
                        <span className="tabular text-lg font-bold text-fg">{formatINR(o.amount)}</span>
                        <ReceiptLink order={o} />
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop: data table */}
                <div className="hidden lg:block">
                  <DataTable columns={columns} rows={my.data.orders} keyField={(o) => o.id} />
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
