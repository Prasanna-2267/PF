import { useRef, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
    <section className="min-w-[280px] flex-1 rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-2.5">
        <h2 className="text-sm font-medium">Lessons</h2>
        <div className="flex gap-2">
          <input ref={fileRef} type="file" accept="application/pdf" onChange={onPickFile} className="hidden" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-md bg-violet-600 px-2 py-1 text-xs font-medium hover:bg-violet-500"
          >
            + Upload PDF
          </button>
          <button
            type="button"
            onClick={addIsm}
            className="rounded-md border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
          >
            + Add link
          </button>
        </div>
      </div>

      <div className="space-y-2 p-2">
        {error && <p className="rounded bg-rose-500/10 px-2 py-1 text-xs text-rose-300">{error}</p>}
        {lessons.isLoading && <p className="px-2 py-3 text-sm text-slate-500">Loading…</p>}
        {lessons.data?.length === 0 && <p className="px-2 py-3 text-sm text-slate-500">No lessons yet.</p>}
        {lessons.data?.map((l) => (
          <div key={l.id} className="rounded-lg border border-slate-800 p-2.5">
            <div className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm">
                {l.title}
                {!l.isActive && <span className="ml-2 text-xs text-amber-400">hidden</span>}
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] uppercase text-slate-400">
                {l.type}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {l.type === 'pdf' ? `${l.pageCount ?? 0} pages` : l.externalUrl}
              {' · '}
              {l.isFree ? 'Free' : `₹${l.price}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              <Mini onClick={() => void run(() => adminLessonsApi.update(l.id, { isActive: !l.isActive }))}>
                {l.isActive ? 'Unpublish' : 'Publish'}
              </Mini>
              <Mini onClick={() => void run(() => adminLessonsApi.update(l.id, { isFree: !l.isFree }))}>
                {l.isFree ? 'Make paid' : 'Make free'}
              </Mini>
              {l.type === 'pdf' && <Mini onClick={() => setPrice(l)}>Price</Mini>}
              <Mini onClick={() => rename(l)}>Rename</Mini>
              <Mini onClick={() => void run(() => adminLessonsApi.remove(l.id))} danger>
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
      className={`rounded border border-slate-700 px-2 py-0.5 hover:bg-slate-800 ${danger ? 'text-rose-300' : 'text-slate-300'}`}
    >
      {children}
    </button>
  );
}
