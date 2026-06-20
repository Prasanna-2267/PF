import type { RazorpayResult } from '../features/commerce/commerce.api';

type RazorpayOptions = {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  handler: (r: RazorpayResult) => void;
  modal?: { ondismiss?: () => void };
  theme?: { color?: string };
};
interface RazorpayInstance {
  open(): void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<boolean> | null = null;
function loadScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  scriptPromise ??= new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
  return scriptPromise;
}

/** Open the Razorpay checkout widget. Returns false if it couldn't be opened. */
export async function openCheckout(opts: {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  onSuccess: (r: RazorpayResult) => void;
  onDismiss?: () => void;
}): Promise<boolean> {
  const ok = await loadScript();
  if (!ok || !window.Razorpay) return false;
  const rzp = new window.Razorpay({
    key: opts.keyId,
    order_id: opts.razorpayOrderId,
    amount: opts.amount,
    currency: opts.currency,
    name: 'Parallax Flow',
    description: 'Lesson purchase',
    handler: opts.onSuccess,
    modal: { ondismiss: opts.onDismiss },
    theme: { color: '#1e3a8a' },
  });
  rzp.open();
  return true;
}
