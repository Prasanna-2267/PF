import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

const examCategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type ExamCategory = InferSchemaType<typeof examCategorySchema>;
export type ExamCategoryDoc = HydratedDocument<ExamCategory>;
export const ExamCategoryModel = model('ExamCategory', examCategorySchema);
