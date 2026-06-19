import { Schema, model } from 'mongoose';

/** A completed lesson for a user. Absence of a row = not completed. */
const progressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    status: { type: String, enum: ['completed'], default: 'completed' },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

progressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export const ProgressModel = model('Progress', progressSchema);
