import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

/**
 * Subjects form a tree within a stage: a top-level subject has
 * `parentSubjectId = null`; sub-subjects point to their parent. Unlimited
 * nesting (e.g. Taxation → Direct Tax / Indirect Tax).
 */
const subjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    stageId: { type: Schema.Types.ObjectId, ref: 'Stage', required: true, index: true },
    parentSubjectId: { type: Schema.Types.ObjectId, ref: 'Subject', default: null, index: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type Subject = InferSchemaType<typeof subjectSchema>;
export type SubjectDoc = HydratedDocument<Subject>;
export const SubjectModel = model('Subject', subjectSchema);
