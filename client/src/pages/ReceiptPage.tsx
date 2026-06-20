import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppHeader, Button, Card, Spinner } from '../components/ui';
import { commerceApi } from '../features/commerce/commerce.api';
import { formatINR } from '../lib/format';

export function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const receipt = useQuery({
    queryKey: ['receipt', id],
    queryFn: () => commerceApi.receipt(id!),
    enabled: !!id,
  });
  const r = receipt.data;

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <AppHeader
        right={
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate('/library')}>
              Library
            </Button>
            {r && (
              <Button variant="secondary" size="sm" onClick={() => window.print()}>
                Print / Save PDF
              </Button>
            )}
          </>
        }
      />

      <main className="mx-auto max-w-xl px-6 py-8">
        {receipt.isLoading && (
          <div className="mt-16 flex justify-center"><Spinner /></div>
        )}
        {receipt.isError && <p className="text-sm text-danger">Receipt not found.</p>}

        {r && (
          <Card className="p-6 print:border-0 print:shadow-none">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display text-xl font-semibold tracking-tight">Parallax Flow</h1>
                <p className="text-sm text-muted">Payment receipt</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm font-medium">{r.receiptNumber}</p>
                <p className="text-xs text-muted">{new Date(r.paidAt).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="mt-4 border-t border-line pt-4 text-sm">
              <p className="text-xs uppercase tracking-wide text-muted">Billed to</p>
              <p className="mt-1 font-medium">{r.buyer.name ?? '—'}</p>
              <p className="text-muted">{r.buyer.email ?? ''}</p>
              {r.buyer.phone && <p className="text-muted">{r.buyer.phone}</p>}
            </div>

            <table className="mt-5 w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="py-2 font-medium">Item</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {r.lines.map((l, i) => (
                  <tr key={i} className="border-b border-line/60">
                    <td className="py-2">
                      {l.title} <span className="text-xs text-muted">({l.type})</span>
                    </td>
                    <td className="py-2 text-right font-mono">{formatINR(l.price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {r.discount > 0 && (
                  <tr>
                    <td className="py-1 text-muted">
                      Discount{r.couponCode ? ` (${r.couponCode})` : ''}
                    </td>
                    <td className="py-1 text-right font-mono text-muted">−{formatINR(r.discount)}</td>
                  </tr>
                )}
                <tr>
                  <td className="pt-3 font-medium">Total paid</td>
                  <td className="pt-3 text-right font-mono text-base font-semibold">{formatINR(r.total)}</td>
                </tr>
              </tfoot>
            </table>

            {r.razorpayPaymentId && (
              <p className="mt-4 text-xs text-muted">Payment id: {r.razorpayPaymentId} · Razorpay</p>
            )}
            <p className="mt-1 text-xs text-muted">Thank you for your purchase.</p>
          </Card>
        )}
      </main>
    </div>
  );
}
