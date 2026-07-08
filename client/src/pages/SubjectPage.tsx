import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AnimatedNumber,
  Button,
  Card,
  EmptyState,
  ErrorState,
  ProgressRing,
  Skeleton,
  useToast,
} from '../components/ui';
import { BooksArt } from '../components/decor';
import { Breadcrumbs, PageHeader } from '../components/layout';
import { SubjectCard, findSubjectPath, useActiveStage, useSubjectTree } from '../features/catalog';
import { lessonsApi, type Lesson } from '../features/lessons/lessons.api';
import { LessonRow } from '../features/commerce/LessonRow';
import { CheckoutModal, type CheckoutItem } from '../features/commerce/CheckoutModal';
import { errorMessage } from '../features/auth/auth.api';

/**
 * Subject drill-in page (`/notes/:subjectId`). Shows the subject's sub-topics
 * (as cards to drill deeper) and its own lessons, with the secure buy / open /
 * complete / revise flow. Breadcrumbs reflect the path within the stage tree.
 */
export function SubjectPage() {
  const { subjectId = '' } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { success } = useToast();

  const stage = useActiveStage();
  const tree = useSubjectTree(stage.stageId);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);

  const path = tree.data ? findSubjectPath(tree.data, subjectId) : null;
  const node = path && path.length > 0 ? path[path.length - 1] : null;

  // Only leaf subjects (no sub-subjects) hold notes.
  const isLeaf = Boolean(node) && node!.children.length === 0;
  const lessons = useQuery({
    queryKey: ['lessons', subjectId],
    queryFn: () => lessonsApi.list(subjectId),
    enabled: Boolean(subjectId) && isLeaf,
  });
  const progress = useQuery({
    queryKey: ['lessons', 'progress', subjectId],
    queryFn: () => lessonsApi.progress(subjectId),
    enabled: Boolean(subjectId) && isLeaf,
  });

  const completeMut = useMutation({
    mutationFn: (l: Lesson) => (l.completed ? lessonsApi.uncomplete(l.id) : lessonsApi.complete(l.id)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['lessons'] });
      void qc.invalidateQueries({ queryKey: ['tracker'] });
    },
  });
  const reviseMut = useMutation({
    mutationFn: (id: string) => lessonsApi.revise(id),
    onSuccess: () => {
      success('Revision logged');
      void qc.invalidateQueries({ queryKey: ['lessons'] });
      void qc.invalidateQueries({ queryKey: ['tracker'] });
    },
  });

  function afterPurchase() {
    void qc.invalidateQueries({ queryKey: ['commerce', 'my'] });
    void qc.invalidateQueries({ queryKey: ['lessons'] });
    void qc.invalidateQueries({ queryKey: ['tracker'] });
  }

  // Resolving the stage tree (needed for breadcrumbs + which node this is).
  if (stage.isLoading || (stage.stageId && tree.isLoading)) {
    return (
      <div className="space-y-4">
        <Skeleton shape="block" className="h-24" />
        <Skeleton shape="block" className="h-40" />
      </div>
    );
  }

  if (stage.isError || tree.isError) {
    return (
      <ErrorState
        message={errorMessage(stage.error ?? tree.error)}
        onRetry={() => (stage.isError ? void stage.refetch() : void tree.refetch())}
      />
    );
  }

  if (!stage.stageId || !node) {
    return (
      <>
        <PageHeader eyebrow="Catalogue" title="Subject" />
        <EmptyState
          illustration={<BooksArt className="h-32 w-auto" />}
          title="Subject not found"
          description="This subject isn't part of your current stage."
          action={
            <Button variant="secondary" onClick={() => navigate('/notes')}>
              Back to Notes
            </Button>
          }
        />
      </>
    );
  }

  const children = node.children;
  const total = progress.data?.total ?? 0;
  const completed = progress.data?.completed ?? 0;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const hasLessons = Boolean(lessons.data && lessons.data.length > 0);
  const crumbs = [
    { label: 'Notes', to: '/notes' },
    ...(path ?? []).map((n) => ({ label: n.name, to: `/notes/${n.id}` })),
  ];

  return (
    <>
      <Breadcrumbs items={crumbs} className="mb-3" />

      {/* Subject header */}
      <Card className="relative mb-5 overflow-hidden bg-gradient-to-br from-primary-soft/50 to-transparent">
        <BooksArt className="pointer-events-none absolute -right-3 -top-2 h-24 w-auto opacity-80 sm:-right-4 sm:h-28 sm:opacity-90" />
        <div className="relative flex items-center gap-4 sm:gap-5">
          {total > 0 ? (
            <ProgressRing
              value={pct}
              size={88}
              strokeWidth={9}
              tone={pct >= 100 ? 'gold' : 'primary'}
              label={`${pct}% complete`}
            >
              <span className="font-display text-lg font-extrabold tabular text-fg">
                <AnimatedNumber value={pct} />%
              </span>
            </ProgressRing>
          ) : null}
          <div className="min-w-0 pr-16 sm:pr-24">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gold-strong">
              Subject
            </p>
            <h1 className="mt-1 line-clamp-2 font-display text-2xl font-extrabold tracking-tight text-fg">
              {node.name}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {total > 0
                ? `${completed} of ${total} lessons completed`
                : children.length > 0
                  ? `${children.length} topic${children.length === 1 ? '' : 's'} to explore`
                  : 'Browse the lessons below'}
            </p>
          </div>
        </div>
      </Card>

      <div className="pf-stagger space-y-6">
        {/* Sub-topics to drill deeper */}
        {children.length > 0 ? (
          <section className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Topics</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {children.map((c, i) => (
                <SubjectCard key={c.id} subject={c} index={i} />
              ))}
            </div>
          </section>
        ) : null}

        {/* Lessons — only on leaf subjects (a subject with sub-topics has none) */}
        {isLeaf ? (
          <section className="space-y-3">
            {lessons.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} shape="block" className="h-[92px] w-full" />
                ))}
              </div>
            ) : lessons.isError ? (
              <ErrorState
                message={errorMessage(lessons.error)}
                onRetry={() => void lessons.refetch()}
              />
            ) : hasLessons ? (
              <div className="space-y-3">
                {lessons.data!.map((l) => (
                  <LessonRow
                    key={l.id}
                    lesson={l}
                    onOpen={() => navigate(`/lesson/${l.id}`)}
                    onBuy={() =>
                      setCheckoutItem({ type: 'lesson', id: l.id, title: l.title, price: l.price })
                    }
                    onToggleDone={() => completeMut.mutate(l)}
                    onRevise={() => reviseMut.mutate(l.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                illustration={<BooksArt className="h-32 w-auto" />}
                title="No lessons yet"
                description="There are no notes in this subject yet. Check back soon."
              />
            )}
          </section>
        ) : null}
      </div>

      {checkoutItem ? (
        <CheckoutModal
          open
          onClose={() => setCheckoutItem(null)}
          item={checkoutItem}
          onPurchased={afterPurchase}
        />
      ) : null}
    </>
  );
}
