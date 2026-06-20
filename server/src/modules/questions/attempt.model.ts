import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { QUESTION_TYPES } from './question.model.js';

const attemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true, index: true },
    stageId: { type: Schema.Types.ObjectId, ref: 'Stage', index: true }, // denormalised for stats
    type: { type: String, enum: QUESTION_TYPES, required: true },

    selectedOption: { type: Number }, // mcq
    answerText: { type: String }, // short / long

    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    isCorrect: { type: Boolean }, // mcq only
    feedback: { type: String },
    gradedBy: { type: String, enum: ['auto', 'ai', 'heuristic'], required: true },
  },
  { timestamps: true },
);

attemptSchema.index({ userId: 1, questionId: 1, createdAt: -1 });

export type QuestionAttempt = InferSchemaType<typeof attemptSchema>;
export type QuestionAttemptDoc = HydratedDocument<QuestionAttempt>;
export const QuestionAttemptModel = model('QuestionAttempt', attemptSchema);
