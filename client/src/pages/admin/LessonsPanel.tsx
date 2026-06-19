import { useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button } from '../../components/ui';
import { adminLessonsApi, type AdminLesson } from '../../features/admin/admin-lessons.api';
import { errorMessage } from '../../features/auth/auth.api';

export function LessonsPanel({ subjectId }: { subjectId: string }) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');

  const lessons = useQuery({
    queryKey: ['admin', 'lessons', subjectId],
    queryFn: () => adminLessonsApi.list(subjectId),
  });

  async function run(fn: () => Promise<unknown>): Promise<void> {
    try {
      setError('');
      await fn();
      await qc.invalidateQueries({ queryKey: ['admin', 'lessons', subjectId] });
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function onPickFile() {
    const file = fileRef.current?.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    const title = window.prompt('Lesson title:', file.name.replace(/\.pdf$/i, ''))?.trim();
    if (!title) return;
    const free = window.confirm('Make this lesson FREE? (OK = free, Cancel = paid)');
    const fd = new FormData();
    fd.append('title', title);
    fd.append('subjectId', subjectId);
    if (free) fd.append('isFree', 'true');
    fd.append('file', file);
    void run(() => adminLessonsApi.uploadPdf(fd));
  }

  function addIsm() {
    const title = window.prompt('Government link title:')?.trim();
    if (!title) return;
    const url = window.prompt('URL (https://...):')?.trim();
    if (!url) return;
    void run(() => adminLessonsApi.createIsm({ title, subjectId, externalUrl: url, isFree: true }));
  }

  function rename(l: AdminLesson) {
    const t = window.prompt('Rename lesson:', l.title)?.trim();
    if (t && t !== l.title) void run(() => adminLessonsApi.update(l.id, { title: t }));
  }
  function setPrice(l: AdminLesson) {
    const p = window.prompt('Price in ₹ (0 = free):', String(l.price));
    if (p === null) return;
    const n = Number(p);
    if (!Number.isNaN(n) && n >= 0) void run(() => adminLessonsApi.update(l.id, { price: n, isFree: n === 0 }));
  }

  return (
    <section className="min-w-[300px] flex-1 rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <h2 className="font-display text-sm font-medium">Lessons</h2>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="application/pdf" onChange={onPickFile} className="hidden" />
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            + Upload PDF
          </Button>
          <Button size="sm" variant="secondary" onClick={addIsm}>
            + Add link
          </Button>
        </div>
      </div>

      <div className="space-y-2 p-2">
        <Alert>{error}</Alert>
        {lessons.isLoading && <p className="px-2 py-3 text-sm text-muted">Loading…</p>}
        {lessons.data?.length === 0 && <p className="px-2 py-3 text-sm text-muted">No lessons yet.</p>}
        {lessons.data?.map((l) => (
          <div key={l.id} className="rounded-lg border border-line p-2.5">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {l.title}
                {!l.isActive && <span className="ml-2 text-xs text-danger">hidden</span>}
              </span>
              <Badge>{l.type}</Badge>
              {l.isFree ? <Badge tone="accent">free</Badge> : null}
            </div>
            <p className="mt-1 font-mono text-xs text-muted">
              {l.type === 'pdf' ? `${l.pageCount ?? 0} pages` : l.externalUrl}
              {' · '}
              {l.isFree ? 'Free' : `₹${l.price}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Mini onClick={() => void run(() => adminLessonsApi.update(l.id, { isActive: !l.isActive }))}>
                {l.isActive ? 'Unpublish' : 'Publish'}
              </Mini>
              <Mini onClick={() => void run(() => adminLessonsApi.update(l.id, { isFree: !l.isFree }))}>
                {l.isFree ? 'Make paid' : 'Make free'}
              </Mini>
              {l.type === 'pdf' && <Mini onClick={() => setPrice(l)}>Price</Mini>}
              <Mini onClick={() => rename(l)}>Rename</Mini>
              <Mini danger onClick={() => void run(() => adminLessonsApi.remove(l.id))}>
                Delete
              </Mini>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Mini({ children, onClick, danger }: { children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border border-line px-2 py-0.5 text-xs transition-colors hover:bg-canvas ${danger ? 'text-danger' : 'text-muted hover:text-ink'}`}
    >
      {children}
    </button>
  );
}
