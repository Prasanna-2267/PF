import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { Portal } from './Portal';

/** Bottom sheet — the mobile-first container for filters and secondary actions. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div
          className="absolute inset-0 animate-fade-in bg-[var(--overlay)]"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'relative flex max-h-[88vh] w-full flex-col rounded-t-xl2 border-t border-line bg-surface text-fg shadow-pop',
            'animate-sheet-up pb-safe',
            className,
          )}
        >
          <div className="flex flex-col items-center pt-2.5">
            <span className="h-1.5 w-10 rounded-full bg-line-strong" aria-hidden="true" />
          </div>
          {title ? (
            <div className="px-5 pb-2 pt-3">
              <h2 className="text-base font-bold text-fg">{title}</h2>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-2">{children}</div>
        </div>
      </div>
    </Portal>
  );
}
