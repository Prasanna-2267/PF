import { HttpError } from '../../middleware/error.js';
import { LessonModel } from '../lessons/lesson.model.js';
import {
  createRazorpayOrder,
  getKeyId,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../../services/razorpay.js';
import { getOwnedLessonIds } from './commerce.entitlement.js';
import { OrderModel, type OrderDoc } from './order.model.js';
import { PackageModel, type PackageDoc } from './package.model.js';
import type { CreateOrderInput, CreatePackageInput, VerifyPaymentInput } from './commerce.validation.js';

function publicPackage(p: PackageDoc) {
  return {
    id: p.id as string,
    title: p.title,
    description: p.description,
    price: p.price,
    lessonCount: p.lessonIds.length,
    lessonIds: p.lessonIds.map((l) => String(l)),
    isActive: p.isActive,
  };
}

// ── Packages (admin) ──
export async function createPackage(data: CreatePackageInput) {
  const count = await LessonModel.countDocuments({ _id: { $in: data.lessonIds } });
  if (count !== data.lessonIds.length) throw new HttpError(400, 'One or more lessons are invalid');
  return publicPackage(await PackageModel.create(data));
}

export async function updatePackage(id: string, data: Partial<CreatePackageInput>) {
  const pkg = await PackageModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!pkg) throw new HttpError(404, 'Package not found');
  return publicPackage(pkg);
}

export async function deletePackage(id: string): Promise<void> {
  const pkg = await PackageModel.findByIdAndDelete(id);
  if (!pkg) throw new HttpError(404, 'Package not found');
}

export async function listPackages(includeInactive = false) {
  const filter = includeInactive ? {} : { isActive: true };
  const pkgs = await PackageModel.find(filter).sort({ createdAt: -1 });
  return pkgs.map(publicPackage);
}

// ── Checkout ──
function checkoutInfo(order: OrderDoc) {
  return {
    orderId: order.id as string,
    razorpayOrderId: order.razorpayOrderId ?? '',
    amount: order.amount,
    currency: order.currency,
    keyId: getKeyId(),
  };
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  // Idempotency: a retried "Buy" with the same key reuses the existing order.
  if (input.idempotencyKey) {
    const existing = await OrderModel.findOne({ userId, idempotencyKey: input.idempotencyKey });
    if (existing) return checkoutInfo(existing);
  }

  let rupees = 0;
  const items: { type: 'lesson' | 'package'; refId: string }[] = [];
  const owned = await getOwnedLessonIds(userId); // guard against paying twice

  for (const it of input.items) {
    if (it.type === 'lesson') {
      const lesson = await LessonModel.findById(it.id);
      if (!lesson || !lesson.isActive || lesson.type !== 'pdf') throw new HttpError(400, 'Invalid lesson');
      if (lesson.isFree) throw new HttpError(400, 'That lesson is free');
      if (owned.has(String(lesson.id))) throw new HttpError(409, 'You already own this lesson');
      rupees += lesson.price;
      items.push({ type: 'lesson', refId: lesson.id as string });
    } else {
      const pkg = await PackageModel.findById(it.id);
      if (!pkg || !pkg.isActive) throw new HttpError(400, 'Invalid package');
      const lessonIds = pkg.lessonIds.map((l) => String(l));
      if (lessonIds.length > 0 && lessonIds.every((id) => owned.has(id))) {
        throw new HttpError(409, 'You already own everything in this package');
      }
      rupees += pkg.price;
      items.push({ type: 'package', refId: pkg.id as string });
    }
  }

  if (rupees <= 0) throw new HttpError(400, 'Nothing to purchase');
  const amount = Math.round(rupees * 100); // paise

  let order: OrderDoc;
  try {
    order = await OrderModel.create({ userId, items, amount, status: 'created', idempotencyKey: input.idempotencyKey });
  } catch (err) {
    // Lost the race on the same idempotency key — return the winning order.
    if ((err as { code?: number }).code === 11000 && input.idempotencyKey) {
      const existing = await OrderModel.findOne({ userId, idempotencyKey: input.idempotencyKey });
      if (existing) return checkoutInfo(existing);
    }
    throw err;
  }

  const rzp = await createRazorpayOrder(amount, String(order.id), input.idempotencyKey);
  order.razorpayOrderId = rzp.id;
  await order.save();
  return checkoutInfo(order);
}

export async function verifyPayment(userId: string, input: VerifyPaymentInput) {
  if (!verifyPaymentSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
    throw new HttpError(400, 'Invalid payment signature');
  }
  // Atomic + idempotent: setting an already-paid order to paid is a no-op.
  const order = await OrderModel.findOneAndUpdate(
    { razorpayOrderId: input.razorpay_order_id, userId },
    { $set: { status: 'paid', razorpayPaymentId: input.razorpay_payment_id } },
    { new: true },
  );
  if (!order) throw new HttpError(404, 'Order not found');
  return { ok: true };
}

/** Razorpay webhook (reliability backup for the client verify call). */
export async function handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
  if (!verifyWebhookSignature(rawBody, signature)) throw new HttpError(400, 'Invalid webhook signature');
  const event = JSON.parse(rawBody.toString('utf8')) as {
    event?: string;
    payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
  };
  const entity = event.payload?.payment?.entity;
  if (event.event === 'payment.captured' && entity?.order_id) {
    // Only act if not already paid (don't clobber the verify result).
    await OrderModel.findOneAndUpdate(
      { razorpayOrderId: entity.order_id, status: { $ne: 'paid' } },
      { $set: { status: 'paid', razorpayPaymentId: entity.id ?? 'webhook' } },
    );
  }
}

// ── Library ──
export async function myPurchases(userId: string) {
  const ownedLessonIds = [...(await getOwnedLessonIds(userId))];
  const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return {
    ownedLessonIds,
    orders: orders.map((o) => ({
      id: String(o._id),
      amount: o.amount,
      currency: o.currency,
      status: o.status,
      itemCount: o.items.length,
      createdAt: o.createdAt,
    })),
  };
}
