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
          <Button
            leftIcon={<PlusIcon size={16} />}
            disabled={!stageId}
            onClick={() => setFormOpen(true)}
          >
            New question
          </Button>
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

        <Textarea
          label="Explanation (shown after answering, optional)"
          rows={2}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />

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
