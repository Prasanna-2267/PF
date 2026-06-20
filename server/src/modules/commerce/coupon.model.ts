import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

/**
 * A discount code. Scope is `all`, specific `packages`, or specific `subjects`
 * (lessons in those subjects). Optional usage cap + expiry. Redemptions are
 * counted only when an order using the coupon is actually paid.
 */
const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percent', 'flat'], required: true },
    discountValue: { type: Number, required: true, min: 0 }, // percent (0–100) or flat ₹

    appliesTo: { type: String, enum: ['all', 'packages', 'subjects'], default: 'all' },
    packageIds: [{ type: Schema.Types.ObjectId, ref: 'Package' }],
    subjectIds: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],

    maxRedemptions: { type: Number, min: 1 }, // optional total cap
    redemptions: { type: Number, default: 0 },
    expiresAt: { type: Date }, // optional

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type Coupon = InferSchemaType<typeof couponSchema>;
export type CouponDoc = HydratedDocument<Coupon>;
export const CouponModel = model('Coupon', couponSchema);
