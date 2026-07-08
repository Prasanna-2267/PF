import { openAiJson } from './openai.js';
import { QUESTION_TYPES, DIFFICULTIES } from '../modules/questions/question.model.js';

export type DraftQuestion = {
  type: 'mcq' | 'short' | 'long';
  prompt: string;
  options?: string[];
  correctOption?: number;
  modelAnswer?: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
};

export type GenerateInput = {
  examName: string;
  stageName: string;
  subjectName?: string;
  topic?: string;
  type: 'mcq' | 'short' | 'long' | 'mixed';
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  count: number;
};

/** Keep only well-formed drafts (the admin still reviews them before saving). */
// Caps mirror createQuestionSchema so every kept draft stays saveable via /bulk.
const cap = (s: string, max: number): string => (s.length > max ? s.slice(0, max) : s);

function sanitize(raw: unknown): DraftQuestion | null {
  if (!raw || typeof raw !== 'object') return null;
  const q = raw as Record<string, unknown>;
  const type = String(q.type) as DraftQuestion['type'];
  if (!(QUESTION_TYPES as readonly string[]).includes(type)) return null;
  const prompt = typeof q.prompt === 'string' ? cap(q.prompt.trim(), 4000) : '';
  if (!prompt) return null;

  const difficulty =
    typeof q.difficulty === 'string' && (DIFFICULTIES as readonly string[]).includes(q.difficulty)
      ? (q.difficulty as DraftQuestion['difficulty'])
      : 'medium';
  const explanation =
    typeof q.explanation === 'string' && q.explanation.trim()
      ? cap(q.explanation.trim(), 4000)
      : undefined;

  if (type === 'mcq') {
    const options = Array.isArray(q.options)
      ? q.options.map((o) => cap(String(o).trim(), 500)).filter(Boolean)
      : [];
    if (options.length < 2 || options.length > 8) return null;
    const correctOption = Number(q.correctOption);
    if (!Number.isInteger(correctOption) || correctOption < 0 || correctOption >= options.length) {
      return null;
    }
    return { type, prompt, options, correctOption, difficulty, explanation };
  }

  const modelAnswer = typeof q.modelAnswer === 'string' ? cap(q.modelAnswer.trim(), 8000) : '';
  if (!modelAnswer) return null;
  return { type, prompt, modelAnswer, difficulty, explanation };
}

/** Generate exam-quality draft questions for admin review (never auto-saved). */
export async function generateQuestions(input: GenerateInput): Promise<DraftQuestion[]> {
  const system =
    'You are an expert question-setter for Indian competitive exams. Produce exam-quality, ' +
    'factually-correct practice questions strictly grounded in the given exam, stage, subject and topic. ' +
    'For type "mcq": give 4 plausible options, exactly one correct, "correctOption" as its 0-based index, ' +
    'and a concise "explanation". For "short"/"long": give a rigorous "modelAnswer" and a brief "explanation". ' +
    'Never repeat a question. Reply ONLY as JSON of the form ' +
    '{"questions":[{"type","prompt","options?","correctOption?","modelAnswer?","explanation","difficulty"}]}.';

  const scope = [
    `Exam: ${input.examName}`,
    `Stage: ${input.stageName}`,
    input.subjectName ? `Subject: ${input.subjectName}` : null,
    input.topic ? `Topic focus: ${input.topic}` : null,
  ]
    .filter(Boolean)
    .join('\n');
  const typeReq =
    input.type === 'mixed' ? 'a mix of mcq, short and long types' : `every question of type "${input.type}"`;
  const diffReq =
    input.difficulty === 'mixed'
      ? 'a spread of easy, medium and hard'
      : `difficulty "${input.difficulty}"`;
  const user = `${scope}\n\nGenerate exactly ${input.count} questions — ${typeReq}, ${diffReq}. Ensure correctness and exam relevance.`;

  const out = await openAiJson<{ questions?: unknown[] }>({
    system,
    user,
    temperature: 0.7,
    maxTokens: Math.min(6000, 400 + input.count * 350),
  });
  const list = Array.isArray(out.questions) ? out.questions : [];
  return list
    .slice(0, input.count)
    .map(sanitize)
    .filter((q): q is DraftQuestion => q !== null);
}

/** Draft a concise explanation for a single question (used to auto-fill). */
export async function generateExplanation(input: {
  type: 'mcq' | 'short' | 'long';
  prompt: string;
  options?: string[];
  correctOption?: number;
  modelAnswer?: string;
}): Promise<string> {
  const system =
    'You write concise, exam-focused explanations (2–4 sentences) that justify the correct answer for a ' +
    'competitive-exam student. Reply ONLY as JSON: {"explanation":"..."}.';
  const detail =
    input.type === 'mcq'
      ? `Options:\n${(input.options ?? []).map((o, i) => `${i}. ${o}`).join('\n')}\nCorrect option index: ${input.correctOption}`
      : `Model answer:\n${input.modelAnswer ?? ''}`;
  const out = await openAiJson<{ explanation?: string }>({
    system,
    user: `Question:\n${input.prompt}\n\n${detail}\n\nWrite the explanation.`,
    temperature: 0.3,
    maxTokens: 400,
  });
  return (out.explanation ?? '').trim();
}
