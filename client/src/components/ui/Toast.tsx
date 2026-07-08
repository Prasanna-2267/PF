import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Portal } from './Portal';
import {
  CheckCircleIcon,
  InfoIcon,
  AlertTriangleIcon,
  CloseIcon,
} from './icons';

export type ToastTone = 'success' | 'danger' | 'info' | 'warn';

export interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  tone?: ToastTone;
  duration?: number;
}

interface ToastItem extends Required<Pick<ToastOptions, 'tone'>> {
  id: number;
  title?: ReactNode;
  description?: ReactNode;
  duration: number;
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => number;
  success: (message: ReactNode, opts?: Omit<ToastOptions, 'tone' | 'title'>) => number;
  error: (message: ReactNode, opts?: Omit<ToastOptions, 'tone' | 'title'>) => number;
  info: (message: ReactNode, opts?: Omit<ToastOptions, 'tone' | 'title'>) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneIcon: Record<ToastTone, ReactNode> = {
  success: <CheckCircleIcon size={18} />,
  danger: <AlertTriangleIcon size={18} />,
  warn: <AlertTriangleIcon size={18} />,
  info: <InfoIcon size={18} />,
};

const toneAccent: Record<ToastTone, string> = {
  success: 'text-success',
  danger: 'text-danger',
  warn: 'text-warn',
  info: 'text-info',
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((opts: ToastOptions) => {
    const id = ++counter;
    const item: ToastItem = {
      id,
      title: opts.title,
      description: opts.description,
      tone: opts.tone ?? 'info',
      duration: opts.duration ?? 4200,
    };
    setItems((list) => [...list, item]);
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      dismiss,
      success: (message, opts) => toast({ ...opts, tone: 'success', title: message }),
      error: (message, opts) => toast({ ...opts, tone: 'danger', title: message }),
      info: (message, opts) => toast({ ...opts, tone: 'info', title: message }),
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {items.length > 0 ? (
        <Portal>
          <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2 p-3 sm:inset-x-auto sm:right-0 sm:items-end">
            {items.map((t) => (
              <ToastCard key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
            ))}
          </div>
        </Portal>
      ) : null}
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    timer.current = window.setTimeout(onDismiss, item.duration);
    return () => window.clearTimeout(timer.current);
  }, [item.duration, onDismiss]);

  return (
    <div
      role="status"
      className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-card border border-line bg-elevated p-3.5 text-fg shadow-pop"
    >
      <span className={cn('mt-0.5 shrink-0', toneAccent[item.tone])}>{toneIcon[item.tone]}</span>
      <div className="min-w-0 flex-1">
        {item.title ? <p className="text-sm font-semibold leading-snug">{item.title}</p> : null}
        {item.description ? (
          <p className="mt-0.5 text-sm text-muted">{item.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-0.5 text-faint transition-colors hover:text-fg"
      >
        <CloseIcon size={16} />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
