import { useId, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Modal,
  SegmentedControl,
  Skeleton,
  Textarea,
  useToast,
  CheckIcon,
  CloseIcon,
  EditIcon,
  PlusIcon,
  PracticeIcon,
  SparklesIcon,
  TrashIcon,
} from '../../components/ui';
import { PageHeader } from '../../components/layout';
import { cn } from '../../lib/cn';
import { CatalogPicker, type CatalogSelection } from '../../features/catalog';
import {
  questionsApi,
  type AdminQuestion,
  type CreateQuestion,
  type Difficulty,
  type DraftQuestion,
  type QuestionType,
} from '../../features/questions/questions.api';
import { errorMessage } from '../../features/auth/auth.api';
import { ConfirmDialog, useAdminAction } from './admin-shared';

const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: 'MCQ',
  short: 'Short answer',
  long: 'Long answer',
};

export function AdminQuestionsPage() {
  const [scope, setScope] = useState<CatalogSelection>({
    categoryId: null,
    stageId: null,
    subjectId: null,
  });
  const { run } = useAdminAction();
  const [formOpen, setFormOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminQuestion | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminQuestion | null>(null);

  const stageId = scope.stageId;
  const subjectId = scope.subjectId;

  const questions = useQuery({
    queryKey: ['admin', 'questions', stageId, subjectId ?? null],
    queryFn: () => questionsApi.adminList(stageId as string, subjectId ?? undefined),
    enabled: Boolean(stageId),
  });

  const invalidate: unknown[][] = [['admin', 'questions', stageId]];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Questions' }]}
        title="Question Bank"
        description="Author MCQ, short-answer and long-answer questions per stage and subject."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={<SparklesIcon size={16} />}
              disabled={!stageId}
              onClick={() => setGenOpen(true)}
            >
              Generate with AI
            </Button>
            <Button leftIcon={<PlusIcon size={16} />} disabled={!stageId} onClick={() => setFormOpen(true)}>
              New question
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <p className="mb-2 text-sm font-semibold text-fg">Scope</p>
        <CatalogPicker value={scope} onChange={setScope} subjectAllLabel="All subjects" />
      </Card>

      {!stageId ? (
        <EmptyState
          icon={<PracticeIcon size={22} />}
          title="Pick an exam and stage"
          description="Choose a stage above to manage its questions. Narrow further by subject if you like."
        />
      ) : questions.isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <Skeleton shape="block" className="h-28" />
          <Skeleton shape="block" className="h-28" />
        </div>
      ) : questions.isError ? (
        <ErrorState message={errorMessage(questions.error)} onRetry={() => void questions.refetch()} />
      ) : questions.data && questions.data.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {questions.data.map((q) => (
            <Card key={q._id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone="primary" size="sm">
                  {TYPE_LABEL[q.type]}
                </Badge>
                <Badge tone="neutral" size="sm">
                  {q.difficulty}
                </Badge>
                <Badge tone="neutral" size="sm">
                  {q.maxScore} pt
                </Badge>
                {!q.isActive ? (
                  <Badge tone="warn" size="sm">
                    Hidden
                  </Badge>
                ) : null}
              </div>
              <p className="line-clamp-2 text-sm text-fg">{q.prompt}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                <Button size="sm" variant="ghost" leftIcon={<EditIcon size={16} />} onClick={() => setEditTarget(q)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    run(() => questionsApi.update(q._id, { isActive: !q.isActive }), {
                      invalidate,
                      success: q.isActive ? 'Question unpublished' : 'Question published',
                    })
                  }
                >
                  {q.isActive ? 'Unpublish' : 'Publish'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-danger hover:text-danger"
                  leftIcon={<TrashIcon size={16} />}
                  onClick={() => setDeleteTarget(q)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<PracticeIcon size={22} />}
          title="No questions here yet"
          description="Add the first question for this scope."
          action={
            <Button size="sm" leftIcon={<PlusIcon size={16} />} onClick={() => setFormOpen(true)}>
              New question
            </Button>
          }
        />
      )}

      {genOpen && stageId ? (
        <GenerateModal
          open
          onClose={() => setGenOpen(false)}
          stageId={stageId}
          subjectId={subjectId}
          invalidate={invalidate}
        />
      ) : null}
      {formOpen && stageId ? (
        <QuestionForm
          open
          onClose={() => setFormOpen(false)}
          stageId={stageId}
          subjectId={subjectId}
          invalidate={invalidate}
        />
      ) : null}
      {editTarget ? (
        <QuestionForm
          open
          onClose={() => setEditTarget(null)}
          stageId={editTarget.stageId}
          subjectId={editTarget.subjectId}
          question={editTarget}
          invalidate={invalidate}
        />
      ) : null}
      {deleteTarget ? (
        <ConfirmDialog
          open
          onClose={() => setDeleteTarget(null)}
          title="Delete this question?"
          description="The question and every student attempt for it are permanently removed."
          confirmLabel="Delete question"
          onConfirm={() => questionsApi.remove(deleteTarget._id)}
          invalidate={invalidate}
          success="Question deleted"
        />
      ) : null}
    </>
  );
}

function QuestionForm({
  open,
  onClose,
  stageId,
  subjectId,
  question,
  invalidate,
}: {
  open: boolean;
  onClose: () => void;
  stageId: string;
  subjectId: string | null;
  question?: AdminQuestion;
  invalidate: unknown[][];
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const formId = useId();
  const radioName = useId();

  const [type, setType] = useState<QuestionType>(question?.type ?? 'mcq');
  const [prompt, setPrompt] = useState(question?.prompt ?? '');
  const [options, setOptions] = useState<string[]>(question?.options ?? ['', '']);
  const [correct, setCorrect] = useState(question?.correctOption ?? 0);
  const [modelAnswer, setModelAnswer] = useState(question?.modelAnswer ?? '');
  const [explanation, setExplanation] = useState(question?.explanation ?? '');
  const [maxScore, setMaxScore] = useState(question ? String(question.maxScore) : '');
  const [difficulty, setDifficulty] = useState<Difficulty>(question?.difficulty ?? 'medium');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const base: CreateQuestion = {
        stageId,
        subjectId: subjectId ?? null,
        type,
        prompt: prompt.trim(),
        explanation: explanation.trim() || undefined,
        difficulty,
        maxScore: maxScore ? Number(maxScore) : undefined,
      };
      if (type === 'mcq') {
        base.options = options.map((o) => o.trim()).filter(Boolean);
        base.correctOption = correct;
      } else {
        base.modelAnswer = modelAnswer.trim();
      }
      return question ? questionsApi.update(question._id, base) : questionsApi.create(base);
    },
    onSuccess: () => {
      invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      toast.success(question ? 'Question updated' : 'Question created');
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
  const canExplain =
    prompt.trim().length > 0 &&
    (type === 'mcq'
      ? cleanOptions.length >= 2 && correct < cleanOptions.length
      : modelAnswer.trim().length > 0);
  const explainM = useMutation({
    mutationFn: () =>
      questionsApi.explain({
        type,
        prompt: prompt.trim(),
        options: type === 'mcq' ? cleanOptions : undefined,
        correctOption: type === 'mcq' ? correct : undefined,
        modelAnswer: type !== 'mcq' ? modelAnswer.trim() : undefined,
      }),
    onSuccess: (ex) => {
      setExplanation(ex);
      setError('');
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Enter the question prompt.');
      return;
    }
    if (type === 'mcq') {
      const opts = options.map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) {
        setError('Add at least two non-empty options.');
        return;
      }
      if (correct >= opts.length) {
        setError('Select which option is correct.');
        return;
      }
    } else if (!modelAnswer.trim()) {
      setError('A model answer is required for written questions.');
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={question ? 'Edit question' : 'New question'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={mutation.isPending}>
            {question ? 'Save changes' : 'Add question'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        <div className="space-y-1.5">
          <span className="text-sm font-medium text-fg">Type</span>
          <SegmentedControl
            aria-label="Question type"
            fullWidth
            value={type}
            onChange={(v) => setType(v as QuestionType)}
            options={[
              { value: 'mcq', label: 'MCQ' },
              { value: 'short', label: 'Short' },
              { value: 'long', label: 'Long' },
            ]}
          />
        </div>

        <Textarea label="Prompt" rows={3} value={prompt} onChange={(e) => setPrompt(e.target.value)} />

        {type === 'mcq' ? (
          <div className="space-y-2">
            <span className="text-sm font-medium text-fg">Options — select the correct one</span>
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <label className="flex h-11 w-9 shrink-0 cursor-pointer items-center justify-center">
                  <input
                    type="radio"
                    name={radioName}
                    checked={correct === i}
                    onChange={() => setCorrect(i)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors',
                      correct === i ? 'border-primary bg-primary text-primary-fg' : 'border-line-strong',
                    )}
                  >
                    {correct === i ? <CheckIcon size={13} /> : null}
                  </span>
                </label>
                <Input
                  value={opt}
                  placeholder={`Option ${i + 1}`}
                  onChange={(e) =>
                    setOptions((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
                  }
                  wrapperClassName="flex-1"
                />
                {options.length > 2 ? (
                  <IconButton
                    aria-label={`Remove option ${i + 1}`}
                    icon={<CloseIcon size={16} />}
                    variant="ghost"
                    onClick={() => {
                      setOptions((prev) => prev.filter((_, j) => j !== i));
                      setCorrect((c) => (c >= i && c > 0 ? c - 1 : c));
                    }}
                  />
                ) : null}
              </div>
            ))}
            {options.length < 8 ? (
              <Button
                size="sm"
                variant="ghost"
                leftIcon={<PlusIcon size={16} />}
                onClick={() => setOptions((prev) => [...prev, ''])}
              >
                Add option
              </Button>
            ) : null}
          </div>
        ) : (
          <Textarea
            label="Model answer (used for grading)"
            rows={4}
            value={modelAnswer}
            onChange={(e) => setModelAnswer(e.target.value)}
          />
        )}

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-fg">Explanation (shown after answering, optional)</span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              leftIcon={<SparklesIcon size={14} />}
              loading={explainM.isPending}
              disabled={!canExplain}
              onClick={() => explainM.mutate()}
            >
              Generate
            </Button>
          </div>
          <Textarea
            rows={2}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Max score"
            inputMode="numeric"
            placeholder={type === 'mcq' ? '1' : '10'}
            value={maxScore}
            onChange={(e) => setMaxScore(e.target.value)}
          />
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-fg">Difficulty</span>
            <SegmentedControl
              aria-label="Difficulty"
              fullWidth
              value={difficulty}
              onChange={(v) => setDifficulty(v as Difficulty)}
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

const GEN_TYPES = [
  { value: 'mcq', label: 'MCQ' },
  { value: 'short', label: 'Short' },
  { value: 'long', label: 'Long' },
  { value: 'mixed', label: 'Mixed' },
];
const GEN_DIFFS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'mixed', label: 'Mixed' },
];

/** AI drafts exam questions for the scope; admin reviews, deselects, then bulk-saves. */
function GenerateModal({
  open,
  onClose,
  stageId,
  subjectId,
  invalidate,
}: {
  open: boolean;
  onClose: () => void;
  stageId: string;
  subjectId: string | null;
  invalidate: unknown[][];
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [type, setType] = useState<QuestionType | 'mixed'>('mcq');
  const [difficulty, setDifficulty] = useState<Difficulty | 'mixed'>('medium');
  const [count, setCount] = useState('5');
  const [topic, setTopic] = useState('');
  const [drafts, setDrafts] = useState<DraftQuestion[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');

  const gen = useMutation({
    mutationFn: () =>
      questionsApi.generate({
        stageId,
        subjectId: subjectId ?? null,
        topic: topic.trim() || undefined,
        type,
        difficulty,
        count: Math.min(15, Math.max(1, Number(count) || 5)),
      }),
    onSuccess: (d) => {
      setDrafts(d);
      setSelected(new Set(d.map((_, i) => i)));
      setError(d.length ? '' : 'The AI returned no usable questions — try again or refine the topic.');
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const save = useMutation({
    mutationFn: () => {
      const chosen = (drafts ?? [])
        .filter((_, i) => selected.has(i))
        .map<CreateQuestion>((d) => ({
          stageId,
          subjectId: subjectId ?? null,
          type: d.type,
          prompt: d.prompt,
          options: d.options,
          correctOption: d.correctOption,
          modelAnswer: d.modelAnswer,
          explanation: d.explanation,
          difficulty: d.difficulty,
        }));
      return questionsApi.bulkCreate(chosen);
    },
    onSuccess: (n) => {
      invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      toast.success(`${n} question${n === 1 ? '' : 's'} added`);
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  const list = drafts ?? [];
  const reviewing = drafts !== null && list.length > 0;
  const toggle = (i: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Generate questions with AI"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={gen.isPending || save.isPending}>
            Cancel
          </Button>
          {reviewing ? (
            <>
              <Button
                variant="secondary"
                onClick={() => gen.mutate()}
                loading={gen.isPending}
                disabled={save.isPending}
              >
                Regenerate
              </Button>
              <Button onClick={() => save.mutate()} loading={save.isPending} disabled={selected.size === 0}>
                Save {selected.size} question{selected.size === 1 ? '' : 's'}
              </Button>
            </>
          ) : (
            <Button onClick={() => gen.mutate()} loading={gen.isPending} leftIcon={<SparklesIcon size={16} />}>
              Generate
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        {!reviewing ? (
          <>
            <p className="text-sm text-muted">
              Draft exam questions for the selected stage/subject. Nothing is saved until you review
              and confirm.
            </p>
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-fg">Type</span>
              <SegmentedControl
                aria-label="Type"
                fullWidth
                value={type}
                onChange={(v) => setType(v as QuestionType | 'mixed')}
                options={GEN_TYPES}
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-fg">Difficulty</span>
              <SegmentedControl
                aria-label="Difficulty"
                fullWidth
                value={difficulty}
                onChange={(v) => setDifficulty(v as Difficulty | 'mixed')}
                options={GEN_DIFFS}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="How many"
                inputMode="numeric"
                value={count}
                hint="1–15"
                onChange={(e) => setCount(e.target.value)}
              />
              <Input
                label="Topic (optional)"
                value={topic}
                maxLength={200}
                placeholder="e.g. Depreciation"
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">Review the drafts — untick any you don't want.</p>
              <span className="text-xs font-semibold text-muted">
                {selected.size}/{list.length} selected
              </span>
            </div>
            <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
              {list.map((d, i) => (
                <label
                  key={i}
                  className={cn(
                    'block cursor-pointer rounded-card border p-3 transition-colors',
                    selected.has(i) ? 'border-primary/50 bg-primary-soft/30' : 'border-line',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggle(i)}
                      className="mt-1 h-4 w-4 shrink-0 accent-primary"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap gap-1.5">
                        <Badge tone="primary" size="sm">
                          {TYPE_LABEL[d.type]}
                        </Badge>
                        {d.difficulty ? (
                          <Badge tone="neutral" size="sm">
                            {d.difficulty}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-sm font-medium text-fg">{d.prompt}</p>
                      {d.type === 'mcq' && d.options ? (
                        <ul className="mt-1.5 space-y-0.5">
                          {d.options.map((o, oi) => (
                            <li
                              key={oi}
                              className={cn(
                                'text-xs',
                                oi === d.correctOption ? 'font-semibold text-success-fg' : 'text-muted',
                              )}
                            >
                              {oi === d.correctOption ? '✓ ' : '• '}
                              {o}
                            </li>
                          ))}
                        </ul>
                      ) : d.modelAnswer ? (
                        <p className="mt-1.5 line-clamp-3 text-xs text-muted">
                          <span className="font-semibold">Model:</span> {d.modelAnswer}
                        </p>
                      ) : null}
                      {d.explanation ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted/80">
                          <span className="font-semibold">Why:</span> {d.explanation}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
