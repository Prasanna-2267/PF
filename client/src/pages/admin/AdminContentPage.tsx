import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  Modal,
  Skeleton,
  useToast,
  ChevronRightIcon,
  CloseIcon,
  EditIcon,
  EyeIcon,
  GraduationIcon,
  LockIcon,
  NotesIcon,
  PlusIcon,
  TrackerIcon,
  TrashIcon,
} from '../../components/ui';
import { PageHeader } from '../../components/layout';
import { cn } from '../../lib/cn';
import {
  adminContentApi,
  slugify,
  type Category,
  type Stage,
  type SubjectNode,
} from '../../features/admin/content.api';
import { errorInfo, errorMessage } from '../../features/auth/auth.api';
import { LessonsPanel, findSubjectNode } from './LessonsPanel';
import { ConfirmDialog, useAdminAction } from './admin-shared';

type FormConfig = {
  title: string;
  submitLabel: string;
  withSlug: boolean;
  initialName: string;
  initialSlug: string;
  onSubmit: (v: { name: string; slug: string }) => Promise<unknown>;
  invalidate: unknown[][];
  success: string;
  /** Intercept a submit error; return true if handled (closes the form, no inline error). */
  onError?: (err: unknown, values: { name: string }) => boolean;
};

type ConfirmConfig = {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<unknown>;
  invalidate: unknown[][];
  success: string;
  onSuccess?: () => void;
};

export function AdminContentPage() {
  const [catId, setCatId] = useState<string | null>(null);
  const [stageId, setStageId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [form, setForm] = useState<FormConfig | null>(null);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);
  const [subdivide, setSubdivide] = useState<{ parentId: string; pendingChildName: string } | null>(
    null,
  );
  const { run } = useAdminAction();

  const categories = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: adminContentApi.listCategories,
  });
  const stages = useQuery({
    queryKey: ['admin', 'stages', catId],
    queryFn: () => adminContentApi.listStages(catId as string),
    enabled: Boolean(catId),
  });
  const subjects = useQuery({
    queryKey: ['admin', 'subjects', stageId],
    queryFn: () => adminContentApi.getSubjectTree(stageId as string),
    enabled: Boolean(stageId),
  });

  const catKey: unknown[][] = [['admin', 'categories']];
  const stageKey: unknown[][] = [['admin', 'stages', catId]];
  const subjKey: unknown[][] = [['admin', 'subjects', stageId]];

  /* ---- categories ---- */
  function createCategory() {
    setForm({
      title: 'New exam category',
      submitLabel: 'Create',
      withSlug: true,
      initialName: '',
      initialSlug: '',
      onSubmit: (v) => adminContentApi.createCategory({ name: v.name, slug: v.slug }),
      invalidate: catKey,
      success: 'Category created',
    });
  }
  function renameCategory(c: Category) {
    setForm({
      title: 'Rename category',
      submitLabel: 'Save',
      withSlug: true,
      initialName: c.name,
      initialSlug: c.slug,
      onSubmit: (v) => adminContentApi.updateCategory(c._id, { name: v.name, slug: v.slug }),
      invalidate: catKey,
      success: 'Category updated',
    });
  }
  function deleteCategory(c: Category) {
    setConfirm({
      title: `Delete “${c.name}”?`,
      description:
        'The category can only be removed once all of its stages have been deleted first.',
      confirmLabel: 'Delete category',
      onConfirm: () => adminContentApi.deleteCategory(c._id),
      invalidate: catKey,
      success: 'Category deleted',
      onSuccess: () => {
        if (catId === c._id) {
          setCatId(null);
          setStageId(null);
          setSubjectId(null);
        }
      },
    });
  }

  /* ---- stages ---- */
  function createStage() {
    if (!catId) return;
    setForm({
      title: 'New stage',
      submitLabel: 'Create',
      withSlug: false,
      initialName: '',
      initialSlug: '',
      onSubmit: (v) => adminContentApi.createStage({ name: v.name, examCategoryId: catId }),
      invalidate: stageKey,
      success: 'Stage created',
    });
  }
  function renameStage(s: Stage) {
    setForm({
      title: 'Rename stage',
      submitLabel: 'Save',
      withSlug: false,
      initialName: s.name,
      initialSlug: '',
      onSubmit: (v) => adminContentApi.updateStage(s._id, { name: v.name }),
      invalidate: stageKey,
      success: 'Stage updated',
    });
  }
  function deleteStage(s: Stage) {
    setConfirm({
      title: `Delete “${s.name}”?`,
      description: 'A stage can only be removed once it has no subjects.',
      confirmLabel: 'Delete stage',
      onConfirm: () => adminContentApi.deleteStage(s._id),
      invalidate: stageKey,
      success: 'Stage deleted',
      onSuccess: () => {
        if (stageId === s._id) {
          setStageId(null);
          setSubjectId(null);
        }
      },
    });
  }

  /* ---- subjects ---- */
  function createSubject(parentSubjectId: string | null) {
    if (!stageId) return;
    setForm({
      title: parentSubjectId ? 'New sub-subject' : 'New subject',
      submitLabel: 'Create',
      withSlug: false,
      initialName: '',
      initialSlug: '',
      onSubmit: (v) => adminContentApi.createSubject({ name: v.name, stageId, parentSubjectId }),
      invalidate: subjKey,
      success: 'Subject created',
      onError: (err, values) => {
        // Parent already has notes → offer to move them into a sub-subject.
        if (parentSubjectId && errorInfo(err).code === 'SUBJECT_HAS_NOTES') {
          setSubdivide({ parentId: parentSubjectId, pendingChildName: values.name });
          return true;
        }
        return false;
      },
    });
  }
  function renameSubject(n: SubjectNode) {
    setForm({
      title: 'Rename subject',
      submitLabel: 'Save',
      withSlug: false,
      initialName: n.name,
      initialSlug: '',
      onSubmit: (v) => adminContentApi.updateSubject(n.id, { name: v.name }),
      invalidate: subjKey,
      success: 'Subject updated',
    });
  }
  function deleteSubject(n: SubjectNode) {
    setConfirm({
      title: `Delete “${n.name}”?`,
      description:
        'A subject can only be removed once it has no sub-subjects or lessons underneath it.',
      confirmLabel: 'Delete subject',
      onConfirm: () => adminContentApi.deleteSubject(n.id),
      invalidate: subjKey,
      success: 'Subject deleted',
      onSuccess: () => {
        if (subjectId === n.id) setSubjectId(null);
      },
    });
  }

  const selectedCat = categories.data?.find((c) => c._id === catId) ?? null;
  const selectedStage = stages.data?.find((s) => s._id === stageId) ?? null;
  const selectedSubject = subjectId ? findSubjectNode(subjects.data ?? [], subjectId) : null;

  // The step the admin should act on next — drives the "current" column highlight.
  const activeLevel: 'category' | 'stage' | 'subject' = !catId
    ? 'category'
    : !stageId
      ? 'stage'
      : 'subject';

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Admin', to: '/admin' }, { label: 'Content' }]}
        title="Content"
        description="Build the Exam → Stage → Subject hierarchy and manage each subject’s lessons."
        actions={
          <Button leftIcon={<PlusIcon size={16} />} onClick={createCategory}>
            New category
          </Button>
        }
      />

      <SelectionBar
        category={selectedCat?.name ?? null}
        stage={selectedStage?.name ?? null}
        subject={selectedSubject?.name ?? null}
        onClearCategory={() => {
          setCatId(null);
          setStageId(null);
          setSubjectId(null);
        }}
        onClearStage={() => {
          setStageId(null);
          setSubjectId(null);
        }}
        onClearSubject={() => setSubjectId(null)}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Categories */}
        <ColumnCard
          step={1}
          title="Exam categories"
          icon={<GraduationIcon size={15} />}
          count={categories.data?.length}
          active={activeLevel === 'category'}
          onAdd={createCategory}
        >
          <PanelState
            loading={categories.isLoading}
            error={categories.isError ? errorMessage(categories.error) : undefined}
            onRetry={() => void categories.refetch()}
            empty={categories.data?.length === 0}
            emptyText="No categories yet. Add one to get started."
          >
            {categories.data?.map((c) => (
              <Row
                key={c._id}
                name={c.name}
                slug={c.slug}
                active={c.isActive}
                selected={catId === c._id}
                onSelect={() => {
                  setCatId(c._id);
                  setStageId(null);
                  setSubjectId(null);
                }}
                onToggle={() =>
                  run(() => adminContentApi.updateCategory(c._id, { isActive: !c.isActive }), {
                    invalidate: catKey,
                    success: c.isActive ? 'Category hidden' : 'Category published',
                  })
                }
                onRename={() => renameCategory(c)}
                onDelete={() => deleteCategory(c)}
              />
            ))}
          </PanelState>
        </ColumnCard>

        {/* Stages */}
        <ColumnCard
          step={2}
          title="Stages"
          icon={<TrackerIcon size={15} />}
          count={catId ? stages.data?.length : undefined}
          active={activeLevel === 'stage'}
          locked={!catId}
          lockedHint="Select an exam category first to see its stages."
          onAdd={catId ? createStage : undefined}
        >
          {!catId ? null : (
            <PanelState
              loading={stages.isLoading}
              error={stages.isError ? errorMessage(stages.error) : undefined}
              onRetry={() => void stages.refetch()}
              empty={stages.data?.length === 0}
              emptyText="No stages yet. Add one."
            >
              {stages.data?.map((s) => (
                <Row
                  key={s._id}
                  name={s.name}
                  active={s.isActive}
                  selected={stageId === s._id}
                  onSelect={() => {
                    setStageId(s._id);
                    setSubjectId(null);
                  }}
                  onToggle={() =>
                    run(() => adminContentApi.updateStage(s._id, { isActive: !s.isActive }), {
                      invalidate: stageKey,
                      success: s.isActive ? 'Stage hidden' : 'Stage published',
                    })
                  }
                  onRename={() => renameStage(s)}
                  onDelete={() => deleteStage(s)}
                />
              ))}
            </PanelState>
          )}
        </ColumnCard>

        {/* Subjects */}
        <ColumnCard
          step={3}
          title="Subjects"
          icon={<NotesIcon size={15} />}
          count={stageId ? subjects.data?.length : undefined}
          active={activeLevel === 'subject'}
          locked={!stageId}
          lockedHint="Select a stage first to see its subject tree."
          onAdd={stageId ? () => createSubject(null) : undefined}
        >
          {!stageId ? null : (
            <PanelState
              loading={subjects.isLoading}
              error={subjects.isError ? errorMessage(subjects.error) : undefined}
              onRetry={() => void subjects.refetch()}
              empty={subjects.data?.length === 0}
              emptyText="No subjects yet. Add one."
            >
              {subjects.data ? (
                <SubjectTree
                  nodes={subjects.data}
                  selectedId={subjectId}
                  onSelect={setSubjectId}
                  onAddChild={createSubject}
                  onRename={renameSubject}
                  onToggle={(n) =>
                    run(() => adminContentApi.updateSubject(n.id, { isActive: !n.isActive }), {
                      invalidate: subjKey,
                      success: n.isActive ? 'Subject hidden' : 'Subject published',
                    })
                  }
                  onDelete={deleteSubject}
                />
              ) : null}
            </PanelState>
          )}
        </ColumnCard>
      </div>

      <div className="mt-4 lg:mt-6">
        {subjectId && selectedSubject ? (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              <NotesIcon size={13} /> Lessons in {selectedSubject.name}
            </p>
            <LessonsPanel
              subjectId={subjectId}
              hasChildren={selectedSubject.children.length > 0}
            />
          </div>
        ) : (
          <EmptyState
            icon={<NotesIcon size={22} />}
            title="No subject selected"
            description="Pick a subject from the tree above to upload PDFs, add government links and manage its lessons."
          />
        )}
      </div>

      {form ? (
        <ContentFormModal open onClose={() => setForm(null)} config={form} />
      ) : null}
      {subdivide ? (
        <SubdivideModal
          open
          onClose={() => setSubdivide(null)}
          parentId={subdivide.parentId}
          pendingChildName={subdivide.pendingChildName}
          stageId={stageId ?? ''}
          invalidate={subjKey}
        />
      ) : null}
      {confirm ? (
        <ConfirmDialog
          open
          onClose={() => setConfirm(null)}
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
          invalidate={confirm.invalidate}
          success={confirm.success}
          onSuccess={confirm.onSuccess}
        />
      ) : null}
    </>
  );
}

/* ---------------- sub-components ---------------- */

/** Breadcrumb-style bar showing the current Exam › Stage › Subject drill path. */
function SelectionBar({
  category,
  stage,
  subject,
  onClearCategory,
  onClearStage,
  onClearSubject,
}: {
  category: string | null;
  stage: string | null;
  subject: string | null;
  onClearCategory: () => void;
  onClearStage: () => void;
  onClearSubject: () => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-1 gap-y-1.5 rounded-field border border-line bg-sunken/40 px-3 py-2">
      <PathSegment icon={<GraduationIcon size={14} />} label="Exam" value={category} onClear={onClearCategory} />
      <ChevronRightIcon size={14} className="text-faint" />
      <PathSegment icon={<TrackerIcon size={14} />} label="Stage" value={stage} onClear={onClearStage} />
      <ChevronRightIcon size={14} className="text-faint" />
      <PathSegment icon={<NotesIcon size={14} />} label="Subject" value={subject} onClear={onClearSubject} />
    </div>
  );
}

function PathSegment({
  icon,
  label,
  value,
  onClear,
}: {
  icon: ReactNode;
  label: string;
  value: string | null;
  onClear: () => void;
}) {
  if (!value) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-faint">
        {icon}
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft py-1 pl-2 pr-1 text-xs font-semibold text-primary-soft-fg">
      {icon}
      <span className="max-w-[10rem] truncate">{value}</span>
      <button
        type="button"
        aria-label={`Clear ${label.toLowerCase()} selection`}
        onClick={onClear}
        className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary/20"
      >
        <CloseIcon size={12} />
      </button>
    </span>
  );
}

function ColumnCard({
  step,
  title,
  icon,
  count,
  active = false,
  locked = false,
  lockedHint,
  onAdd,
  children,
}: {
  step: number;
  title: string;
  icon?: ReactNode;
  count?: number;
  active?: boolean;
  locked?: boolean;
  lockedHint?: string;
  onAdd?: () => void;
  children: ReactNode;
}) {
  return (
    <Card
      flush
      className={cn(
        'flex min-h-[16rem] flex-col transition-shadow',
        active && !locked && 'ring-2 ring-primary/40',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
        <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-fg">
          <span
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
              active && !locked ? 'bg-primary text-white' : 'bg-sunken text-muted',
            )}
          >
            {step}
          </span>
          {icon ? <span className="shrink-0 text-muted">{icon}</span> : null}
          <span className="truncate">{title}</span>
          {typeof count === 'number' ? (
            <span className="shrink-0 text-xs font-normal tabular text-muted">({count})</span>
          ) : null}
        </h2>
        {onAdd ? (
          <IconButton aria-label={`Add to ${title}`} icon={<PlusIcon size={18} />} size="sm" variant="subtle" onClick={onAdd} />
        ) : null}
      </div>
      {locked ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sunken text-faint">
            <LockIcon size={16} />
          </span>
          <p className="max-w-[14rem] text-xs text-muted">{lockedHint}</p>
        </div>
      ) : (
        <div className="max-h-[26rem] flex-1 space-y-0.5 overflow-y-auto p-2">{children}</div>
      )}
    </Card>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="px-2 py-6 text-center text-sm text-muted">{children}</p>;
}

function PanelState({
  loading,
  error,
  onRetry,
  empty,
  emptyText,
  children,
}: {
  loading: boolean;
  error?: string;
  onRetry: () => void;
  empty: boolean;
  emptyText: string;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-1">
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
        <Skeleton className="h-8" />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={onRetry} className="border-0" />;
  if (empty) return <Hint>{emptyText}</Hint>;
  return <>{children}</>;
}

function Row({
  name,
  slug,
  active,
  selected,
  onSelect,
  onToggle,
  onRename,
  onDelete,
  onAddChild,
}: {
  name: string;
  slug?: string;
  active: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
}) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-0.5 rounded-field py-1.5 pl-2.5 pr-1.5 transition-colors',
        selected ? 'bg-primary-soft' : 'hover:bg-sunken',
      )}
    >
      {selected ? (
        <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary" aria-hidden="true" />
      ) : null}
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span
          className={cn(
            'truncate text-sm font-medium',
            selected ? 'text-primary-soft-fg' : active ? 'text-fg' : 'text-muted',
          )}
        >
          {name}
        </span>
        {slug ? <span className="truncate font-mono text-[11px] text-muted">/{slug}</span> : null}
      </button>
      {!active ? (
        <Badge tone="neutral" size="sm">
          Hidden
        </Badge>
      ) : null}
      {/* Actions: always visible on touch, reveal on hover/focus on desktop. */}
      <div
        className={cn(
          'flex items-center gap-0.5 transition-opacity',
          selected
            ? 'lg:opacity-100'
            : 'lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100',
        )}
      >
        <IconButton
          aria-label={active ? 'Unpublish' : 'Publish'}
          icon={<EyeIcon size={16} />}
          size="sm"
          variant="ghost"
          className={active ? 'text-success' : 'text-faint'}
          onClick={onToggle}
        />
        {onAddChild ? (
          <IconButton
            aria-label="Add sub-subject"
            icon={<PlusIcon size={16} />}
            size="sm"
            variant="ghost"
            onClick={onAddChild}
          />
        ) : null}
        <IconButton
          aria-label="Rename"
          icon={<EditIcon size={16} />}
          size="sm"
          variant="ghost"
          onClick={onRename}
        />
        <IconButton
          aria-label="Delete"
          icon={<TrashIcon size={16} />}
          size="sm"
          variant="ghost"
          className="hover:text-danger"
          onClick={onDelete}
        />
      </div>
    </div>
  );
}

function SubjectTree({
  nodes,
  selectedId,
  onSelect,
  onAddChild,
  onRename,
  onToggle,
  onDelete,
  depth = 0,
}: {
  nodes: SubjectNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (id: string) => void;
  onRename: (n: SubjectNode) => void;
  onToggle: (n: SubjectNode) => void;
  onDelete: (n: SubjectNode) => void;
  depth?: number;
}) {
  return (
    <ul className={depth ? 'ml-2.5 border-l border-line pl-2' : ''}>
      {nodes.map((n) => (
        <li key={n.id} className="py-0.5">
          <Row
            name={n.name}
            active={n.isActive}
            selected={selectedId === n.id}
            onSelect={() => onSelect(n.id)}
            onToggle={() => onToggle(n)}
            onRename={() => onRename(n)}
            onDelete={() => onDelete(n)}
            onAddChild={() => onAddChild(n.id)}
          />
          {n.children.length > 0 ? (
            <SubjectTree
              nodes={n.children}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onRename={onRename}
              onToggle={onToggle}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ContentFormModal({
  open,
  onClose,
  config,
}: {
  open: boolean;
  onClose: () => void;
  config: FormConfig;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const formId = useId();
  const [name, setName] = useState(config.initialName);
  const [slug, setSlug] = useState(config.initialSlug);
  const [slugEdited, setSlugEdited] = useState(Boolean(config.initialSlug));
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => config.onSubmit({ name: name.trim(), slug: slug.trim() }),
    onSuccess: () => {
      config.invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      toast.success(config.success);
      onClose();
    },
    onError: (err) => {
      if (config.onError?.(err, { name: name.trim() })) {
        onClose();
        return;
      }
      setError(errorMessage(err));
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter a name.');
      return;
    }
    if (config.withSlug && !slug.trim()) {
      setError('Enter a URL slug.');
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={config.title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={mutation.isPending}>
            {config.submitLabel}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-3">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Input
          label="Name"
          value={name}
          autoFocus
          onChange={(e) => {
            const v = e.target.value;
            setName(v);
            if (config.withSlug && !slugEdited) setSlug(slugify(v));
          }}
        />
        {config.withSlug ? (
          <Input
            label="URL slug"
            value={slug}
            hint="Lowercase, used in links. Auto-filled from the name — edit if you like."
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
          />
        ) : null}
      </form>
    </Modal>
  );
}

/**
 * Reorganise a notes-bearing subject into a parent: move its existing notes into
 * a named sub-subject (default "General"), then add the sub-subject the admin was
 * creating. Non-destructive — student progress and purchases are preserved.
 */
function SubdivideModal({
  open,
  onClose,
  parentId,
  pendingChildName,
  stageId,
  invalidate,
}: {
  open: boolean;
  onClose: () => void;
  parentId: string;
  pendingChildName: string;
  stageId: string;
  invalidate: unknown[][];
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const formId = useId();
  const [name, setName] = useState('Overview');
  const [alsoAdd, setAlsoAdd] = useState(true);
  const [error, setError] = useState('');
  const wantsChild = pendingChildName.trim().length > 0 && alsoAdd;

  const mutation = useMutation({
    mutationFn: async () => {
      await adminContentApi.subdivideSubject(parentId, name.trim());
      if (wantsChild) {
        await adminContentApi.createSubject({
          name: pendingChildName.trim(),
          stageId,
          parentSubjectId: parentId,
        });
      }
    },
    onSuccess: () => {
      invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      qc.invalidateQueries({ queryKey: ['admin', 'lessons', parentId] });
      toast.success('Notes moved into a sub-subject');
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name the sub-subject that will hold the existing notes.');
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Move notes into a sub-subject"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={mutation.isPending}>
            {wantsChild ? 'Move notes & add sub-subject' : 'Move notes'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-3">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Alert tone="info">
          This subject already has notes, and a subject can hold either notes or sub-subjects — not
          both. Its notes will move into a new sub-subject (all student progress, prices and
          purchases are kept). Name that sub-subject:
        </Alert>
        <Input
          label="Sub-subject for existing notes"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />
        {pendingChildName.trim() ? (
          <Checkbox
            checked={alsoAdd}
            onChange={setAlsoAdd}
            label={`Also add “${pendingChildName.trim()}” as a sub-subject`}
            description="Uncheck to only move the notes for now — you can add sub-subjects afterwards."
          />
        ) : null}
      </form>
    </Modal>
  );
}
