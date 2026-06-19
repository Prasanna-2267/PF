import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

/**
 * A signup-in-progress. No real User exists until the email OTP is verified.
 * Each signup attempt is its own document, bound to a one-time session token
 * (the `pf_signup` cookie) so verification can only be completed by the same
 * browser that started signup — closing the pre-verification takeover window.
 * TTL index auto-purges abandoned attempts.
 */
const pendingRegistrationSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    passwordHash: { type: String, required: true },
    otpHash: { type: String, required: true },
    otpAttempts: { type: Number, default: 0 },
    sessionTokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

pendingRegistrationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type PendingRegistration = InferSchemaType<typeof pendingRegistrationSchema>;
export type PendingRegistrationDoc = HydratedDocument<PendingRegistration>;
export const PendingRegistrationModel = model('PendingRegistration', pendingRegistrationSchema);
