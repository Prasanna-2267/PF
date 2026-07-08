import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const orderItemSchema = new Schema(
  {
    type: { type: String, enum: ['lesson', 'package'], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
    // Snapshot at purchase time so a receipt stays correct even if the lesson/
    // package is later renamed, repriced, or deleted.
    title: { type: String },
    price: { type: Number }, // paise, list price for this line
  },
  { _id: false },
);

/**
 * Immutable record of a purchase. Entitlements are computed from PAID orders
 * (own a lesson directly, or own a package that currently contains it).
 */
const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    amount: { type: Number, required: true }, // paise
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    idempotencyKey: { type: String }, // dedupes retried "Buy" requests
    couponCode: { type: String },
    discount: { type: Number, default: 0 }, // paise discounted off the total
    // How the order came to exist: a real purchase, or a complimentary admin grant (amount 0).
    source: { type: String, enum: ['purchase', 'admin_grant'], default: 'purchase' },
    refundedAt: { type: Date }, // set when an admin revokes/refunds (access recomputes away)
    refundedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// One order per (user, idempotency key) — a retried request reuses the order.
orderSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
);

export type Order = InferSchemaType<typeof orderSchema>;
export type OrderDoc = HydratedDocument<Order>;
export const OrderModel = model('Order', orderSchema);
