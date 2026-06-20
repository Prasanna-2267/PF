import { HttpError } from '../../middleware/error.js';
import { logger } from '../../lib/logger.js';
import { sendReceiptEmail } from '../../services/mail.js';
import { UserModel } from '../auth/user.model.js';
import { LessonModel } from '../lessons/lesson.model.js';
import { PackageModel } from './package.model.js';
import { nextSeq } from './counter.model.js';
import { ReceiptModel, type ReceiptDoc } from './receipt.model.js';
import type { OrderDoc } from './order.model.js';

function publicReceipt(r: ReceiptDoc | (import('./receipt.model.js').Receipt & { _id: unknown })) {
  return {
    id: String((r as { _id: unknown })._id),
    receiptNumber: r.receiptNumber,
    orderId: String(r.orderId),
    buyer: r.buyer,
    lines: r.lines.map((l) => ({ type: l.type, title: l.title, price: l.price })),
    subtotal: r.subtotal,
    discount: r.discount,
    couponCode: r.couponCode ?? null,
    total: r.total,
    currency: r.currency,
    razorpayPaymentId: r.razorpayPaymentId ?? null,
    paidAt: r.paidAt,
  };
}

/** Resolve a line's title/price, preferring the order-time snapshot. */
async function resolveLine(item: { type: 'lesson' | 'package'; refId: unknown; title?: string; price?: number }) {
  if (item.title && item.price != null) {
    return { type: item.type, title: item.title, price: item.price };
  }
  if (item.type === 'lesson') {
    const l = await LessonModel.findById(item.refId).lean();
    return { type: item.type, title: l?.title ?? 'Lesson', price: Math.round((l?.price ?? 0) * 100) };
  }
  const p = await PackageModel.findById(item.refId).lean();
  return { type: item.type, title: p?.title ?? 'Package', price: Math.round((p?.price ?? 0) * 100) };
}

/**
 * Create the receipt for a freshly-paid order. Idempotent (one per order) and
 * non-fatal: any failure is logged but never thrown, so it can't break the
 * payment transition that calls it. Returns the receipt, or null on failure.
 */
export async function generateReceiptForOrder(order: OrderDoc): Promise<ReceiptDoc | null> {
  try {
    const existing = await ReceiptModel.findOne({ orderId: order._id });
    if (existing) return existing;

    const lines = await Promise.all(order.items.map((it) => resolveLine(it as never)));
    const total = order.amount;
    const discount = order.discount ?? 0;
    const subtotal = total + discount;

    const user = await UserModel.findById(order.userId).lean();
    const year = new Date().getFullYear();
    const seq = await nextSeq(`receipt-${year}`);
    const receiptNumber = `PF-${year}-${String(seq).padStart(4, '0')}`;

    let receipt: ReceiptDoc;
    try {
      receipt = await ReceiptModel.create({
        receiptNumber,
        orderId: order._id,
        userId: order.userId,
        buyer: { name: user?.name, email: user?.email, phone: user?.phone },
        lines,
        subtotal,
        discount,
        couponCode: order.couponCode,
        total,
        currency: order.currency,
        razorpayPaymentId: order.razorpayPaymentId,
        paidAt: order.updatedAt ?? new Date(),
      });
    } catch (err) {
      // Lost a race with the other paid-transition path — return the winner.
      if ((err as { code?: number }).code === 11000) {
        return ReceiptModel.findOne({ orderId: order._id });
      }
      throw err;
    }

    if (user?.email) {
      await sendReceiptEmail(user.email, publicReceipt(receipt)).catch((err) =>
        logger.warn({ err }, 'Failed to send receipt email'),
      );
    }
    return receipt;
  } catch (err) {
    logger.warn({ err, orderId: String(order._id) }, 'Failed to generate receipt');
    return null;
  }
}

export async function listReceipts(userId: string) {
  const receipts = await ReceiptModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return receipts.map((r) => publicReceipt(r as never));
}

export async function getReceipt(userId: string, id: string) {
  const receipt = await ReceiptModel.findById(id).lean();
  if (!receipt || String(receipt.userId) !== String(userId)) throw new HttpError(404, 'Receipt not found');
  return publicReceipt(receipt as never);
}

export type PublicReceipt = ReturnType<typeof publicReceipt>;
