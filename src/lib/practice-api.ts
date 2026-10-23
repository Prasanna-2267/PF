import { api } from '@/lib/api';

export type PracticeMode = 'MCQ' | 'CASE_STUDY' | 'QUESTION_BANK' | 'WRONG_ANSWERS' | 'REVISIT';
export type PracticeHistoryCategory = 'MCQ' | 'QUESTION_BANK' | 'CASE_STUDY';
export type SourceKind = 'ARCHIVE';
export type AnswerFormat = 'MCQ' | 'CASE_STUDY';
export type PracticeModeCard = { id: PracticeMode; title: string; description: string; availableCount: number; locked: boolean };
export type PracticeModes = { course: { id: string; code: string; name: string }; modes: PracticeModeCard[] };
export type PracticeScopeItem = { id: string; parentId?: string | null; kind: 'MATERIAL' | 'TOPIC'; title: string; subtitle: string; description?: string | null; accessType?: 'FREE' | 'PAID'; questionCount: number };
export type PracticeMaterialFolder = { id: string; parentId: string | null; kind: 'FOLDER'; title: string; subtitle: string; questionCount: number; children: PracticeMaterialTreeNode[] };
export type PracticeMaterialTreeNode = PracticeScopeItem | PracticeMaterialFolder;
export type PracticeSearch = { course: PracticeModes['course']; mode: PracticeMode; materials: PracticeScopeItem[]; materialTree?: PracticeMaterialTreeNode[]; topics: PracticeScopeItem[] };
export type QuestionBankSubject = { id: string; name: string; questionBankCount: number };
export type QuestionBank = { id: string; subject: { id: string; name: string }; slug: string; title: string; description: string; questionKinds: ('NORMAL_MCQ' | 'CASE_MCQ')[]; accessType: 'FREE' | 'PAID'; price: number; accessDurationValue: number | null; accessDurationUnit: 'DAYS' | 'WEEKS' | 'MONTHS' | null; owned: boolean; locked: boolean; purchaseRequired: boolean; storePath: string; accessSource: 'FREE' | 'DIRECT_PURCHASE' | 'PACKAGE' | null; includedInPackage: boolean; includedPackage: { id: string; title: string } | null; materialIds: string[]; questionCount: number; totalQuestionCount?: number; completedInCycle?: number };
export type PracticeFilters = { sourceKind: SourceKind; mode: PracticeMode; questionBankId: string | null; accessPolicy: 'FREE' | 'PAID'; linkedFiles: { id: string; name: string; mimeType: string | null; accessType: 'FREE' | 'PAID' }[]; subjects: { id: string; name: string; taxonomyChapters: { id: string; name: string; lessons: { id: string; name: string; topics: { id: string; name: string }[] }[] }[] }[]; collections: string[]; years: number[]; capabilities: { yearFilter: boolean; retryWrong: boolean; explanationAfterWrong: boolean } };
export type PracticeBuild = { sourceKind: SourceKind; mode: PracticeMode; questionBankId?: string; historyCategory?: PracticeHistoryCategory; contentItemIds?: string[]; subjectId?: string; chapterId?: string; lessonId?: string; topicId?: string; collection?: 'PYQ' | 'RTP' | 'MTP' | 'ORIGINAL' | 'QUESTION_BANK'; year?: number; answerFormat: AnswerFormat; questionCount?: number; timerSeconds?: number };
export type PracticeSession = { id: string; sourceKind: SourceKind; mode: PracticeMode; questionBankId?: string | null; answerFormat: AnswerFormat; accessPolicy: 'FREE' | 'PAID'; questionCount: number; unlimitedQuestions: boolean; timerSeconds: number | null; startedAt: string; expiresAt: string | null; status: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED'; answeredCount?: number; correctCount?: number; wrongCount?: number; markedReviewCount?: number; materials?: { contentItem: { id: string; name: string } }[]; navigator?: { id: string; sequence: number; navigatorState: string; attemptCount: number; final: boolean }[] };
export type PracticeResult = { session: PracticeSession; score: { correct: number; wrong: number; answered: number; total: number; percent: number }; durationMs: number; accuracyPercent: number | null };
export type PracticeCompletion = PracticeResult & { completionTimingReport?: { questionId: string; sequence: number; durationMs: number }[] };
export type PracticeQuestion = { id: string; sequence: number; kind: string; difficulty: string; examName: string; promptHtml: string; caseHtml: string | null; options: { optionLabel: string; html: string; displayOrder: number }[]; navigatorState: string; attemptCount: number; final: boolean };
export type PracticeRevisionQuestion = { id: string; sequence: number; kind: string; difficulty: string; promptHtml: string; caseHtml: string | null; options: { optionLabel: string; html: string; displayOrder: number }[]; correctOptionLabel: string | null; correctAnswerHtml: string | null; correctExplanation: string | null; wrongExplanation: string | null; examName: string; chapterName: string; conceptName: string };
export type PracticeRevision = { mode: 'REVISIT'; questionCount: number; items: PracticeRevisionQuestion[] };
export async function getPracticeModes() { return (await api.get<PracticeModes>('/student/practice/modes')).data; }
export async function searchPracticeScope(mode: PracticeMode, query = '', questionBankId?: string, historyCategory?: PracticeHistoryCategory) { return (await api.get<PracticeSearch>('/student/practice/search', { params: { mode, questionBankId, historyCategory, q: query || undefined, limit: 30 } })).data; }
export async function getQuestionBankSubjects() { return (await api.get<QuestionBankSubject[]>('/student/practice/question-bank-subjects')).data; }
export async function getQuestionBanks(subjectFolderId?: string) { return (await api.get<QuestionBank[]>('/student/practice/question-banks', { params: { subjectFolderId } })).data; }
export async function getPracticeFilters(mode: PracticeMode, questionBankId?: string, historyCategory?: PracticeHistoryCategory) { return (await api.get<PracticeFilters>('/student/practice/filters', { params: { sourceKind: 'ARCHIVE', mode, questionBankId, historyCategory } })).data; }
export async function previewPracticeSet(input: PracticeBuild) { return (await api.post<{ eligibleQuestionCount: number; selectedQuestionCount: number; unlimitedQuestions: boolean; timerSeconds: number | null; accessPolicy: 'FREE' | 'PAID' }>('/student/practice/sets/preview', input)).data; }
export async function createPracticeSession(input: PracticeBuild) { return (await api.post<PracticeSession>('/student/practice/sessions', input)).data; }
export async function getPracticeRevision(input: PracticeBuild) {
  const body = { ...input };
  delete body.timerSeconds;
  return (await api.post<PracticeRevision>('/student/practice/revision/questions', body)).data;
}
export async function getResumablePracticeSession() { return (await api.get<PracticeSession | null>('/student/practice/sessions/resume')).data; }
export async function getPracticeSession(id: string) { return (await api.get<PracticeSession>(`/student/practice/sessions/${id}`)).data; }
export async function getPracticeQuestions(id: string) {
  type Page = { session: Pick<PracticeSession, 'id' | 'status' | 'accessPolicy' | 'expiresAt'>; items: PracticeQuestion[]; pagination: { page: number; pages: number; total: number } };
  const first = (await api.get<Page>(`/student/practice/sessions/${id}/questions`, { params: { page: 1, limit: 100 } })).data;
  if (first.pagination.pages <= 1) return first;
  const remaining = await Promise.all(Array.from({ length: first.pagination.pages - 1 }, (_, index) => api.get<Page>(`/student/practice/sessions/${id}/questions`, { params: { page: index + 2, limit: 100 } }).then((response) => response.data)));
  return { ...first, items: [first, ...remaining].flatMap((page) => page.items) };
}
export async function submitPracticeAnswer(sessionId: string, questionId: string, body: { answerOptionLabel: string; durationMs?: number }) { return (await api.post<{ attempt: { correct: boolean | null }; result: { navigatorState: string; retryAllowed: boolean; correctOptionLabel: string | null; explanation: string | null; correctExplanation: string | null; wrongExplanation: string | null }; session?: PracticeSession }>(`/student/practice/sessions/${sessionId}/questions/${questionId}/attempts`, { ...body, clientAttemptId: `${questionId}-${Date.now()}-${Math.random().toString(36).slice(2)}` })).data; }
export async function markPracticeReview(sessionId: string, questionId: string, marked: boolean) { return (await api.patch<{ id: string; sequence: number; navigatorState: string }>(`/student/practice/sessions/${sessionId}/questions/${questionId}/review`, { marked })).data; }
export async function completePracticeSession(id: string) { return (await api.post<PracticeCompletion>(`/student/practice/sessions/${id}/complete`)).data; }
export async function getPracticeResult(id: string) { return (await api.get<PracticeResult>(`/student/practice/sessions/${id}/result`)).data; }

type PracticeMetric = { questionsSolved: number; attempts: number; correct: number; wrong: number; durationMs: number; accuracyPercent: number | null };
export type PracticeTracker = { course: PracticeModes['course']; totals: { questionsSolved: number; attempts: number; correct: number; wrong: number; durationMs: number }; subjects: (PracticeMetric & { subjectId: string; subjectName: string })[]; chapters: (PracticeMetric & { chapterId: string; chapterName: string; subject: { id: string; name: string } })[]; topics: (PracticeMetric & { topicId: string; topicName: string; chapter: { id: string; name: string }; subject: { id: string; name: string } })[]; activity: { date: string; attempts: number; correct: number; wrong: number; durationMs: number }[]; weakAreas: null | (PracticeMetric & { topicId: string; topicName: string; chapter: { id: string; name: string }; subject: { id: string; name: string } })[]; capabilities: { conceptWeakAreas: boolean; weakAreaGranularity: 'TOPIC' } };
export async function getPracticeTracker() { return (await api.get<PracticeTracker>('/student/practice/tracker')).data; }
