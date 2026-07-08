import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  AnimatedNumber,
  Badge,
  Button,
  Card,
  Combobox,
  EmptyState,
  ErrorState,
  ProgressRing,
  RadioGroup,
  Skeleton,
  Textarea,
  useToast,
  CheckCircleIcon,
  CheckIcon,
  CloseIcon,
  EditIcon,
  FileTextIcon,
  SparkIcon,
  type BadgeTone,
  type RingTone,
} from '../components/ui';
import { TargetArt } from '../components/decor';
import { PageHeader } from '../components/layout';
import { StageSetupCard, flattenSubjects, useActiveStage, useSubjectTree } from '../features/catalog';
import { errorMessage } from '../features/auth/auth.api';
import {
  questionsApi,
  type GradeResult,
  type StudentQuestion,
} from '../features/questions/questions.api';
import { cn } from '../lib/cn';

/**
 * Practice — questions come from the student's saved active stage (no exam/
 * stage cascade here). Only an optional subject filter lives on this page.
 */
export function PracticePage() {
  const stage = useActiveStage();
  const stageId = stage.stageId;
  const [subjectId, setSubjectId] = useState<string | null>(null);

  const subjectTree = useSubjectTree(stageId);
  const subjectOptions = [
    { value: '', label: 'All subjects' },
    ...(subjectTree.data
      ? flattenSubjects(subjectTree.data).map((s) => ({
          value: s.id,
          label: `${'  '.repeat(s.depth)}${s.depth > 0 ? '↳ ' : ''}${s.name}`,
        }))
      : []),
  ];

  const questions = useQuery({
    queryKey: ['questions', 'list', stageId, subjectId ?? null],
    queryFn: () => questionsApi.list(stageId as string, subjectId ?? undefined),
    enabled: Boolean(stageId),
  });

  const stats = useQuery({
    queryKey: ['questions', 'stats', stageId],
    queryFn: () => questionsApi.stats(stageId as string),
    enabled: Boolean(stageId),
  });

  return (
    <>
      <PageHeader
        eyebrow="Practice"
        title="Practice"
        description="MCQs grade instantly. Written answers get scored feedback."
      />

      <div className="pf-stagger space-y-4 lg:space-y-6">
        {stage.isLoading ? (
          <>
            <Skeleton shape="block" className="h-20" />
            <Skeleton shape="block" className="h-36" />
          </>
        ) : stage.isError ? (
          <ErrorState message={errorMessage(stage.error)} onRetry={() => void stage.refetch()} />
        ) : !stageId ? (
          <StageSetupCard
            title="Choose your exam to start practising"
            description="Tell us your exam and stage once — practice questions for it will load here automatically."
          />
        ) : (
          <>
            <Card className="sm:max-w-sm">
              <Combobox
                label="Subject"
                value={subjectId ?? ''}
                options={subjectOptions}
                placeholder="All subjects"
                onChange={(v) => setSubjectId(v || null)}
              />
            </Card>

            {stats.data && stats.data.attempts > 0 && (
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="pf-lift flex flex-col items-center gap-2 rounded-card border border-line bg-surface p-3 text-center shadow-card sm:p-4">
                  <span className="flex h-16 items-center font-display text-2xl font-extrabold tabular text-fg sm:text-3xl">
                    <AnimatedNumber value={stats.data.attempts} />
                  </span>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
                    Attempts
                  </p>
                </div>
                <RingStat label="Avg score" value={stats.data.averagePercent} tone="primary" />
                <RingStat label="MCQ accuracy" value={stats.data.mcqAccuracy} tone="gold" />
              </div>
            )}

            {questions.isLoading && (
              <div className="space-y-4">
                <Skeleton shape="block" className="h-36" />
                <Skeleton shape="block" className="h-36" />
              </div>
            )}

            {questions.isError && (
              <ErrorState
                onRetry={() => void questions.refetch()}
                message={errorMessage(questions.error)}
              />
            )}

            {questions.data && questions.data.length === 0 && (
              <EmptyState
                illustration={<TargetArt className="h-32 w-auto" />}
                title="No questions here yet"
                description="Try a different subject — new questions are added regularly."
              />
            )}

            {questions.data && questions.data.length > 0 && (
              <div className="space-y-4">
                {questions.data.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    index={i + 1}
                    question={q}
                    onGraded={() => void stats.refetch()}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

/** Compact stat tile with the brand's lens-ring motif for percentage metrics. */
function RingStat({ label, value, tone }: { label: string; value: number; tone: RingTone }) {
  return (
    <div className="pf-lift flex flex-col items-center gap-2 rounded-card border border-line bg-surface p-3 text-center shadow-card sm:p-4">
      <ProgressRing value={value} size={64} strokeWidth={6} tone={tone} label={`${label}: ${value}%`}>
        <span className="font-display text-sm font-extrabold tabular text-fg">{value}%</span>
      </ProgressRing>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
    </div>
  );
}

const diffTone: Record<StudentQuestion['difficulty'], BadgeTone> = {
  easy: 'success',
  medium: 'warn',
  hard: 'danger',
};

function typeLabel(type: StudentQuestion['type']): string {
  return type === 'mcq' ? 'MCQ' : type === 'short' ? 'Short' : 'Long';
}

function typeIcon(type: StudentQuestion['type']) {
  return type === 'mcq' ? (
    <CheckCircleIcon size={18} />
  ) : type === 'short' ? (
    <EditIcon size={18} />
  ) : (
    <FileTextIcon size={18} />
  );
}

function scoreText(result: GradeResult): string {
  return result.score >= result.maxScore
    ? 'pf-text-gold'
    : result.score > 0
      ? 'text-warn'
      : 'text-danger';
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
  const { error: toastError } = useToast();
  const [selected, setSelected] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);

  const grade = useMutation({
    mutationFn: (body: { selectedOption?: number; answerText?: string }) =>
      questionsApi.answer(question.id, body),
    onSuccess: (r) => {
      setResult(r);
      onGraded();
    },
    onError: (err) => toastError(errorMessage(err)),
  });

  const answered = result !== null;
  const options = question.options ?? [];

  function submit() {
    if (question.type === 'mcq') {
      if (selected === null) {
        toastError('Select an option first.');
        return;
      }
      grade.mutate({ selectedOption: selected });
    } else {
      if (!text.trim()) {
        toastError('Write your answer first.');
        return;
      }
      grade.mutate({ answerText: text.trim() });
    }
  }

  function retry() {
    setResult(null);
    setSelected(null);
    setText('');
    grade.reset();
  }

  return (
    <Card className="pf-lift">
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-fg"
          aria-hidden="true"
        >
          {typeIcon(question.type)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-sm font-bold text-muted tabular">Q{index}</span>
            <Badge tone="info">{typeLabel(question.type)}</Badge>
            <Badge tone={diffTone[question.difficulty]}>
              {question.difficulty[0].toUpperCase() + question.difficulty.slice(1)}
            </Badge>
            <span className="ml-auto text-xs font-medium text-muted tabular">
              {question.maxScore} pt{question.maxScore === 1 ? '' : 's'}
            </span>
          </div>

          <p className="mt-2 whitespace-pre-wrap text-sm font-medium text-fg">{question.prompt}</p>
        </div>
      </div>

      {question.type === 'mcq' ? (
        answered ? (
          <div className="mt-3 space-y-2">
            {options.map((opt, i) => {
              const isCorrect = result.correctOption === i;
              const isWrongChoice = selected === i && result.isCorrect === false;
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-2.5 rounded-field border px-3 py-2.5 text-sm',
                    isCorrect
                      ? 'border-success bg-success-soft font-semibold text-success-fg'
                      : isWrongChoice
                        ? 'border-danger bg-danger-soft font-semibold text-danger-fg'
                        : 'border-line text-fg',
                  )}
                >
                  <span className="shrink-0">
                    {isCorrect ? (
                      <CheckIcon size={16} />
                    ) : isWrongChoice ? (
                      <CloseIcon size={16} />
                    ) : (
                      <span className="block h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0">{opt}</span>
                  {selected === i ? (
                    <span className="ml-auto shrink-0 text-xs font-medium opacity-80">
                      Your answer
                    </span>
                  ) : isCorrect ? (
                    <span className="ml-auto shrink-0 text-xs font-medium opacity-80">
                      Correct answer
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <RadioGroup
            className="mt-3"
            aria-label="Answer options"
            value={selected === null ? '' : String(selected)}
            onChange={(v) => setSelected(Number(v))}
            options={options.map((opt, i) => ({ value: String(i), label: opt }))}
          />
        )
      ) : (
        <Textarea
          className="mt-3"
          rows={5}
          placeholder="Write your answer…"
          value={text}
          disabled={answered}
          onChange={(e) => setText(e.target.value)}
        />
      )}

      {answered ? (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          {question.type === 'mcq' ? (
            <Badge
              tone={result.isCorrect ? 'success' : 'danger'}
              icon={result.isCorrect ? <CheckIcon size={13} /> : <CloseIcon size={13} />}
            >
              {result.isCorrect ? 'Correct' : 'Incorrect'}
            </Badge>
          ) : (
            <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
              <p className={cn('font-display text-3xl font-extrabold leading-none tabular', scoreText(result))}>
                {result.score}
                <span className="text-base font-bold text-muted"> / {result.maxScore}</span>
              </p>
              <Badge
                size="sm"
                tone={result.gradedBy === 'ai' ? 'primary' : 'neutral'}
                icon={result.gradedBy === 'ai' ? <SparkIcon size={12} /> : undefined}
              >
                {result.gradedBy === 'ai' ? 'AI graded' : 'Auto graded'}
              </Badge>
            </div>
          )}

          {result.feedback && (
            <p className="whitespace-pre-wrap text-sm text-fg">{result.feedback}</p>
          )}

          {result.gradedBy === 'ai' && question.type !== 'mcq' && (
            <p className="text-xs text-muted">AI feedback is a guide, not a final mark.</p>
          )}

          {result.modelAnswer && (
            <div className="rounded-field border border-line bg-sunken p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Model answer
              </p>
              <p className="whitespace-pre-wrap text-sm text-fg">{result.modelAnswer}</p>
            </div>
          )}

          {result.explanation && (
            <p className="whitespace-pre-wrap text-sm text-muted">{result.explanation}</p>
          )}

          <Button size="sm" variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : (
        <Button className="mt-4" onClick={submit} loading={grade.isPending}>
          Submit answer
        </Button>
      )}
    </Card>
  );
}
