import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppHeader, Badge, Button, Card, Spinner } from '../components/ui';
import { commerceApi } from '../features/commerce/commerce.api';
import { formatINR } from '../lib/format';

const statusTone = { paid: 'success', created: 'warn', failed: 'danger' } as const;

export function LibraryPage() {
  const navigate = useNavigate();
  const my = useQuery({ queryKey: ['my-purchases'], queryFn: commerceApi.my });

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <AppHeader
        right={
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>Home</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/notes')}>Notes</Button>
          </>
        }
      />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">My Library</h1>
        <p className="mt-1 text-sm text-muted">Your purchases and receipts.</p>

        {my.isLoading && <div className="mt-16 flex justify-center"><Spinner /></div>}

        {my.data && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted">
              You own <span className="font-medium text-ink">{my.data.ownedLessonIds.length}</span> lesson
              {my.data.ownedLessonIds.length === 1 ? '' : 's'}.
            </p>

            {my.data.orders.length === 0 && (
              <Card className="p-6 text-center text-sm text-muted">
                No orders yet. Unlock paid lessons from <button className="text-accent" onClick={() => navigate('/notes')}>Notes</button>.
              </Card>
            )}

            {my.data.orders.map((o) => (
              <Card key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {o.itemCount} item{o.itemCount === 1 ? '' : 's'}
                    <Badge tone={statusTone[o.status]}>{o.status}</Badge>
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {new Date(o.createdAt).toLocaleString('en-IN')}
                    {o.receiptNumber && <span className="ml-2 font-mono">{o.receiptNumber}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm">{formatINR(o.amount)}</span>
                  {o.receiptId ? (
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/receipt/${o.receiptId}`)}>
                      Receipt
                    </Button>
                  ) : (
                    o.status !== 'paid' && <span className="text-xs text-muted">—</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
