import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { ChevronRightIcon, FileTextIcon, LibraryIcon, NotesIcon } from '../../components/ui/icons';
import type { PubSubject } from '../content/content.api';

/** Controlled hue variety — cycles per card index. Bold tile + soft wash. */
const HUES = [
  { tile: 'bg-primary text-primary-fg', wash: 'from-primary-soft/60' },
  { tile: 'bg-gold text-gold-fg', wash: 'from-gold-soft/60' },
  { tile: 'bg-success text-white', wash: 'from-success-soft/60' },
  { tile: 'bg-info text-white', wash: 'from-info-soft/55' },
  { tile: 'bg-indigo-500 text-white', wash: 'from-primary-soft/55' },
];

/** A subject as a rich, tappable card that drills into its own page. */
export function SubjectCard({ subject, index = 0 }: { subject: PubSubject; index?: number }) {
  const hue = HUES[index % HUES.length];
  const childCount = subject.children.length;
  const lessonCount = subject.lessonCount ?? 0;
  const isFolder = childCount > 0;

  return (
    <Link
      to={`/notes/${subject.id}`}
      className={cn(
        'pf-lift group relative flex min-h-[136px] flex-col overflow-hidden rounded-card border border-line bg-gradient-to-br to-transparent p-4 shadow-card',
        hue.wash,
      )}
    >
      {/* Lens-ring decoration */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-9 -top-10 h-24 w-24 rounded-full border border-line/70"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-3 -top-4 h-11 w-11 rounded-full border border-line/50"
      />

      <div className="relative flex items-start justify-between gap-2">
        <span
          className={cn(
            'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs',
            hue.tile,
          )}
        >
          {isFolder ? <LibraryIcon size={22} /> : <NotesIcon size={22} />}
        </span>
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface/70 text-faint transition-all duration-150 group-hover:translate-x-0.5 group-hover:bg-surface group-hover:text-primary">
          <ChevronRightIcon size={16} />
        </span>
      </div>

      <h3 className="relative mt-3 line-clamp-2 font-display text-base font-bold leading-snug text-fg">
        {subject.name}
      </h3>

      <div className="relative mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs font-semibold text-muted">
        <span className="inline-flex items-center gap-1">
          <FileTextIcon size={13} className="text-faint" />
          {lessonCount} lesson{lessonCount === 1 ? '' : 's'}
        </span>
        {childCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <NotesIcon size={13} className="text-faint" />
            {childCount} topic{childCount === 1 ? '' : 's'}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
