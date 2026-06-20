import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button, Card, Input, Select, Textarea } from '../../components/ui';
import { adminContentApi, type SubjectNode } from '../../features/admin/content.api';
import { questionsApi, type CreateQuestion, type QuestionType } from '../../features/questions/questions.api';
import { errorMessage } from '../../features/auth/auth.api';

export function AdminQuestionsPage() {
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [catId, setCatId] = useState('');
  const [stageId, setStageId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const categories = useQuery({ queryKey: ['admin', 'categories'], queryFn: adminContentApi.listCategories });
  const stages = useQuery({ queryKey: ['admin', 'stages', catId], queryFn: () => adminContentApi.listStages(catId), enabled: !!catId });
  const subjects = useQuery({ queryKey: ['admin', 'subjtree', stageId], queryFn: () => adminContentApi.getSubjectTree(stageId), enabled: !!stageId });
  const questions = useQuery({
    queryKey: ['admin', 'questions', stageId, subjectId],
    queryFn: () => questionsApi.adminList(stageId, subjectId || undefined),
    enabled: !!stageId,
  });

  const subjectOptions = subjects.data ? flatten(subjects.data) : [];

  async function run(fn: () => Promise<unknown>): Promise<void> {
    try {
      setError('');
      await fn();
      await qc.invalidateQueries({ queryKey: ['admin', 'questions', stageId] });
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-xl font-semibold tracking-tight">Question Bank</h1>
      <Alert>{error}</Alert>

      <Card className="p-4">
        <span className="text-xs font-medium text-muted">Scope</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <Select value={catId} onChange={(e) => { setCatId(e.target.value); setStageId(''); setSubjectId(''); }} className="w-40">
            <option value="">Exam</option>
            {categories.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Select value={stageId} onChange={(e) => { setStageId(e.target.value); setSubjectId(''); }} disabled={!catId} className="w-40">
            <option value="">Stage</option>
            {stages.data?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!stageId} className="w-48">
            <option value="">All subjects</option>
            {subjectOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        </div>
      </Card>

      {!stageId ? (
        <p className="text-sm text-muted">Pick an exam and stage to manage its questions.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-4">
            <h2 className="font-display text-sm font-medium">Existing ({questions.data?.length ?? 0})</h2>
            <div className="mt-3 space-y-2">
              {questions.data?.length === 0 && <p className="text-sm text-muted">No questions yet.</p>}
              {questions.data?.map((q) => (
                <div key={q._id} className="rounded-lg border border-line p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                        <Badge tone="accent">{q.type}</Badge>
                        <Badge>{q.difficulty}</Badge>
                        <span className="font-mono text-xs text-muted">{q.maxScore} pt</span>
                        {!q.isActive && <span className="text-xs text-danger">hidden</span>}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm">{q.prompt}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => void run(() => questionsApi.update(q._id, { isActive: !q.isActive }))}>
                      {q.isActive ? 'Unpublish' : 'Publish'}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => { if (window.confirm('Delete this question?')) void run(() => questionsApi.remove(q._id)); }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <QuestionForm
            stageId={stageId}
            subjectId={subjectId || null}
            onCreate={(d) => run(() => questionsApi.create(d))}
          />
        </div>
      )}
    </div>
  );
}

function QuestionForm({
  stageId,
  subjectId,
  onCreate,
}: {
  stageId: string;
  subjectId: string | null;
  onCreate: (d: CreateQuestion) => Promise<void>;
}) {
  const [type, setType] = useState<QuestionType>('mcq');
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [correct, setCorrect] = useState(0);
  const [modelAnswer, setModelAnswer] = useState('');
  const [explanation, setExplanation] = useState('');
  const [maxScore, setMaxScore] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [localError, setLocalError] = useState('');

  function reset() {
    setPrompt('');
    setOptions(['', '']);
    setCorrect(0);
    setModelAnswer('');
    setExplanation('');
    setMaxScore('');
  }

  async function submit() {
    setLocalError('');
    if (!prompt.trim()) return setLocalError('Enter the question prompt.');

    const base: CreateQuestion = {
      stageId,
      subjectId,
      type,
      prompt: prompt.trim(),
      explanation: explanation.trim() || undefined,
      difficulty,
      maxScore: maxScore ? Number(maxScore) : undefined,
    };

    if (type === 'mcq') {
      const opts = options.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) return setLocalError('Add at least 2 non-empty options.');
      if (correct >= opts.length) return setLocalError('Pick which option is correct.');
      base.options = opts;
      base.correctOption = correct;
    } else {
      if (!modelAnswer.trim()) return setLocalError('A model answer is required for written questions.');
      base.modelAnswer = modelAnswer.trim();
    }

    await onCreate(base);
    reset();
  }

  return (
    <Card className="space-y-3 p-4">
      <h2 className="font-display text-sm font-medium">New question</h2>
      {localError && <Alert>{localError}</Alert>}

      <div className="flex gap-2">
        {(['mcq', 'short', 'long'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
              type === t ? 'border-accent bg-accent-soft text-accent' : 'border-line text-muted hover:text-ink'
            }`}
          >
            {t === 'mcq' ? 'Multiple choice' : t === 'short' ? 'Short answer' : 'Long answer'}
          </button>
        ))}
      </div>

      <Textarea label="Prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />

      {type === 'mcq' ? (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted">Options (select the correct one)</span>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="radio" name="correct" checked={correct === i} onChange={() => setCorrect(i)} />
              <Input
                value={opt}
                placeholder={`Option ${i + 1}`}
                onChange={(e) => setOptions((o) => o.map((v, j) => (j === i ? e.target.value : v)))}
                className="flex-1"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => {
                    setOptions((o) => o.filter((_, j) => j !== i));
                    setCorrect((c) => (c >= i && c > 0 ? c - 1 : c));
                  }}
                  className="text-muted hover:text-danger"
                  aria-label="Remove option"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {options.length < 8 && (
            <Button size="sm" variant="ghost" onClick={() => setOptions((o) => [...o, ''])}>
              + Add option
            </Button>
          )}
        </div>
      ) : (
        <Textarea
          label="Model answer (used for grading)"
          rows={4}
          value={modelAnswer}
          onChange={(e) => setModelAnswer(e.target.value)}
        />
      )}

      <Textarea label="Explanation (shown after answering, optional)" rows={2} value={explanation} onChange={(e) => setExplanation(e.target.value)} />

      <div className="flex gap-2">
        <Input
          label="Max score"
          inputMode="numeric"
          placeholder={type === 'mcq' ? '1' : '10'}
          value={maxScore}
          onChange={(e) => setMaxScore(e.target.value)}
          className="w-28"
        />
        <Select label="Difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')} className="w-32">
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>
      </div>

      <Button onClick={() => void submit()}>Add question</Button>
    </Card>
  );
}

function flatten(nodes: SubjectNode[], depth = 0): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const n of nodes) {
    out.push({ id: n.id, label: `${'— '.repeat(depth)}${n.name}` });
    out.push(...flatten(n.children, depth + 1));
  }
  return out;
}
