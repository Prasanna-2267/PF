import { useEffect, useRef, useState, type FormEvent } from 'react';
import { lessonsApi } from '../features/lessons/lessons.api';
import { authApi, errorInfo, errorMessage } from '../features/auth/auth.api';
import { useAuthStore } from '../lib/auth-store';

/**
 * In-app viewer for secured PDFs. Pages arrive ENCRYPTED (AES-GCM) — the
 * Network tab only sees ciphertext, never a downloadable image. The client
 * decrypts in memory and paints to a <canvas> (no <img>, no blob URL, nothing
 * to "Save image as"). Continuous scroll + zoom; pages lazy-load on scroll.
 * Client blocks (no right-click/select/drag, blur on focus loss / PrintScreen)
 * are DETERRENTS — a determined user with devtools can still read the canvas.
 * True prevention needs a native app. See docs/SECURITY.md.
 */
async function decryptPage(cipher: ArrayBuffer, keyB64: string): Promise<ArrayBuffer> {
  const rawKey = Uint8Array.from(atob(keyB64), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, false, ['decrypt']);
  const bytes = new Uint8Array(cipher);
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, key, bytes.slice(12));
}

export function SecureViewer({ lessonId, onClose }: { lessonId: string; onClose: () => void }) {
  const setUser = useAuthStore((s) => s.setUser);
  const [meta, setMeta] = useState<{ title: string; pageCount: number } | null>(null);
  const [viewKey, setViewKey] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState('');
  const [needPhone, setNeedPhone] = useState(false);
  const [phone, setPhone] = useState('');
  const [blurred, setBlurred] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    lessonsApi
      .view(lessonId)
      .then((m) => {
        if (!active) return;
        setMeta({ title: m.title, pageCount: m.pageCount });
        setViewKey(m.key);
        setCompleted(m.completed);
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

  // Blank the page if the user tries to print while the viewer is open.
  useEffect(() => {
    document.body.classList.add('viewer-open');
    return () => document.body.classList.remove('viewer-open');
  }, []);

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

  const clampZoom = (z: number) => Math.min(3, Math.max(0.5, Number(z.toFixed(2))));

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-slate-100"
      onContextMenu={(e) => e.preventDefault()}
    >
      <header className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-2.5">
        <span className="truncate text-sm font-medium">{meta?.title ?? 'Secured notes'}</span>
        <div className="flex items-center gap-2">
          {meta && !needPhone && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setZoom((z) => clampZoom(z - 0.25))}
                className="rounded border border-slate-700 px-2 py-1 text-sm hover:bg-slate-800"
                title="Zoom out"
              >
                −
              </button>
              <span className="w-12 text-center text-xs text-slate-400">{Math.round(zoom * 100)}%</span>
              <button
                type="button"
                onClick={() => setZoom((z) => clampZoom(z + 0.25))}
                className="rounded border border-slate-700 px-2 py-1 text-sm hover:bg-slate-800"
                title="Zoom in"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="rounded border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
                title="Reset zoom"
              >
                Reset
              </button>
            </div>
          )}
          {meta && (
            <button
              type="button"
              onClick={toggleComplete}
              className="rounded bg-violet-600 px-3 py-1 text-sm hover:bg-violet-500"
            >
              {completed ? '✓ Completed' : 'Mark complete'}
            </button>
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

        {meta && viewKey && !needPhone && (
          <div className="mx-auto space-y-4" style={{ width: `${Math.round(zoom * 800)}px`, maxWidth: '100%' }}>
            {Array.from({ length: meta.pageCount }, (_, i) => i + 1).map((p) => (
              <PageCanvas key={p} lessonId={lessonId} page={p} viewKey={viewKey} onError={setError} />
            ))}
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

/** One page — lazily fetched, decrypted, and painted to canvas when scrolled near. */
function PageCanvas({
  lessonId,
  page,
  viewKey,
  onError,
}: {
  lessonId: string;
  page: number;
  viewKey: string;
  onError: (message: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const startedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const load = async () => {
      try {
        const cipher = await lessonsApi.pageBytes(lessonId, page);
        const png = await decryptPage(cipher, viewKey);
        const bitmap = await createImageBitmap(new Blob([png], { type: 'image/png' }));
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
        }
        bitmap.close();
        setLoaded(true);
      } catch (err) {
        onError(errorMessage(err));
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !startedRef.current) {
          startedRef.current = true;
          io.disconnect();
          void load();
        }
      },
      { rootMargin: '800px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [lessonId, page, viewKey, onError]);

  return (
    <div ref={wrapRef} className={`relative w-full rounded bg-slate-900/40 ${loaded ? '' : 'min-h-[70vh]'}`}>
      <canvas
        ref={canvasRef}
        onContextMenu={(e) => e.preventDefault()}
        className={`block w-full rounded shadow-lg ${loaded ? '' : 'hidden'}`}
      />
      {!loaded && (
        <p className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">Page {page}…</p>
      )}
    </div>
  );
}
