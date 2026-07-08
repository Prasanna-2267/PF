import { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, useToast } from '../../components/ui';
import { FileTextIcon, LockIcon, PackageIcon, TagIcon } from '../../components/ui/icons';
import { formatRupees } from '../../lib/format';
import { purchase } from './purchase';

export type CheckoutItem = {
  type: 'lesson' | 'package';
  id: string;
  title: string;
  /** List price in rupees (catalog prices are stored in rupees). */
  price: number;
};

/**
 * Purchase flow modal. Collects an optional coupon and runs `purchase()`, which
 * handles createOrder → Razorpay → verify (incl. the free/fully-discounted path
 * where access is granted with no payment). The CALLER invalidates queries in
 * `onPurchased`.
 */
export function CheckoutModal({
  open,
  onClose,
  item,
  onPurchased,
}: {
  open: boolean;
  onClose: () => void;
  item: CheckoutItem;
  onPurchased: () => void;
}) {
  const { success } = useToast();
  const [coupon, setCoupon] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Reset transient state each time the modal (re)opens.
  useEffect(() => {
    if (open) {
      setError('');
      setProcessing(false);
    }
  }, [open]);

  async function pay() {
    setError('');
    setProcessing(true);
    await purchase(
      [{ type: item.type, id: item.id }],
      () => {
        // Reached on both a verified payment and a fully-discounted grant.
        success('Purchase complete', { description: `${item.title} is now yours.` });
        setProcessing(false);
        onPurchased();
        onClose();
      },
      (message) => {
        setError(message);
        setProcessing(false);
      },
      coupon.trim() || undefined,
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Checkout"
      description="Secure one-time purchase."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={processing} onClick={() => void pay()}>
            Pay {formatRupees(item.price)}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-card border border-line bg-sunken p-3.5">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-fg"
            aria-hidden="true"
          >
            {item.type === 'package' ? <PackageIcon size={18} /> : <FileTextIcon size={18} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">{item.title}</p>
            <p className="mt-0.5 text-xs text-muted">
              {item.type === 'package' ? 'Lesson package' : 'Single lesson'}
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold tabular text-fg">{formatRupees(item.price)}</span>
        </div>

        <Input
          label="Coupon code"
          placeholder="Have a code? (optional)"
          value={coupon}
          onChange={(e) => setCoupon(e.target.value)}
          leftIcon={<TagIcon size={16} />}
          autoComplete="off"
        />

        <div className="space-y-1.5 border-t border-line pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="font-semibold tabular text-fg">{formatRupees(item.price)}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold text-fg">Total due</span>
            <span className="font-display text-2xl font-extrabold tabular text-gold-strong">
              {formatRupees(item.price)}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted">
          Coupons are applied at payment. A valid code may lower the total — a full discount grants
          access instantly with no charge.
        </p>

        <div className="flex items-start gap-3 rounded-card border border-line bg-sunken p-3.5">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-soft-fg"
            aria-hidden="true"
          >
            <LockIcon size={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-fg">Buy once, own forever</p>
            <p className="mt-0.5 text-xs text-muted">
              Lifetime access to this {item.type === 'package' ? 'package' : 'lesson'}. No
              subscription, no expiry.
            </p>
          </div>
        </div>

        {error ? (
          <Alert tone="danger" title="Payment could not be completed">
            {error}
          </Alert>
        ) : null}
      </div>
    </Modal>
  );
}
