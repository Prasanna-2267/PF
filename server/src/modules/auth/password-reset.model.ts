import { Schema, model } from 'mongoose';

/**
 * Password-reset codes for existing accounts. Hashed code, attempt-limited,
 * auto-expiring via TTL index. One active reset per email (upserted).
 */
const passwordResetSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, unique: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetModel = model('PasswordReset', passwordResetSchema);
