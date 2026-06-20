import { Schema, model } from 'mongoose';

/** How many times a user has revised a given lesson. */
const revisionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    count: { type: Number, default: 0 },
    lastRevisedAt: { type: Date },
  },
  { timestamps: true },
);

revisionSchema.index({ userId: 1, lessonId: 1 }, { unique: true });

export const RevisionModel = model('Revision', revisionSchema);
