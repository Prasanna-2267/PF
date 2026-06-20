import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const receiptLineSchema = new Schema(
  {
    type: { type: String, enum: ['lesson', 'package'], required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true }, // paise
  },
  { _id: false },
);

/**
 * Immutable receipt for a paid order. Generated once when an order transitions
 * to "paid" (via verify, webhook, or full-coupon). All amounts in paise.
 */
const receiptSchema = new Schema(
  {
    receiptNumber: { type: String, required: true, unique: true }, // e.g. PF-2026-0042
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyer: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
    lines: { type: [receiptLineSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: String },
    total: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    razorpayPaymentId: { type: String },
    paidAt: { type: Date, required: true },
  },
  { timestamps: true },
);

export type Receipt = InferSchemaType<typeof receiptSchema>;
export type ReceiptDoc = HydratedDocument<Receipt>;
export const ReceiptModel = model('Receipt', receiptSchema);
