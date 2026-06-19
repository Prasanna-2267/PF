import { Schema, model } from 'mongoose';

/**
 * One-time email verification codes. Documents auto-expire via a TTL index on
 * `expiresAt`, so MongoDB cleans them up — no Redis needed.
 */
const otpSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ['email_verify'], default: 'email_verify' },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpModel = model('Otp', otpSchema);
