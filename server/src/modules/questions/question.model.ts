import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

export const QUESTION_TYPES = ['mcq', 'short', 'long'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

const questionSchema = new Schema(
  {
    stageId: { type: Schema.Types.ObjectId, ref: 'Stage', required: true, index: true },
    subjectId: { type: Schema.Types.ObjectId, ref: 'Subject', index: true }, // optional finer scope
    type: { type: String, enum: QUESTION_TYPES, required: true },
    prompt: { type: String, required: true, trim: true },

    // type === 'mcq'
    options: { type: [String], default: undefined },
    correctOption: { type: Number }, // index into options

    // type === 'short' | 'long'
    modelAnswer: { type: String },

    explanation: { type: String }, // revealed after answering
    maxScore: { type: Number, default: 1, min: 1 },
    difficulty: { type: String, enum: DIFFICULTIES, default: 'medium' },

    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export type Question = InferSchemaType<typeof questionSchema>;
export type QuestionDoc = HydratedDocument<Question>;
export const QuestionModel = model('Question', questionSchema);
