import { useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  EmptyState,
  ErrorState,
  Input,
  Skeleton,
  Tabs,
} from '../components/ui';
import { GraduationIcon, NotesIcon, PackageIcon, SearchIcon } from '../components/ui/icons';
import { BooksArt } from '../components/decor';
import { PageHeader } from '../components/layout';
import { StageSetupCard, SubjectCard, useActiveStage, useSubjectTree } from '../features/catalog';
import { commerceApi } from '../features/commerce/commerce.api';
import { PackageCard } from '../features/commerce/PackageCard';
import { errorMessage } from '../features/auth/auth.api';

/**
 * Notes home. Lists every subject in the student's saved stage as a card; each
 * opens its own drill-in page (`/notes/:subjectId`). No exam/stage picker here —
 * the stage comes from saved study preferences.
 */
export function NotesPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'subjects' | 'packages'>('subjects');
  const [subjectQuery, setSubjectQuery] = useState('');

  const stage = useActiveStage();
  const subjects = useSubjectTree(stage.stageId);

  const packages = useQuery({
    queryKey: ['commerce', 'packages'],
    queryFn: commerceApi.packages,
    enabled: tab === 'packages',
  });
  const my = useQuery({
    queryKey: ['commerce', 'my'],
    queryFn: commerceApi.my,
    enabled: tab === 'packages',
  });

  function afterPurchase() {
    void qc.invalidateQueries({ queryKey: ['commerce', 'my'] });
    void qc.invalidateQueries({ queryKey: ['lessons'] });
    void qc.invalidateQueries({ queryKey: ['tracker'] });
  }

  const ownedLessonIds = my.data?.ownedLessonIds;
  function packageOwned(ids: string[]): boolean {
    if (!ownedLessonIds || ids.length === 0) return false;
    return ids.every((id) => ownedLessonIds.includes(id));
  }

  let subjectsContent: ReactNode;
  if (stage.isLoading) {
    subjectsContent = (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} shape="block" className="h-[136px] w-full" />
        ))}
      </div>
    );
  } else if (stage.isError) {
    subjectsContent = (
      <ErrorState message={errorMessage(stage.error)} onRetry={() => void stage.refetch()} />
    );
  } else if (!stage.stageId) {
    subjectsContent = (
      <StageSetupCard
        title="Choose your exam to unlock your notes"
        description="Tell us your exam and stage once — your subjects and lessons will be waiting here every time you come back."
      />
    );
  } else if (subjects.isLoading) {
    subjectsContent = (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} shape="block" className="h-[136px] w-full" />
        ))}
      </div>
    );
  } else if (subjects.isError) {
    subjectsContent = (
      <ErrorState message={errorMessage(subjects.error)} onRetry={() => void subjects.refetch()} />
    );
  } else if (!subjects.data || subjects.data.length === 0) {
    subjectsContent = (
      <EmptyState
        illustration={<BooksArt className="h-32 w-auto" />}
        title="No subjects yet"
        description="Subjects for your stage will appear here once they're published."
      />
    );
  } else {
    const all = subjects.data;
    const q = subjectQuery.trim().toLowerCase();
    const filtered = q ? all.filter((s) => s.name.toLowerCase().includes(q)) : all;
    subjectsContent = (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            <span className="font-semibold text-fg">{all.length}</span> subject
            {all.length === 1 ? '' : 's'}
            {stage.categoryName ? (
              <span className="inline-flex items-center gap-1 text-muted">
                {' '}·<GraduationIcon size={14} className="text-faint" />
                {stage.categoryName}
                {stage.stageName ? ` · ${stage.stageName}` : ''}
              </span>
            ) : null}
          </p>
          {all.length > 5 ? (
            <div className="sm:w-64">
              <Input
                aria-label="Search subjects"
                placeholder="Search subjects"
                leftIcon={<SearchIcon size={18} />}
                value={subjectQuery}
                onChange={(e) => setSubjectQuery(e.target.value)}
              />
            </div>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<SearchIcon size={22} />}
            title="No matching subjects"
            description={`Nothing matches “${subjectQuery.trim()}”. Try a different search.`}
          />
        ) : (
          <div className="pf-stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s, i) => (
              <SubjectCard key={s.id} subject={s} index={i} />
            ))}
          </div>
        )}
      </div>
    );
  }

  let packagesContent: ReactNode;
  if (packages.isLoading) {
    packagesContent = (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} shape="block" className="h-44 w-full" />
        ))}
      </div>
    );
  } else if (packages.isError) {
    packagesContent = (
      <ErrorState message={errorMessage(packages.error)} onRetry={() => void packages.refetch()} />
    );
  } else if (!packages.data || packages.data.packages.length === 0) {
    packagesContent = (
      <EmptyState
        title="No packages yet"
        description="Lesson bundles will appear here when they're available."
      />
    );
  } else {
    packagesContent = (
      <div className="pf-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {packages.data.packages.map((p) => (
          <PackageCard
            key={p.id}
            pkg={p}
            owned={packageOwned(p.lessonIds)}
            onPurchased={afterPurchase}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Notes"
        description="Your subjects, curated for your exam. Buy once, own forever."
      />

      <Tabs
        tabs={[
          { value: 'subjects', label: 'Subjects', icon: <NotesIcon size={16} /> },
          { value: 'packages', label: 'Packages', icon: <PackageIcon size={16} /> },
        ]}
        value={tab}
        onChange={(v) => setTab(v as 'subjects' | 'packages')}
        className="mb-5"
      />

      {tab === 'subjects' ? (
        subjectsContent
      ) : (
        <div className="space-y-4">
          {packages.data && !packages.data.paymentsEnabled ? (
            <Alert tone="warn" title="Payments not enabled yet">
              You can browse packages, but purchasing isn't available right now.
            </Alert>
          ) : null}
          {packagesContent}
        </div>
      )}
    </>
  );
}
