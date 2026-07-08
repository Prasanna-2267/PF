import { Badge, Button, buttonClasses } from '../../components/ui';
import {
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  FileTextIcon,
  LockIcon,
  RefreshIcon,
} from '../../components/ui/icons';
import { cn } from '../../lib/cn';
import { formatRupees } from '../../lib/format';
import type { Lesson } from '../lessons/lessons.api';

/**
 * Compact horizontal lesson row / row-card. State priority: Locked → Owned/Free.
 * Primary action:
 *   - free or owned PDF → "Open" (calls onOpen)
 *   - paid unowned (locked) → "Buy ₹X" (calls onBuy)
 *   - government link (ism) → "Visit resource" (opens externalUrl in a new tab)
 * Completed lessons still allow Open + Revise.
 */
export function LessonRow({
  lesson,
  onOpen,
  onBuy,
  onToggleDone,
  onRevise,
}: {
  lesson: Lesson;
  onOpen: () => void;
  onBuy: () => void;
  onToggleDone: () => void;
  onRevise: () => void;
}) {
  const isPdf = lesson.type === 'pdf';
  const meta = isPdf
    ? lesson.pageCount != null
      ? `${lesson.pageCount} page${lesson.pageCount === 1 ? '' : 's'}`
      : 'PDF notes'
    : 'Government link';

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-surface p-3 shadow-card transition-[border-color,box-shadow] duration-150 hover:border-primary/40 hover:shadow-pop sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
            isPdf ? 'bg-primary-soft text-primary-soft-fg' : 'bg-gold-soft text-gold-soft-fg',
          )}
          aria-hidden="true"
        >
          {isPdf ? <FileTextIcon size={18} /> : <ExternalLinkIcon size={18} />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">{lesson.title}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral" size="sm" icon={isPdf ? <FileTextIcon size={13} /> : <ExternalLinkIcon size={13} />}>
              {isPdf ? 'PDF' : 'Government Link'}
            </Badge>
            <span className={`text-xs text-muted${isPdf ? ' tabular' : ''}`}>{meta}</span>

            {lesson.isFree ? (
              <Badge tone="gold" size="sm">Free</Badge>
            ) : lesson.locked ? (
              <Badge tone="neutral" size="sm" icon={<LockIcon size={13} />}>Locked</Badge>
            ) : (
              <Badge tone="success" size="sm">Owned</Badge>
            )}

            {!lesson.isFree && !lesson.locked ? (
              <span className="text-xs font-bold tabular text-gold-strong">{formatRupees(lesson.price)}</span>
            ) : null}

            {lesson.completed ? (
              <Badge tone="success" size="sm" icon={<CheckIcon size={13} />}>Done</Badge>
            ) : null}

            {lesson.revisions > 0 ? (
              <Badge tone="neutral" size="sm">{lesson.revisions}× revised</Badge>
            ) : null}
          </div>

          {lesson.locked ? (
            <p className="mt-1.5 text-xs text-muted">Buy once to unlock — yours forever.</p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
        {lesson.locked ? (
          <Button size="sm" variant="primary" leftIcon={<LockIcon size={16} />} onClick={onBuy}>
            Buy {formatRupees(lesson.price)}
          </Button>
        ) : (
          <>
            {isPdf ? (
              <Button size="sm" variant="primary" leftIcon={<EyeIcon size={16} />} onClick={onOpen}>
                Open
              </Button>
            ) : (
              <a
                href={lesson.externalUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className={buttonClasses({ variant: 'primary', size: 'sm' })}
              >
                <ExternalLinkIcon size={16} />
                Visit resource
              </a>
            )}
            <Button
              size="sm"
              variant={lesson.completed ? 'subtle' : 'secondary'}
              leftIcon={lesson.completed ? <CheckIcon size={16} /> : undefined}
              onClick={onToggleDone}
            >
              {lesson.completed ? 'Done' : 'Mark done'}
            </Button>
            <Button size="sm" variant="ghost" leftIcon={<RefreshIcon size={16} />} onClick={onRevise}>
              Revise
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
