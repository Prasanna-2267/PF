import { api } from '../../lib/api';

export type QuestionType = 'mcq' | 'short' | 'long';
export type Difficulty = 'easy' | 'medium' | 'hard';

/** Admin view — includes the answer key. */
export type AdminQuestion = {
  _id: string;
  stageId: string;
  subjectId: string | null;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctOption?: number;
  modelAnswer?: string;
  explanation?: string;
  maxScore: number;
  difficulty: Difficulty;
  order: number;
  isActive: boolean;
};

/** Student view — answer key stripped. */
export type StudentQuestion = {
  id: string;
  stageId: string;
  subjectId: string | null;
  type: QuestionType;
  prompt: string;
  options?: string[];
  maxScore: number;
  difficulty: Difficulty;
};

export type GradeResult = {
  score: number;
  maxScore: number;
  isCorrect?: boolean;
  feedback: string;
  gradedBy: 'auto' | 'ai' | 'heuristic';
  correctOption?: number;
  modelAnswer?: string;
  explanation?: string;
};

export type QuestionStats = {
  attempts: number;
  distinctQuestions: number;
  averagePercent: number;
  mcqAccuracy: number;
};

export type CreateQuestion = {
  stageId: string;
  subjectId?: string | null;
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctOption?: number;
  modelAnswer?: string;
  explanation?: string;
  maxScore?: number;
  difficulty?: Difficulty;
};

export type DraftQuestion = {
  type: QuestionType;
  prompt: string;
  options?: string[];
  correctOption?: number;
  modelAnswer?: string;
  explanation?: string;
  difficulty?: Difficulty;
};

export type GenerateInput = {
  stageId: string;
  subjectId?: string | null;
  topic?: string;
  type: QuestionType | 'mixed';
  difficulty: Difficulty | 'mixed';
  count: number;
};

export const questionsApi = {
  // student
  list: (stageId: string, subjectId?: string) =>
    api
      .get<{ questions: StudentQuestion[] }>('/questions', { params: { stageId, subjectId } })
      .then((r) => r.data.questions),
  answer: (id: string, body: { selectedOption?: number; answerText?: string }) =>
    api.post<GradeResult>(`/questions/${id}/answer`, body).then((r) => r.data),
  stats: (stageId?: string) =>
    api.get<QuestionStats>('/questions/stats', { params: { stageId } }).then((r) => r.data),

  // admin
  adminList: (stageId: string, subjectId?: string) =>
    api
      .get<{ questions: AdminQuestion[] }>('/admin/questions', { params: { stageId, subjectId } })
      .then((r) => r.data.questions),
  create: (d: CreateQuestion) => api.post('/admin/questions', d).then((r) => r.data),
  update: (id: string, d: Partial<CreateQuestion> & { isActive?: boolean }) =>
    api.patch(`/admin/questions/${id}`, d).then((r) => r.data),
  remove: (id: string) => api.delete(`/admin/questions/${id}`).then((r) => r.data),

  // admin AI
  generate: (input: GenerateInput) =>
    api.post<{ drafts: DraftQuestion[] }>('/admin/questions/generate', input).then((r) => r.data.drafts),
  explain: (input: {
    type: QuestionType;
    prompt: string;
    options?: string[];
    correctOption?: number;
    modelAnswer?: string;
  }) =>
    api.post<{ explanation: string }>('/admin/questions/explain', input).then((r) => r.data.explanation),
  bulkCreate: (questions: CreateQuestion[]) =>
    api.post<{ created: number }>('/admin/questions/bulk', { questions }).then((r) => r.data.created),
};
