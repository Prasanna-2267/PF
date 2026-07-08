import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { Portal } from './Portal';
import { IconButton } from './IconButton';
import { CloseIcon } from './icons';

/** Side drawer — mobile navigation / admin nav. */
export function Drawer({
  open,
  onClose,
  side = 'left',
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  side?: 'left' | 'right';
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
      <div className="fixed inset-0 z-50">
        <div
          className="absolute inset-0 animate-fade-in bg-[var(--overlay)]"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'absolute inset-y-0 flex w-[86%] max-w-xs flex-col border-line bg-rail text-fg shadow-pop',
            side === 'left'
              ? 'left-0 animate-[pf-slide-in-left_0.24s_ease-out] border-r'
              : 'right-0 animate-[pf-slide-in-right_0.24s_ease-out] border-l',
            className,
          )}
        >
          {title ? (
            <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h2 className="text-base font-bold text-fg">{title}</h2>
              <IconButton aria-label="Close" icon={<CloseIcon />} onClick={onClose} />
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
        </div>
      </div>
    </Portal>
  );
}
