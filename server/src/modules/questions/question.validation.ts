import { z } from 'zod';
import { QUESTION_TYPES, DIFFICULTIES } from './question.model.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

const baseQuestion = z.object({
  stageId: objectId,
  subjectId: objectId.nullable().optional(),
  type: z.enum(QUESTION_TYPES),
  prompt: z.string().min(1).max(4000),
  options: z.array(z.string().min(1).max(500)).min(2).max(8).optional(),
  correctOption: z.number().int().min(0).optional(),
  modelAnswer: z.string().max(8000).optional(),
  explanation: z.string().max(4000).optional(),
  maxScore: z.number().int().min(1).max(100).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  order: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/** Type-specific rules: MCQ needs options + a valid correct index; written needs a model answer. */
function refineByType(data: z.infer<typeof baseQuestion>, ctx: z.RefinementCtx): void {
  if (data.type === 'mcq') {
    if (!data.options || data.options.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'MCQ needs at least 2 options', path: ['options'] });
      return;
    }
    if (data.correctOption === undefined || data.correctOption >= data.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'correctOption must index a valid option',
        path: ['correctOption'],
      });
    }
  } else if (!data.modelAnswer || data.modelAnswer.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A model answer is required for short/long questions',
      path: ['modelAnswer'],
    });
  }
}

export const createQuestionSchema = baseQuestion.superRefine(refineByType);

// For updates we only re-check type rules when type is present; partial fields
// otherwise pass through untouched.
export const updateQuestionSchema = baseQuestion
  .partial()
  .superRefine((data, ctx) => {
    if (data.type) refineByType(data as z.infer<typeof baseQuestion>, ctx);
  });

export const submitAnswerSchema = z
  .object({
    selectedOption: z.number().int().min(0).optional(),
    answerText: z.string().min(1).max(8000).optional(),
  })
  .refine((d) => d.selectedOption !== undefined || (d.answerText && d.answerText.trim().length > 0), {
    message: 'Provide selectedOption (MCQ) or answerText (written)',
  });

// ── AI: generate drafts / explanation / bulk-save reviewed drafts ──
export const generateSchema = z.object({
  stageId: objectId,
  subjectId: objectId.nullable().optional(),
  topic: z.string().max(200).optional(),
  type: z.enum(['mcq', 'short', 'long', 'mixed']),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']),
  count: z.number().int().min(1).max(15),
});

export const explainSchema = z.object({
  type: z.enum(QUESTION_TYPES),
  prompt: z.string().min(1).max(4000),
  options: z.array(z.string().max(500)).max(8).optional(),
  correctOption: z.number().int().min(0).optional(),
  modelAnswer: z.string().max(8000).optional(),
});

/** Admin bulk-saves reviewed AI drafts — each item is a full, validated question. */
export const bulkCreateSchema = z.object({
  questions: z.array(createQuestionSchema).min(1).max(30),
});

export type GenerateInput = z.infer<typeof generateSchema>;
export type ExplainInput = z.infer<typeof explainSchema>;
export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
