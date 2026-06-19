import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const LESSON_TYPES = ['pdf', 'ism'] as const;
export type LessonType = (typeof LESSON_TYPES)[number];

const lessonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', required: true, index: true },
    type: { type: String, enum: LESSON_TYPES, required: true },

    // type === 'pdf' (secured)
    fileKey: { type: String }, // private storage key — never exposed to clients
    originalName: { type: String },
    pageCount: { type: Number },
    sizeBytes: { type: Number },

    // type === 'ism' (free government link)
    externalUrl: { type: String },

    // commerce (Phase 4)
    price: { type: Number, default: 0, min: 0 },
    isFree: { type: Boolean, default: false },

    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export type Lesson = InferSchemaType<typeof lessonSchema>;
export type LessonDoc = HydratedDocument<Lesson>;
export const LessonModel = model('Lesson', lessonSchema);
