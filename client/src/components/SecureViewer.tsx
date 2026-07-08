import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { lessonsApi } from '../features/lessons/lessons.api';
import { authApi, errorInfo, errorMessage } from '../features/auth/auth.api';
import { useAuthStore } from '../lib/auth-store';
import { cn } from '../lib/cn';
import {
  ArrowLeftIcon,
  ZoomInIcon,
  ZoomOutIcon,
  CheckIcon,
  ShieldIcon,
  CloseIcon,
  EyeIcon,
  LockIcon,
} from './ui/icons';

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

function ToolButton({
  onClick,
  title,
  children,
  className,
}: {
  onClick: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function SecureViewer({ lessonId, onClose }: { lessonId: string; onClose: () => void }) {
  const setUser = useAuthStore((s) => s.setUser);
  const [meta, setMeta] = useState<{ title: string; pageCount: number } | null>(null);
  const [viewKey, setViewKey] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState('');
  const [needPhone, setNeedPhone] = useState(false);
  const [needPurchase, setNeedPurchase] = useState(false);
  const [phone, setPhone] = useState('');
  const [blurred, setBlurred] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showNotice, setShowNotice] = useState(true);

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
        else if (status === 402 || code === 'PURCHASE_REQUIRED') setNeedPurchase(true);
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
      className="fixed inset-0 z-50 flex flex-col bg-[#0b1020] text-white"
      onContextMenu={(e) => e.preventDefault()}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-white/[0.03] px-3 py-2.5 backdrop-blur sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <ToolButton onClick={onClose} title="Back" className="px-2">
            <ArrowLeftIcon size={18} />
          </ToolButton>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{meta?.title ?? 'Secured notes'}</p>
            {meta ? (
              <p className="text-[11px] text-white/45 tabular">{meta.pageCount} pages</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {meta && !needPhone ? (
            <div className="hidden items-center rounded-xl bg-white/5 p-0.5 sm:flex">
              <ToolButton onClick={() => setZoom((z) => clampZoom(z - 0.25))} title="Zoom out">
                <ZoomOutIcon size={17} />
              </ToolButton>
              <button
                type="button"
                onClick={() => setZoom(1)}
                title="Reset zoom"
                className="w-14 text-center text-xs font-semibold text-white/70 tabular hover:text-white"
              >
                {Math.round(zoom * 100)}%
              </button>
              <ToolButton onClick={() => setZoom((z) => clampZoom(z + 0.25))} title="Zoom in">
                <ZoomInIcon size={17} />
              </ToolButton>
            </div>
          ) : null}

          {meta ? (
            <button
              type="button"
              onClick={toggleComplete}
              className={cn(
                'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors',
                completed
                  ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-white text-navy-900 hover:bg-white/90',
              )}
            >
              <CheckIcon size={16} />
              <span className="hidden sm:inline">{completed ? 'Completed' : 'Mark complete'}</span>
            </button>
          ) : null}

          <ToolButton onClick={onClose} title="Close" className="px-2">
            <CloseIcon size={18} />
          </ToolButton>
        </div>
      </header>

      {showNotice && meta && !needPhone ? (
        <div className="flex items-center gap-2.5 border-b border-white/10 bg-white/[0.02] px-4 py-2 text-xs text-white/70">
          <ShieldIcon size={16} className="shrink-0 text-gold-400" />
          <p className="flex-1">
            Protected study material — this content is personalised and watermarked for your account.
          </p>
          <button
            type="button"
            onClick={() => setShowNotice(false)}
            className="rounded p-1 text-white/50 hover:text-white"
            aria-label="Dismiss"
          >
            <CloseIcon size={14} />
          </button>
        </div>
      ) : null}

      <div className="relative flex-1 select-none overflow-auto p-4">
        {error ? (
          <div className="mx-auto max-w-md rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-center text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {needPhone ? (
          <form
            onSubmit={submitPhone}
            className="mx-auto mt-10 max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-400/15 text-gold-400">
              <ShieldIcon size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold">Add your phone number</h2>
              <p className="mt-1 text-sm text-white/60">
                Secured notes are watermarked with your details. A verified contact number is
                required before secure content can open.
              </p>
            </div>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              inputMode="tel"
              placeholder="Phone number"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/5 px-3.5 text-[15px] text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/40"
            />
            <button
              type="submit"
              className="h-11 w-full rounded-xl bg-white text-sm font-semibold text-navy-900 transition-colors hover:bg-white/90"
            >
              Save &amp; open
            </button>
          </form>
        ) : null}

        {meta && viewKey && !needPhone ? (
          <div
            className="mx-auto space-y-4"
            style={{ width: `${Math.round(zoom * 800)}px`, maxWidth: '100%' }}
          >
            {Array.from({ length: meta.pageCount }, (_, i) => i + 1).map((p) => (
              <PageCanvas key={p} lessonId={lessonId} page={p} viewKey={viewKey} onError={setError} />
            ))}
          </div>
        ) : null}

        {needPurchase ? (
          <div className="mx-auto mt-10 max-w-sm space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-400/15 text-gold-400">
              <LockIcon size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold">This is a paid lesson</h2>
              <p className="mt-1 text-sm text-white/60">
                You don&apos;t own this lesson yet. Buy it from Notes to read it — access is instant
                and yours forever.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-11 w-full rounded-xl bg-white text-sm font-semibold text-navy-900 transition-colors hover:bg-white/90"
            >
              Back to notes
            </button>
          </div>
        ) : null}

        {!meta && !needPhone && !needPurchase && !error ? (
          <div className="mx-auto max-w-md space-y-4 pt-10">
            <div className="h-[70vh] w-full animate-shimmer rounded-xl bg-white/5" />
          </div>
        ) : null}

        {blurred ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0b1020]/92 text-center backdrop-blur-xl">
            <EyeIcon size={30} className="text-white/40" />
            <p className="max-w-xs text-sm text-white/70">
              Content hidden — return focus to this tab to continue reading.
            </p>
          </div>
        ) : null}
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
    <div
      ref={wrapRef}
      className={cn(
        'relative w-full overflow-hidden rounded-lg',
        loaded ? 'shadow-[0_6px_30px_rgba(0,0,0,0.4)] ring-1 ring-white/10' : 'min-h-[70vh] bg-white/5',
      )}
    >
      <canvas
        ref={canvasRef}
        onContextMenu={(e) => e.preventDefault()}
        className={cn('block w-full', loaded ? '' : 'hidden')}
      />
      {!loaded ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/40 tabular">
            Page {page}…
          </span>
        </div>
      ) : null}
    </div>
  );
}
