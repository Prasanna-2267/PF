import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

/**
 * A study session = one check-in → check-out. An open session (checkOutAt null)
 * is the user's current session. `day` (YYYY-MM-DD) groups sessions for streaks
 * and daily totals.
 */
const studySessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    checkInAt: { type: Date, required: true },
    checkOutAt: { type: Date, default: null },
    durationMins: { type: Number, default: 0 },
    autoClosed: { type: Boolean, default: false },
    day: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

studySessionSchema.index({ userId: 1, checkOutAt: 1 });

export type StudySession = InferSchemaType<typeof studySessionSchema>;
export type StudySessionDoc = HydratedDocument<StudySession>;
export const StudySessionModel = model('StudySession', studySessionSchema);
