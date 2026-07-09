import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

/**
 * A study session = one check-in → check-out. An open session (checkOutAt null)
 * is the user's current session. `day` (YYYY-MM-DD) groups sessions for streaks
 * and daily totals.
 */
const studySessionSchema = new Schema(
  {
    // No field-level index: userId-prefixed queries are served by the compound
    // { userId, checkOutAt } index below, and the partial-unique { userId } index
    // enforces one open session. A field `index: true` here would duplicate the latter.
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    checkInAt: { type: Date, required: true },
    checkOutAt: { type: Date, default: null },
    durationMins: { type: Number, default: 0 },
    autoClosed: { type: Boolean, default: false },
    day: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

studySessionSchema.index({ userId: 1, checkOutAt: 1 });
// At most one OPEN session per user — rejects a second concurrent check-in
// (two tabs/devices/retries) that would otherwise double-count live minutes.
studySessionSchema.index(
  { userId: 1 },
  { unique: true, partialFilterExpression: { checkOutAt: null } },
);

export type StudySession = InferSchemaType<typeof studySessionSchema>;
export type StudySessionDoc = HydratedDocument<StudySession>;
export const StudySessionModel = model('StudySession', studySessionSchema);
