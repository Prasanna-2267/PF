import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const stageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    examCategoryId: { type: Schema.Types.ObjectId, ref: 'ExamCategory', required: true, index: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type Stage = InferSchemaType<typeof stageSchema>;
export type StageDoc = HydratedDocument<Stage>;
export const StageModel = model('Stage', stageSchema);
