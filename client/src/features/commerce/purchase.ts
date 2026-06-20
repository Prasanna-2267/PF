import { commerceApi, type OrderItem } from './commerce.api';
import { openCheckout } from '../../lib/checkout';
import { errorMessage } from '../auth/auth.api';

/**
 * Run a full purchase: create the order (with an optional coupon), open Razorpay
 * checkout, verify on success. If a coupon makes it free, it's granted with no
 * payment. Calls onDone() once granted/verified (caller refetches).
 */
export async function purchase(
  items: OrderItem[],
  onDone: () => void,
  onError: (message: string) => void,
  couponCode?: string,
): Promise<void> {
  try {
    // Stable key for this checkout attempt so retries don't create duplicate orders.
    const order = await commerceApi.createOrder(items, crypto.randomUUID(), couponCode);
    if (order.free) {
      onDone(); // fully covered by the coupon — nothing to pay
      return;
    }
    if (!order.keyId) {
      onError('Payments are not set up yet.');
      return;
    }
    const opened = await openCheckout({
      keyId: order.keyId,
      razorpayOrderId: order.razorpayOrderId,
      amount: order.amount,
      currency: order.currency,
      onSuccess: async (resp) => {
        try {
          await commerceApi.verify(resp);
          onDone();
        } catch (e) {
          onError(errorMessage(e));
        }
      },
    });
    if (!opened) onError('Could not open the payment window. Please try again.');
  } catch (e) {
    onError(errorMessage(e));
  }
}
