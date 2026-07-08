import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Badge, Button, Modal, useToast, AlertTriangleIcon } from '../../components/ui';
import type { ButtonVariant } from '../../components/ui';
import { cn } from '../../lib/cn';
import { errorMessage } from '../../features/auth/auth.api';

type InvalidateKeys = unknown[][];

type RunOptions = {
  invalidate?: InvalidateKeys;
  success?: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

/**
 * Shared async-action runner for admin mutations. Fires the promise, invalidates
 * the given query keys on success, and surfaces feedback via toast. `pending`
 * drives button loading states. Use for fire-and-forget row actions (publish
 * toggles etc.); forms/deletes keep their own mutation to show inline errors.
 */
export function useAdminAction() {
  const qc = useQueryClient();
  const toast = useToast();
  const mutation = useMutation({ mutationFn: (fn: () => Promise<unknown>) => fn() });

  function run(fn: () => Promise<unknown>, options: RunOptions = {}): void {
    mutation.mutate(fn, {
      onSuccess: () => {
        options.invalidate?.forEach((key) => qc.invalidateQueries({ queryKey: key }));
        if (options.success) toast.success(options.success);
        options.onSuccess?.();
      },
      onError: (err) => {
        const message = errorMessage(err);
        if (options.onError) options.onError(message);
        else toast.error(message);
      },
    });
  }

  return { run, pending: mutation.isPending };
}

const CHIP_TONE: Record<'primary' | 'gold' | 'danger' | 'neutral', string> = {
  primary: 'bg-primary-soft text-primary-soft-fg',
  gold: 'bg-gold-soft text-gold-soft-fg',
  danger: 'bg-danger-soft text-danger-fg',
  neutral: 'bg-sunken text-muted',
};

/**
 * Soft tinted icon square for list rows, panel headers and modal titles —
 * purely decorative (`aria-hidden`), pair it with visible text.
 */
export function IconChip({
  icon,
  tone = 'primary',
  size = 'md',
  className,
}: {
  icon: ReactNode;
  tone?: keyof typeof CHIP_TONE;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex shrink-0 items-center justify-center',
        size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl',
        CHIP_TONE[tone],
        className,
      )}
    >
      {icon}
    </span>
  );
}

/** Published / Hidden status pill — colour plus text, never colour alone. */
export function PublishBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge tone="success" size="sm">
      Published
    </Badge>
  ) : (
    <Badge tone="neutral" size="sm">
      Hidden
    </Badge>
  );
}

/**
 * Confirmation dialog for any consequential admin action. Runs `onConfirm`; on
 * failure (e.g. a 409 guard or a self-action rejection) it keeps the dialog open
 * and shows the server's message so the admin understands *why*. Destructive by
 * default; pass `tone`/`confirmVariant` for non-destructive confirms (e.g. enable).
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  onConfirm,
  invalidate = [],
  success,
  onSuccess,
  tone = 'danger',
  confirmVariant = 'danger',
  errorTitle = 'Couldn’t complete this action',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  onConfirm: () => Promise<unknown>;
  invalidate?: InvalidateKeys;
  success?: string;
  onSuccess?: () => void;
  tone?: 'danger' | 'primary' | 'gold';
  confirmVariant?: ButtonVariant;
  errorTitle?: string;
}) {
  const qc = useQueryClient();
  const toast = useToast();
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) setError('');
  }, [open]);

  const mutation = useMutation({
    mutationFn: () => onConfirm(),
    onSuccess: () => {
      invalidate.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      if (success) toast.success(success);
      onSuccess?.();
      onClose();
    },
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2.5">
          <IconChip tone={tone} size="sm" icon={<AlertTriangleIcon size={16} />} />
          <span className="min-w-0">{title}</span>
        </span>
      }
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button variant={confirmVariant} loading={mutation.isPending} onClick={() => mutation.mutate()}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {description ? <div className="text-sm text-muted">{description}</div> : null}
        {error ? (
          <Alert tone="danger" title={errorTitle}>
            {error}
          </Alert>
        ) : null}
      </div>
    </Modal>
  );
}
