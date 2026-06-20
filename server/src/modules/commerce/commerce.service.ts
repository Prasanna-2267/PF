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
export async function createOrder(userId: string, input: CreateOrderInput) {
  let rupees = 0;
  const items: { type: 'lesson' | 'package'; refId: string }[] = [];

  for (const it of input.items) {
    if (it.type === 'lesson') {
      const lesson = await LessonModel.findById(it.id);
      if (!lesson || !lesson.isActive || lesson.type !== 'pdf') throw new HttpError(400, 'Invalid lesson');
      if (lesson.isFree) throw new HttpError(400, 'That lesson is free');
      rupees += lesson.price;
      items.push({ type: 'lesson', refId: lesson.id as string });
    } else {
      const pkg = await PackageModel.findById(it.id);
      if (!pkg || !pkg.isActive) throw new HttpError(400, 'Invalid package');
      rupees += pkg.price;
      items.push({ type: 'package', refId: pkg.id as string });
    }
  }

  if (rupees <= 0) throw new HttpError(400, 'Nothing to purchase');
  const amount = Math.round(rupees * 100); // paise

  const order = await OrderModel.create({ userId, items, amount, status: 'created' });
  const rzp = await createRazorpayOrder(amount, String(order.id));
  order.razorpayOrderId = rzp.id;
  await order.save();

  return { orderId: order.id as string, razorpayOrderId: rzp.id, amount, currency: 'INR', keyId: getKeyId() };
}

async function markPaid(order: OrderDoc, paymentId: string): Promise<void> {
  if (order.status === 'paid') return; // idempotent
  order.status = 'paid';
  order.razorpayPaymentId = paymentId;
  await order.save();
}

export async function verifyPayment(userId: string, input: VerifyPaymentInput) {
  if (!verifyPaymentSignature(input.razorpay_order_id, input.razorpay_payment_id, input.razorpay_signature)) {
    throw new HttpError(400, 'Invalid payment signature');
  }
  const order = await OrderModel.findOne({ razorpayOrderId: input.razorpay_order_id, userId });
  if (!order) throw new HttpError(404, 'Order not found');
  await markPaid(order, input.razorpay_payment_id);
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
    const order = await OrderModel.findOne({ razorpayOrderId: entity.order_id });
    if (order) await markPaid(order, entity.id ?? 'webhook');
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
