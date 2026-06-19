import { Schema, model } from 'mongoose';

/**
 * Forensic trail: who opened which secured lesson, when, from where. Combined
 * with the per-user watermark, this lets a leaked page be traced to an account.
 */
const accessLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    action: { type: String, default: 'view' },
    code: { type: String, index: true }, // forensic ref also baked into the watermark
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true },
);

export const AccessLogModel = model('AccessLog', accessLogSchema);
