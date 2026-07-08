import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FileDropzone,
  Input,
  Modal,
  Skeleton,
  Switch,
  useToast,
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileTextIcon,
  GiftIcon,
  LinkIcon,
  PlusIcon,
  TrendingUpIcon,
  UploadIcon,
} from '../../components/ui';
import { useDisclosure } from '../../hooks';
import {
  adminLessonsApi,
  type AdminLesson,
  type LessonInsights,
} from '../../features/admin/admin-lessons.api';
import { errorMessage } from '../../features/auth/auth.api';
import { formatRupees } from '../../lib/format';
import { ConfirmDialog, IconChip, PublishBadge, useAdminAction } from './admin-shared';
import type { SubjectNode } from '../../features/admin/content.api';

/** Find a node by id within an admin subject tree. */
export function findSubjectNode(nodes: SubjectNode[], id: string): SubjectNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findSubjectNode(n.children, id);
    if (found) return found;
  }
  return null;
}

export function LessonsPanel({
  subjectId,
  hasChildren = false,
}: {
  subjectId: string;
  hasChildren?: boolean;
}) {
  const lessons = useQuery({
    queryKey: ['admin', 'lessons', subjectId],
    queryFn: () => adminLessonsApi.list(subjectId),
    enabled: !hasChildren,
  });
  const navigate = useNavigate();
  const { run } = useAdminAction();
  const upload = useDisclosure();
  const link = useDisclosure();
  const [editTarget, setEditTarget] = useState<AdminLesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminLesson | null>(null);
  const [insightsTarget, setInsightsTarget] = useState<AdminLesson | null>(null);

  const key: unknown[][] = [['admin', 'lessons', subjectId]];

  // A subject holds EITHER sub-subjects OR notes — never both.
  if (hasChildren) {
    return (
      <Card flush>
        <div className="border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-fg">Lessons</h2>
        </div>
        <div className="p-3">
          <Alert tone="info" title="This subject has sub-subjects">
            Notes live on the sub-subjects, not here. Open a sub-subject in the tree above to add
            its notes — a subject can hold either sub-subjects or notes, never both.
          </Alert>
        </div>
      </Card>
    );
  }

  return (
    <Card flush>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
        <h2 className="text-sm font-semibold text-fg">
          Lessons
          {lessons.data ? (
            <span className="ml-1.5 text-xs font-normal tabular text-muted">
              ({lessons.data.length})
            </span>
          ) : null}
        </h2>
        <div className="flex gap-2">
          <Button size="sm" leftIcon={<UploadIcon size={16} />} onClick={upload.open}>
            Upload PDF
          </Button>
          <Button size="sm" variant="secondary" leftIcon={<LinkIcon size={16} />} onClick={link.open}>
            Add link
          </Button>
        </div>
      </div>

      <div className="p-3">
        {lessons.isLoading ? (
          <div className="space-y-2">
            <Skeleton shape="block" className="h-16" />
            <Skeleton shape="block" className="h-16" />
          </div>
        ) : lessons.isError ? (
          <ErrorState message={errorMessage(lessons.error)} onRetry={() => void lessons.refetch()} />
        ) : lessons.data && lessons.data.length > 0 ? (
          <div className="space-y-2">
            {lessons.data.map((l) => (
              <LessonRow
                key={l.id}
                lesson={l}
                onTogglePublish={() =>
                  run(() => adminLessonsApi.update(l.id, { isActive: !l.isActive }), {
                    invalidate: key,
                    success: l.isActive ? 'Lesson hidden' : 'Lesson published',
                  })
                }
                onView={() => navigate(`/lesson/${l.id}`)}
                onInsights={() => setInsightsTarget(l)}
                onEdit={() => setEditTarget(l)}
                onDelete={() => setDeleteTarget(l)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileTextIcon size={22} />}
            title="No lessons yet"
            description="Upload a secured PDF or add a free government link for this subject."
            action={
              <Button size="sm" leftIcon={<PlusIcon size={16} />} onClick={upload.open}>
                Upload PDF
              </Button>
            }
          />
        )}
      </div>

      {upload.isOpen ? (
        <UploadPdfModal open onClose={upload.close} subjectId={subjectId} />
      ) : null}
      {link.isOpen ? <LinkModal open onClose={link.close} subjectId={subjectId} /> : null}
      {editTarget ? (
        <EditLessonModal
          open
          onClose={() => setEditTarget(null)}
          subjectId={subjectId}
          lesson={editTarget}
        />
      ) : null}
      {deleteTarget ? (
        <ConfirmDialog
          open
          onClose={() => setDeleteTarget(null)}
          title={`Delete “${deleteTarget.title}”?`}
          description="This permanently removes the lesson, its file, and every student’s progress. If any student has purchased it, deletion is blocked — unpublish it instead to keep their access."
          confirmLabel="Delete lesson"
          onConfirm={() => adminLessonsApi.remove(deleteTarget.id)}
          invalidate={key}
          success="Lesson deleted"
        />
      ) : null}
      {insightsTarget ? (
        <InsightsModal
          open
          onClose={() => setInsightsTarget(null)}
          lessonId={insightsTarget.id}
          title={insightsTarget.title}
        />
      ) : null}
    </Card>
  );
}

function LessonRow({
  lesson,
  onTogglePublish,
  onView,
  onInsights,
  onEdit,
  onDelete,
}: {
  lesson: AdminLesson;
  onTogglePublish: () => void;
  onView: () => void;
  onInsights: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isPdf = lesson.type === 'pdf';
  return (
    <div className="rounded-field border border-line p-3">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 shrink-0 text-muted">
          {isPdf ? <FileTextIcon size={18} /> : <ExternalLinkIcon size={18} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-fg">{lesson.title}</span>
            {!lesson.isActive ? (
              <Badge tone="neutral" size="sm">
                Hidden
              </Badge>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone="neutral" size="sm">
              {isPdf ? 'PDF' : 'Government link'}
            </Badge>
            {lesson.isFree ? (
              <Badge tone="gold" size="sm">
                Free
              </Badge>
            ) : (
              <Badge tone="primary" size="sm">
                {formatRupees(lesson.price)}
              </Badge>
            )}
            <span className="min-w-0 truncate font-mono text-[11px] text-muted">
              {isPdf ? `${lesson.pageCount ?? 0} pages` : lesson.externalUrl}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <PublishBadge active={lesson.isActive} />
        <span className="flex-1" />
        {isPdf ? (
          <Button size="sm" variant="secondary" leftIcon={<EyeIcon size={15} />} onClick={onView}>
            View
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" leftIcon={<TrendingUpIcon size={15} />} onClick={onInsights}>
          Insights
        </Button>
        <Button size="sm" variant="secondary" onClick={onTogglePublish}>
          {lesson.isActive ? 'Unpublish' : 'Publish'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" className="text-danger hover:text-danger" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}

/* ---------------- create: upload PDF ---------------- */

function UploadPdfModal({
  open,
  onClose,
  subjectId,
}: {
  open: boolean;
  onClose: () => void;
  subjectId: string;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const formId = useId();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('file', file as File);
      fd.append('title', title.trim());
      fd.append('subjectId', subjectId);
      fd.append('isFree', String(isFree));
      fd.append('price', isFree ? '0' : String(Number(price) || 0));
      return adminLessonsApi.uploadPdf(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'lessons', subjectId] });
      toast.success('PDF uploaded');
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function pickFile(f: File | null) {
    setFile(f);
    if (f && !title.trim()) setTitle(f.name.replace(/\.pdf$/i, ''));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Choose a PDF file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Enter a lesson title.');
      return;
    }
    if (!isFree && (!price.trim() || Number(price) <= 0)) {
      setError('Enter a price in rupees, or mark the lesson free.');
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Upload PDF lesson"
      description="Secured PDF, up to 50 MB. Page count is detected automatically."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={mutation.isPending}>
            {mutation.isPending ? 'Uploading…' : 'Upload'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <FileDropzone file={file} onFile={pickFile} accept="application/pdf" acceptLabel="PDF up to 50 MB" maxSizeMB={50} />
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Switch
          checked={isFree}
          onChange={setIsFree}
          label="Free lesson"
          description="Free lessons open without purchase."
        />
        {!isFree ? (
          <Input
            label="Price (₹)"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 199"
          />
        ) : null}
        {mutation.isPending ? (
          <Alert tone="info">Uploading and counting pages — large PDFs may take a moment.</Alert>
        ) : null}
      </form>
    </Modal>
  );
}

/* ---------------- create: external link ---------------- */

function LinkModal({
  open,
  onClose,
  subjectId,
}: {
  open: boolean;
  onClose: () => void;
  subjectId: string;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const formId = useId();
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      adminLessonsApi.createIsm({
        title: title.trim(),
        subjectId,
        externalUrl: url.trim(),
        isFree: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'lessons', subjectId] });
      toast.success('Link added');
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Enter a title.');
      return;
    }
    if (!/^https?:\/\//i.test(url.trim())) {
      setError('Enter a full URL starting with http:// or https://');
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add government link"
      description="A free external resource link — distinct from a secured PDF lesson."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={mutation.isPending}>
            Add link
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input
          label="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          leftIcon={<ExternalLinkIcon size={16} />}
        />
      </form>
    </Modal>
  );
}

/* ---------------- edit: title + pricing ---------------- */

function EditLessonModal({
  open,
  onClose,
  subjectId,
  lesson,
}: {
  open: boolean;
  onClose: () => void;
  subjectId: string;
  lesson: AdminLesson;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const formId = useId();
  const [title, setTitle] = useState(lesson.title);
  const [isFree, setIsFree] = useState(lesson.isFree);
  const [price, setPrice] = useState(lesson.price ? String(lesson.price) : '');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      adminLessonsApi.update(lesson.id, {
        title: title.trim(),
        isFree,
        price: isFree ? 0 : Number(price) || 0,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'lessons', subjectId] });
      toast.success('Lesson updated');
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Enter a lesson title.');
      return;
    }
    if (!isFree && (!price.trim() || Number(price) <= 0)) {
      setError('Enter a price in rupees, or mark the lesson free.');
      return;
    }
    mutation.mutate();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit lesson"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={mutation.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <Switch checked={isFree} onChange={setIsFree} label="Free lesson" />
        {!isFree ? (
          <Input
            label="Price (₹)"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 199"
          />
        ) : null}
      </form>
    </Modal>
  );
}

/* ---------------- insights: who bought / completed ---------------- */

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-field border border-line bg-sunken/50 p-3 text-center">
      <p className="font-display text-xl font-extrabold tabular text-fg">{value}</p>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}

function PersonRow({
  name,
  email,
  right,
}: {
  name: string;
  email: string;
  right?: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-fg">{name}</p>
        <p className="truncate text-xs text-muted">{email}</p>
      </div>
      {right}
    </li>
  );
}

function shortDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function InsightsModal({
  open,
  onClose,
  lessonId,
  title,
}: {
  open: boolean;
  onClose: () => void;
  lessonId: string;
  title: string;
}) {
  const q = useQuery({
    queryKey: ['admin', 'lesson-insights', lessonId],
    queryFn: () => adminLessonsApi.insights(lessonId),
  });
  const d: LessonInsights | undefined = q.data;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={
        <span className="flex items-center gap-2.5">
          <IconChip size="sm" tone="primary" icon={<TrendingUpIcon size={16} />} />
          <span className="min-w-0 truncate">{title}</span>
        </span>
      }
    >
      {q.isLoading ? (
        <div className="space-y-3">
          <Skeleton shape="block" className="h-16" />
          <Skeleton shape="block" className="h-40" />
        </div>
      ) : q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => void q.refetch()} />
      ) : d ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatBox label="Purchasers" value={d.counts.purchasers} />
            <StatBox label="Completed" value={d.counts.completed} />
            <StatBox label="Revisions" value={d.counts.revisions} />
            <StatBox label="Views" value={d.counts.views} />
          </div>

          <section>
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              <GiftIcon size={13} /> Purchased by ({d.purchasers.length})
            </p>
            {d.purchasers.length === 0 ? (
              <p className="py-3 text-sm text-muted">No purchases yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {d.purchasers.map((p) => (
                  <PersonRow
                    key={p.userId}
                    name={p.name}
                    email={p.email}
                    right={
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge tone="neutral" size="sm">
                          {p.via}
                        </Badge>
                        {p.completed ? (
                          <Badge tone="success" size="sm" icon={<CheckIcon size={12} />}>
                            Completed
                          </Badge>
                        ) : null}
                        <span className="text-xs text-muted tabular">{shortDate(p.at)}</span>
                      </div>
                    }
                  />
                ))}
              </ul>
            )}
          </section>

          <section>
            <p className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
              <CheckIcon size={13} /> Marked complete ({d.completers.length})
            </p>
            {d.completers.length === 0 ? (
              <p className="py-3 text-sm text-muted">No completions yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {d.completers.map((c) => (
                  <PersonRow
                    key={c.userId}
                    name={c.name}
                    email={c.email}
                    right={<span className="text-xs text-muted tabular">{shortDate(c.at)}</span>}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}
