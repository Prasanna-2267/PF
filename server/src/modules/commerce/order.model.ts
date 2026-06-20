import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const orderItemSchema = new Schema(
  {
    type: { type: String, enum: ['lesson', 'package'], required: true },
    refId: { type: Schema.Types.ObjectId, required: true },
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
    status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created', index: true },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    idempotencyKey: { type: String }, // dedupes retried "Buy" requests
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
