import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'danger' | 'accent' | 'success';

const tones: Record<Tone, string> = {
  danger: 'bg-danger-soft text-danger',
  accent: 'bg-accent-soft text-accent',
  success: 'bg-success-soft text-success',
};

/** Inline message; renders nothing when empty. */
export function Alert({ tone = 'danger', children }: { tone?: Tone; children?: ReactNode }) {
  if (!children) return null;
  return <p className={cn('rounded-md px-3 py-2 text-sm', tones[tone])}>{children}</p>;
}
