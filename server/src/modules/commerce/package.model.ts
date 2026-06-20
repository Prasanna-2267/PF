import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

/** An admin-curated bundle of lessons sold as one purchase. */
const packageSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    lessonIds: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
    price: { type: Number, required: true, min: 0 }, // INR rupees
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type Package = InferSchemaType<typeof packageSchema>;
export type PackageDoc = HydratedDocument<Package>;
export const PackageModel = model('Package', packageSchema);
