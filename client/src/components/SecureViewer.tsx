import { useEffect, useState, type FormEvent } from 'react';
import { lessonsApi } from '../features/lessons/lessons.api';
import { authApi, errorInfo, errorMessage } from '../features/auth/auth.api';
import { useAuthStore } from '../lib/auth-store';

/**
 * In-app viewer for secured PDFs. Pages arrive as per-user watermarked images
 * (never the raw PDF). Client-side blocks (no right-click/select/drag, blur on
 * focus loss / PrintScreen) are DETERRENTS, not guarantees — the real
 * protection is the baked watermark + server access log. See docs/SECURITY.md.
 */
export function SecureViewer({ lessonId, onClose }: { lessonId: string; onClose: () => void }) {
  const setUser = useAuthStore((s) => s.setUser);
  const [meta, setMeta] = useState<{ title: string; pageCount: number } | null>(null);
  const [page, setPage] = useState(1);
  const [pageData, setPageData] = useState<{ page: number; url: string } | null>(null);
  const [error, setError] = useState('');
  const [needPhone, setNeedPhone] = useState(false);
  const [phone, setPhone] = useState('');
  const [blurred, setBlurred] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Load metadata; handle the phone gate (403) and paid gate (402).
  useEffect(() => {
    let active = true;
    lessonsApi
      .view(lessonId)
      .then((m) => {
        if (active) {
          setMeta(m);
          setPage(1);
        }
      })
      .catch((err) => {
        if (!active) return;
        const { status, code } = errorInfo(err);
        if (status === 403 && code === 'PHONE_REQUIRED') setNeedPhone(true);
        else setError(errorMessage(err));
      });
    return () => {
      active = false;
    };
  }, [lessonId, reloadKey]);

  // Fetch the current page as a blob → object URL (no shareable page URL).
  useEffect(() => {
    if (!meta) return;
    let active = true;
    let url: string | null = null;
    lessonsApi
      .pageBlob(lessonId, page)
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setPageData({ page, url });
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [meta, page, lessonId]);

  // Deterrents (not guarantees).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === 's' || k === 'p')) e.preventDefault();
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c'))) {
        e.preventDefault();
      }
      if (e.key === 'PrintScreen') {
        setBlurred(true);
        void navigator.clipboard?.writeText('').catch(() => undefined);
        window.setTimeout(() => setBlurred(false), 1200);
      }
    };
    const onHide = () => setBlurred(document.hidden);
    const onBlur = () => setBlurred(true);
    const onFocus = () => setBlurred(false);
    window.addEventListener('keydown', onKey);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  async function submitPhone(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      setUser(await authApi.setPhone(phone));
      setNeedPhone(false);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  async function toggleComplete() {
    try {
      if (completed) {
        await lessonsApi.uncomplete(lessonId);
        setCompleted(false);
      } else {
        await lessonsApi.complete(lessonId);
        setCompleted(true);
      }
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-slate-100"
      onContextMenu={(e) => e.preventDefault()}
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-2.5">
        <span className="truncate text-sm font-medium">{meta?.title ?? 'Secured notes'}</span>
        <div className="flex items-center gap-2">
          {meta && (
            <>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded border border-slate-700 px-2 py-1 text-sm disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-sm text-slate-400">
                {page} / {meta.pageCount}
              </span>
              <button
                type="button"
                disabled={page >= meta.pageCount}
                onClick={() => setPage((p) => Math.min(meta.pageCount, p + 1))}
                className="rounded border border-slate-700 px-2 py-1 text-sm disabled:opacity-40"
              >
                Next
              </button>
              <button
                type="button"
                onClick={toggleComplete}
                className="rounded bg-violet-600 px-3 py-1 text-sm hover:bg-violet-500"
              >
                {completed ? '✓ Completed' : 'Mark complete'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </header>

      <div className="relative flex-1 select-none overflow-auto p-4">
        {error && (
          <p className="mx-auto max-w-md rounded bg-rose-500/10 p-3 text-center text-sm text-rose-300">{error}</p>
        )}

        {needPhone && (
          <form
            onSubmit={submitPhone}
            className="mx-auto mt-10 max-w-sm space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-6"
          >
            <h2 className="text-lg font-medium">Add your phone number</h2>
            <p className="text-sm text-slate-400">
              Secured notes are watermarked with your details. Add a phone number to continue.
            </p>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Phone number"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-500"
            />
            <button type="submit" className="w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium hover:bg-violet-500">
              Save & open
            </button>
          </form>
        )}

        {meta && !needPhone && (
          <div className="mx-auto max-w-3xl">
            {pageData && pageData.page === page ? (
              <img
                src={pageData.url}
                alt={`Page ${page}`}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                className="mx-auto w-full rounded shadow-lg"
              />
            ) : (
              <p className="py-20 text-center text-slate-500">Loading page…</p>
            )}
          </div>
        )}

        {blurred && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
            <p className="text-slate-300">Content hidden — return focus to this tab to continue.</p>
          </div>
        )}
      </div>
    </div>
  );
}
