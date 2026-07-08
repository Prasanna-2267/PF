import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';
import { Portal } from './Portal';
import { IconButton } from './IconButton';
import { CloseIcon } from './icons';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const sizeClass: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
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
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
        <div
          className="absolute inset-0 animate-fade-in bg-[var(--overlay)]"
          onClick={closeOnBackdrop ? onClose : undefined}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            'relative flex max-h-[92vh] w-full flex-col rounded-t-xl2 border border-line bg-surface text-fg shadow-pop',
            'animate-slide-up sm:rounded-card',
            sizeClass[size],
            className,
          )}
        >
          {(title || description) && (
            <div className="flex items-start justify-between gap-4 border-b border-line p-5">
              <div className="min-w-0">
                {title ? <h2 className="text-lg font-bold text-fg">{title}</h2> : null}
                {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
              </div>
              <IconButton
                aria-label="Close"
                icon={<CloseIcon />}
                onClick={onClose}
                className="-mr-1.5 -mt-1"
              />
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
          {footer ? (
            <div className="flex items-center justify-end gap-2 border-t border-line p-4">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </Portal>
  );
}
