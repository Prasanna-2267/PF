import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Badge,
  Button,
  buttonClasses,
  Card,
  Divider,
  ErrorState,
  Skeleton,
  ArrowLeftIcon,
  CheckCircleIcon,
  ReceiptIcon,
} from '../components/ui';
import { EyeMark } from '../components/brand';
import { commerceApi, type Receipt } from '../features/commerce/commerce.api';
import { errorMessage } from '../features/auth/auth.api';
import { formatINR } from '../lib/format';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });
}

/** Force clean, theme-independent colours for the printed receipt. */
const PRINT_STYLES = `
@media print {
  .pf-receipt, .pf-receipt * {
    background: transparent !important;
    color: #11131a !important;
    border-color: #d4d9e4 !important;
    box-shadow: none !important;
  }
  .pf-receipt { background: #ffffff !important; }
}
`;

function TotalRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={muted ? 'text-muted' : 'text-fg'}>{label}</span>
      <span className={muted ? 'tabular text-muted' : 'tabular font-medium text-fg'}>{value}</span>
    </div>
  );
}

function ReceiptBody({ r }: { r: Receipt }) {
  return (
    <Card flush className="pf-receipt mx-auto max-w-xl overflow-hidden print:border print:shadow-none">
      <style>{PRINT_STYLES}</style>

      {/* Identity + receipt number — navy brand band (degrades to plain text in print) */}
      <div className="pf-hero px-4 py-5 sm:px-6">
        <span className="pf-hero-ring -right-14 -top-24 h-64 w-64 print:hidden" aria-hidden="true" />
        <span className="pf-hero-ring-gold -right-8 -top-12 h-36 w-36 print:hidden" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 text-white">
              <EyeMark size={24} />
              <span className="font-display text-lg font-extrabold leading-none tracking-tight">
                Parallax&nbsp;Flow
              </span>
            </span>
            <p className="mt-2 text-sm text-white/70">Payment receipt</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">
              Receipt no.
            </p>
            <p className="font-display text-lg font-bold tabular text-gold-400">{r.receiptNumber}</p>
            <p className="mt-1 text-xs tabular text-white/60">{formatDateTime(r.paidAt)}</p>
          </div>
        </div>
        <span
          className="relative mt-5 block h-px bg-gradient-to-r from-gold-400/70 via-gold-400/25 to-transparent"
          aria-hidden="true"
        />
      </div>

      <div className="p-4 sm:p-6">
        <Badge tone="success" icon={<CheckCircleIcon size={14} />}>
          Paid
        </Badge>

        <Divider className="my-5" />

        {/* Billed to */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Billed to</p>
          <p className="mt-1 font-semibold text-fg">{r.buyer.name ?? '—'}</p>
          {r.buyer.email ? <p className="text-sm text-muted">{r.buyer.email}</p> : null}
          {r.buyer.phone ? <p className="text-sm text-muted tabular">{r.buyer.phone}</p> : null}
        </div>

        {/* Line items */}
        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="py-2 font-semibold">Item</th>
              <th scope="col" className="py-2 text-right font-semibold">Price</th>
            </tr>
          </thead>
          <tbody>
            {r.lines.map((l, i) => (
              <tr key={i} className="break-inside-avoid border-b border-line">
                <td className="py-3 pr-3">
                  <span className="font-medium text-fg">{l.title}</span>
                  <Badge tone="neutral" size="sm" className="ml-2 align-middle">
                    {l.type === 'package' ? 'Package' : 'Lesson'}
                  </Badge>
                </td>
                <td className="py-3 text-right align-top tabular font-medium text-fg">{formatINR(l.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-5 ml-auto w-full max-w-xs space-y-2 text-sm">
          <TotalRow label="Subtotal" value={formatINR(r.subtotal)} />
          {r.discount > 0 ? (
            <TotalRow
              label={r.couponCode ? `Discount (${r.couponCode})` : 'Discount'}
              value={`−${formatINR(r.discount)}`}
              muted
            />
          ) : null}
          <div className="flex items-center justify-between gap-4 border-t border-line pt-2">
            <span className="font-semibold text-fg">Total paid</span>
            <span className="font-display text-xl font-bold tabular text-fg">{formatINR(r.total)}</span>
          </div>
        </div>

        <Divider className="my-5" />

        {r.razorpayPaymentId ? (
          <p className="text-xs text-muted">
            Payment reference: <span className="tabular">{r.razorpayPaymentId}</span> · Razorpay
          </p>
        ) : null}
        <p className="mt-1 text-xs text-muted">
          Buy once, own forever. This is a computer-generated receipt for your records.
        </p>
      </div>
    </Card>
  );
}

export function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const receipt = useQuery({
    queryKey: ['commerce', 'receipt', id],
    queryFn: () => commerceApi.receipt(id!),
    enabled: !!id,
  });

  return (
    <>
      {/* Nav + actions — hidden when printing */}
      <div className="no-print mb-5 flex items-center justify-between gap-3">
        <Link
          to="/library"
          className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'gap-1.5' })}
        >
          <ArrowLeftIcon size={16} />
          Back to Library
        </Link>
        {receipt.data ? (
          <Button variant="secondary" size="sm" leftIcon={<ReceiptIcon size={16} />} onClick={() => window.print()}>
            Print / Save PDF
          </Button>
        ) : null}
      </div>

      {receipt.isLoading ? (
        <Card className="mx-auto max-w-xl space-y-4">
          <Skeleton shape="block" className="h-8 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton shape="block" className="h-24" />
          <Skeleton shape="block" className="h-16" />
        </Card>
      ) : receipt.isError ? (
        <ErrorState
          title="Receipt unavailable"
          message={errorMessage(receipt.error, 'We could not find this receipt.')}
          onRetry={() => void receipt.refetch()}
          className="mx-auto max-w-xl"
        />
      ) : receipt.data ? (
        <ReceiptBody r={receipt.data} />
      ) : null}
    </>
  );
}
