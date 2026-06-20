import { HttpError } from '../../middleware/error.js';
import { LessonModel } from '../lessons/lesson.model.js';
import {
  createRazorpayOrder,
  getKeyId,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../../services/razorpay.js';
import { getOwnedLessonIds } from './commerce.entitlement.js';
import { CouponModel, type CouponDoc } from './coupon.model.js';
import { OrderModel, type OrderDoc } from './order.model.js';
import { PackageModel, type PackageDoc } from './package.model.js';
import type {
  CreateCouponInput,
  CreateOrderInput,
  CreatePackageInput,
  UpdateCouponInput,
  VerifyPaymentInput,
} from './commerce.validation.js';

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
function checkoutInfo(order: OrderDoc, free = false) {
  return {
    orderId: order.id as string,
    razorpayOrderId: order.razorpayOrderId ?? '',
    amount: order.amount,
    discount: order.discount ?? 0,
    currency: order.currency,
    keyId: getKeyId(),
    free,
  };
}

type ResolvedItem = { type: 'lesson' | 'package'; refId: string; price: number; subjectId?: string };

/** Validate a coupon against the resolved cart and compute the discount (₹). */
async function applyCoupon(code: string, resolved: ResolvedItem[], total: number) {
  const coupon = await CouponModel.findOne({ code: code.toUpperCase().trim(), isActive: true });
  if (!coupon) throw new HttpError(400, 'Invalid coupon code');
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) throw new HttpError(400, 'This coupon has expired');
  if (coupon.maxRedemptions != null && coupon.redemptions >= coupon.maxRedemptions) {
    throw new HttpError(400, 'This coupon has reached its usage limit');
  }

  let eligible = 0;
  if (coupon.appliesTo === 'all') {
    eligible = total;
  } else if (coupon.appliesTo === 'packages') {
    const set = new Set(coupon.packageIds.map((p) => String(p)));
    eligible = resolved.filter((r) => r.type === 'package' && set.has(r.refId)).reduce((s, r) => s + r.price, 0);
  } else {
    const set = new Set(coupon.subjectIds.map((s) => String(s)));
    eligible = resolved
      .filter((r) => r.type === 'lesson' && r.subjectId && set.has(r.subjectId))
      .reduce((s, r) => s + r.price, 0);
  }
  if (eligible <= 0) throw new HttpError(400, 'This coupon is not valid for the selected items');

  let discount =
    coupon.discountType === 'percent' ? (eligible * coupon.discountValue) / 100 : Math.min(coupon.discountValue, eligible);
  discount = Math.min(discount, total);
  return { couponCode: coupon.code, discount };
}

async function redeemCoupon(code: string): Promise<void> {
  await CouponModel.updateOne({ code }, { $inc: { redemptions: 1 } });
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  // Idempotency: a retried "Buy" with the same key reuses the existing order.
  if (input.idempotencyKey) {
    const existing = await OrderModel.findOne({ userId, idempotencyKey: input.idempotencyKey });
    if (existing) return checkoutInfo(existing, existing.status === 'paid' && existing.amount === 0);
  }

  const owned = await getOwnedLessonIds(userId); // guard against paying twice
  const resolved: ResolvedItem[] = [];

  for (const it of input.items) {
    if (it.type === 'lesson') {
      const lesson = await LessonModel.findById(it.id);
      if (!lesson || !lesson.isActive || lesson.type !== 'pdf') throw new HttpError(400, 'Invalid lesson');
      if (lesson.isFree) throw new HttpError(400, 'That lesson is free');
      if (owned.has(String(lesson.id))) throw new HttpError(409, 'You already own this lesson');
      resolved.push({ type: 'lesson', refId: lesson.id as string, price: lesson.price, subjectId: String(lesson.subjectId) });
    } else {
      const pkg = await PackageModel.findById(it.id);
      if (!pkg || !pkg.isActive) throw new HttpError(400, 'Invalid package');
      const lessonIds = pkg.lessonIds.map((l) => String(l));
      if (lessonIds.length > 0 && lessonIds.every((id) => owned.has(id))) {
        throw new HttpError(409, 'You already own everything in this package');
      }
      resolved.push({ type: 'package', refId: pkg.id as string, price: pkg.price });
    }
  }

  const total = resolved.reduce((s, r) => s + r.price, 0);
  if (total <= 0) throw new HttpError(400, 'Nothing to purchase');

  let discountRupees = 0;
  let couponCode: string | undefined;
  if (input.couponCode) {
    const applied = await applyCoupon(input.couponCode, resolved, total);
    discountRupees = applied.discount;
    couponCode = applied.couponCode;
  }

  const amount = Math.round(Math.max(0, total - discountRupees) * 100); // paise
  const discount = Math.round(discountRupees * 100);
  const items = resolved.map((r) => ({ type: r.type, refId: r.refId }));

  // Fully covered by the coupon → grant immediately, no payment needed.
  if (amount <= 0) {
    const order = await OrderModel.create({ userId, items, amount: 0, discount, couponCode, status: 'paid', idempotencyKey: input.idempotencyKey });
    if (couponCode) await redeemCoupon(couponCode);
    return checkoutInfo(order, true);
  }

  let order: OrderDoc;
  try {
    order = await OrderModel.create({ userId, items, amount, discount, couponCode, status: 'created', idempotencyKey: input.idempotencyKey });
  } catch (err) {
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
  const existing = await OrderModel.findOne({ razorpayOrderId: input.razorpay_order_id, userId });
  if (!existing) throw new HttpError(404, 'Order not found');
  // Atomic transition created -> paid; redeem the coupon exactly once.
  const justPaid = await OrderModel.findOneAndUpdate(
    { _id: existing._id, status: { $ne: 'paid' } },
    { $set: { status: 'paid', razorpayPaymentId: input.razorpay_payment_id } },
    { new: true },
  );
  if (justPaid?.couponCode) await redeemCoupon(justPaid.couponCode);
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
    const justPaid = await OrderModel.findOneAndUpdate(
      { razorpayOrderId: entity.order_id, status: { $ne: 'paid' } },
      { $set: { status: 'paid', razorpayPaymentId: entity.id ?? 'webhook' } },
      { new: true },
    );
    if (justPaid?.couponCode) await redeemCoupon(justPaid.couponCode);
  }
}

// ── Coupons (admin) ──
function publicCoupon(c: CouponDoc) {
  return {
    id: c.id as string,
    code: c.code,
    discountType: c.discountType,
    discountValue: c.discountValue,
    appliesTo: c.appliesTo,
    packageIds: c.packageIds.map((p) => String(p)),
    subjectIds: c.subjectIds.map((s) => String(s)),
    maxRedemptions: c.maxRedemptions ?? null,
    redemptions: c.redemptions,
    expiresAt: c.expiresAt ?? null,
    isActive: c.isActive,
  };
}

export async function createCoupon(data: CreateCouponInput) {
  const code = data.code.toUpperCase().trim();
  if (await CouponModel.exists({ code })) throw new HttpError(409, 'A coupon with this code already exists');
  const coupon = await CouponModel.create({
    ...data,
    code,
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
  });
  return publicCoupon(coupon);
}

export async function listCoupons() {
  const coupons = await CouponModel.find().sort({ createdAt: -1 });
  return coupons.map(publicCoupon);
}

export async function updateCoupon(id: string, data: UpdateCouponInput) {
  const patch: Record<string, unknown> = {};
  if (data.isActive !== undefined) patch.isActive = data.isActive;
  if (data.maxRedemptions !== undefined) patch.maxRedemptions = data.maxRedemptions;
  if (data.expiresAt !== undefined) patch.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
  const coupon = await CouponModel.findByIdAndUpdate(id, patch, { new: true });
  if (!coupon) throw new HttpError(404, 'Coupon not found');
  return publicCoupon(coupon);
}

export async function deleteCoupon(id: string): Promise<void> {
  const coupon = await CouponModel.findByIdAndDelete(id);
  if (!coupon) throw new HttpError(404, 'Coupon not found');
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
