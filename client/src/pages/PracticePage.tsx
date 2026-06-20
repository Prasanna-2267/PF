import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppHeader, Badge, Button, Card, Select, Spinner, Stat, Textarea } from '../components/ui';
import { contentApi, type PubSubject } from '../features/content/content.api';
import { questionsApi, type GradeResult, type StudentQuestion } from '../features/questions/questions.api';

export function PracticePage() {
  const navigate = useNavigate();
  const [catId, setCatId] = useState('');
  const [stageId, setStageId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const categories = useQuery({ queryKey: ['pub', 'categories'], queryFn: contentApi.categories });
  const stages = useQuery({ queryKey: ['pub', 'stages', catId], queryFn: () => contentApi.stages(catId), enabled: !!catId });
  const subjects = useQuery({ queryKey: ['pub', 'subjects', stageId], queryFn: () => contentApi.subjectTree(stageId), enabled: !!stageId });
  const questions = useQuery({
    queryKey: ['practice', 'questions', stageId, subjectId],
    queryFn: () => questionsApi.list(stageId, subjectId || undefined),
    enabled: !!stageId,
  });
  const stats = useQuery({
    queryKey: ['practice', 'stats', stageId],
    queryFn: () => questionsApi.stats(stageId),
    enabled: !!stageId,
  });

  const subjectOptions = subjects.data ? flatten(subjects.data) : [];

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <AppHeader
        right={
          <>
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              Home
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/notes')}>
              Notes
            </Button>
          </>
        }
      />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Practice</h1>
        <p className="mt-1 text-sm text-muted">Test yourself — MCQs grade instantly, written answers get AI feedback.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Select value={catId} onChange={(e) => { setCatId(e.target.value); setStageId(''); setSubjectId(''); }} className="w-40">
            <option value="">Select exam</option>
            {categories.data?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
          <Select value={stageId} onChange={(e) => { setStageId(e.target.value); setSubjectId(''); }} disabled={!catId} className="w-40">
            <option value="">Select stage</option>
            {stages.data?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </Select>
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!stageId} className="w-48">
            <option value="">All subjects</option>
            {subjectOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </Select>
        </div>

        {stageId && stats.data && stats.data.attempts > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Attempts" value={stats.data.attempts} />
            <Stat label="Avg score" value={`${stats.data.averagePercent}%`} />
            <Stat label="MCQ accuracy" value={`${stats.data.mcqAccuracy}%`} />
          </div>
        )}

        {stageId && questions.isLoading && (
          <div className="mt-10 flex justify-center"><Spinner /></div>
        )}

        {stageId && questions.data && (
          <div className="mt-6 space-y-4">
            {questions.data.length === 0 && <p className="text-sm text-muted">No questions here yet.</p>}
            {questions.data.map((q, i) => (
              <QuestionCard key={q.id} index={i + 1} question={q} onGraded={() => void stats.refetch()} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function QuestionCard({
  index,
  question,
  onGraded,
}: {
  index: number;
  question: StudentQuestion;
  onGraded: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const answered = result !== null;

  async function submit() {
    setError('');
    if (question.type === 'mcq' && selected === null) return setError('Pick an option.');
    if (question.type !== 'mcq' && !text.trim()) return setError('Write your answer first.');
    setBusy(true);
    try {
      const body = question.type === 'mcq' ? { selectedOption: selected! } : { answerText: text.trim() };
      const r = await questionsApi.answer(question.id, body);
      setResult(r);
      onGraded();
    } catch {
      setError('Could not submit your answer. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function retry() {
    setResult(null);
    setSelected(null);
    setText('');
    setError('');
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-2">
        <span className="font-mono text-sm text-muted">{index}.</span>
        <div className="flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="accent">{question.type === 'mcq' ? 'MCQ' : question.type === 'short' ? 'Short' : 'Long'}</Badge>
            <Badge>{question.difficulty}</Badge>
            <span className="font-mono text-xs text-muted">{question.maxScore} pt</span>
          </div>
          <p className="whitespace-pre-wrap text-sm font-medium">{question.prompt}</p>

          {question.type === 'mcq' ? (
            <div className="mt-3 space-y-1.5">
              {question.options?.map((opt, i) => {
                const isCorrect = answered && result?.correctOption === i;
                const isChosenWrong = answered && selected === i && !result?.isCorrect;
                return (
                  <label
                    key={i}
                    className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                      isCorrect
                        ? 'border-success bg-success-soft text-success'
                        : isChosenWrong
                          ? 'border-danger bg-danger-soft text-danger'
                          : selected === i
                            ? 'border-accent bg-accent-soft'
                            : 'border-line'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${question.id}`}
                      disabled={answered}
                      checked={selected === i}
                      onChange={() => setSelected(i)}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <Textarea
              className="mt-3"
              rows={4}
              placeholder="Type your answer…"
              value={text}
              disabled={answered}
              onChange={(e) => setText(e.target.value)}
            />
          )}

          {error && <p className="mt-2 text-xs text-danger">{error}</p>}

          {answered ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge tone={result!.score >= result!.maxScore ? 'success' : result!.score > 0 ? 'warn' : 'danger'}>
                  {result!.score} / {result!.maxScore}
                </Badge>
                {result!.gradedBy !== 'auto' && (
                  <span className="text-xs text-muted">{result!.gradedBy === 'ai' ? 'AI graded' : 'auto graded'}</span>
                )}
              </div>
              <p className="text-sm">{result!.feedback}</p>
              {result!.modelAnswer && (
                <div className="rounded-md border border-line bg-canvas p-3 text-sm">
                  <p className="mb-1 text-xs font-medium text-muted">Model answer</p>
                  <p className="whitespace-pre-wrap">{result!.modelAnswer}</p>
                </div>
              )}
              {result!.explanation && <p className="text-sm text-muted">{result!.explanation}</p>}
              <Button size="sm" variant="secondary" onClick={retry}>Try again</Button>
            </div>
          ) : (
            <Button className="mt-3" size="sm" onClick={() => void submit()} disabled={busy}>
              {busy ? 'Grading…' : 'Submit'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function flatten(nodes: PubSubject[], depth = 0): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  for (const n of nodes) {
    out.push({ id: n.id, label: `${'— '.repeat(depth)}${n.name}` });
    out.push(...flatten(n.children, depth + 1));
  }
  return out;
}
