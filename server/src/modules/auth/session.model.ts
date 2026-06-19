import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

/**
 * Active login sessions. Single-device enforcement = at most one session per
 * user: on each login we delete the user's existing sessions and create a new
 * one, so the previous device's next request finds no session and is rejected.
 * TTL index on `expiresAt` auto-purges stale sessions.
 */
const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceId: { type: String, required: true },
    refreshTokenHash: { type: String, required: true },
    ip: { type: String },
    userAgent: { type: String },
    expiresAt: { type: Date, required: true },
    lastActiveAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1, deviceId: 1 });

export type Session = InferSchemaType<typeof sessionSchema>;
export type SessionDoc = HydratedDocument<Session>;
export const SessionModel = model('Session', sessionSchema);
