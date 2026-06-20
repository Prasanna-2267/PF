import { HttpError } from '../../middleware/error.js';
import { StageModel } from '../content/stage.model.js';
import { SubjectModel } from '../content/subject.model.js';
import { gradeWritten } from '../../services/ai-grade.js';
import { QuestionModel, type Question } from './question.model.js';
import { QuestionAttemptModel } from './attempt.model.js';
import type { CreateQuestionInput, SubmitAnswerInput, UpdateQuestionInput } from './question.validation.js';

const byOrder = { order: 1, createdAt: 1 } as const;

// ── Admin CRUD ────────────────────────────────────────────────────
type ListFilters = { subjectId?: string; type?: string };

export function listQuestionsAdmin(stageId: string, filters: ListFilters = {}) {
  const q: Record<string, unknown> = { stageId };
  if (filters.subjectId) q.subjectId = filters.subjectId;
  if (filters.type) q.type = filters.type;
  return QuestionModel.find(q).sort(byOrder).lean();
}

async function assertScope(stageId: string, subjectId?: string | null): Promise<void> {
  if (!(await StageModel.exists({ _id: stageId }))) throw new HttpError(400, 'Invalid stageId');
  if (subjectId) {
    const subject = await SubjectModel.findById(subjectId).lean();
    if (!subject) throw new HttpError(400, 'Invalid subjectId');
    if (String(subject.stageId) !== String(stageId)) {
      throw new HttpError(400, 'Subject must belong to the same stage');
    }
  }
}

export async function createQuestion(data: CreateQuestionInput, createdBy: string) {
  await assertScope(data.stageId, data.subjectId);
  const maxScore = data.maxScore ?? (data.type === 'mcq' ? 1 : 10);
  return QuestionModel.create({ ...data, maxScore, createdBy });
}

export async function updateQuestion(id: string, data: UpdateQuestionInput) {
  const existing = await QuestionModel.findById(id);
  if (!existing) throw new HttpError(404, 'Question not found');
  if (data.stageId || data.subjectId !== undefined) {
    await assertScope(data.stageId ?? String(existing.stageId), data.subjectId ?? undefined);
  }
  const doc = await QuestionModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  return doc;
}

export async function deleteQuestion(id: string): Promise<void> {
  const doc = await QuestionModel.findByIdAndDelete(id);
  if (!doc) throw new HttpError(404, 'Question not found');
  await QuestionAttemptModel.deleteMany({ questionId: id });
}

// ── Student-facing ────────────────────────────────────────────────
/** Strip everything that would leak the answer before sending to a student. */
function publicQuestion(q: Question & { _id: unknown }) {
  return {
    id: String(q._id),
    stageId: String(q.stageId),
    subjectId: q.subjectId ? String(q.subjectId) : null,
    type: q.type,
    prompt: q.prompt,
    options: q.type === 'mcq' ? q.options ?? [] : undefined,
    maxScore: q.maxScore,
    difficulty: q.difficulty,
  };
}

export async function listForStudent(stageId: string, subjectId?: string) {
  const q: Record<string, unknown> = { stageId, isActive: true };
  if (subjectId) q.subjectId = subjectId;
  const questions = await QuestionModel.find(q).sort(byOrder).lean();
  return questions.map((qq) => publicQuestion(qq as Question & { _id: unknown }));
}

export async function submitAnswer(userId: string, questionId: string, input: SubmitAnswerInput) {
  const q = await QuestionModel.findById(questionId);
  if (!q || !q.isActive) throw new HttpError(404, 'Question not found');

  const maxScore = q.maxScore ?? 1;
  let score: number;
  let feedback: string;
  let gradedBy: 'auto' | 'ai' | 'heuristic';
  let isCorrect: boolean | undefined;

  if (q.type === 'mcq') {
    if (input.selectedOption === undefined) throw new HttpError(400, 'selectedOption is required for MCQ');
    if (input.selectedOption >= (q.options?.length ?? 0)) throw new HttpError(400, 'selectedOption out of range');
    isCorrect = input.selectedOption === q.correctOption;
    score = isCorrect ? maxScore : 0;
    feedback = isCorrect ? 'Correct!' : 'Not quite — see the correct answer below.';
    gradedBy = 'auto';
  } else {
    if (!input.answerText) throw new HttpError(400, 'answerText is required for written questions');
    const result = await gradeWritten({
      prompt: q.prompt,
      modelAnswer: q.modelAnswer ?? '',
      answer: input.answerText,
      maxScore,
    });
    score = result.score;
    feedback = result.feedback;
    gradedBy = result.gradedBy;
  }

  await QuestionAttemptModel.create({
    userId,
    questionId: q._id,
    stageId: q.stageId,
    type: q.type,
    selectedOption: input.selectedOption,
    answerText: input.answerText,
    score,
    maxScore,
    isCorrect,
    feedback,
    gradedBy,
  });

  // Reveal the answer key only AFTER a submission.
  return {
    score,
    maxScore,
    isCorrect,
    feedback,
    gradedBy,
    correctOption: q.type === 'mcq' ? q.correctOption : undefined,
    modelAnswer: q.type !== 'mcq' ? q.modelAnswer : undefined,
    explanation: q.explanation,
  };
}

export async function getStats(userId: string, stageId?: string) {
  const match: Record<string, unknown> = { userId };
  if (stageId) match.stageId = stageId;
  const attempts = await QuestionAttemptModel.find(match).lean();
  const totalScore = attempts.reduce((s, a) => s + a.score, 0);
  const totalMax = attempts.reduce((s, a) => s + a.maxScore, 0);
  const mcq = attempts.filter((a) => a.type === 'mcq');
  return {
    attempts: attempts.length,
    distinctQuestions: new Set(attempts.map((a) => String(a.questionId))).size,
    averagePercent: totalMax ? Math.round((totalScore / totalMax) * 100) : 0,
    mcqAccuracy: mcq.length ? Math.round((mcq.filter((a) => a.isCorrect).length / mcq.length) * 100) : 0,
  };
}
