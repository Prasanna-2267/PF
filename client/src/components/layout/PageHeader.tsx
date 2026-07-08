import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';

/** Standard page title block: optional breadcrumbs, gold eyebrow, title, description + actions. */
export function PageHeader({
  breadcrumbs,
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  breadcrumbs?: Crumb[];
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-5 sm:mb-6', className)}>
      {breadcrumbs ? <Breadcrumbs items={breadcrumbs} className="mb-3" /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gold-strong">
              <span className="pf-gold-rule" aria-hidden="true" />
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-display text-[26px] font-bold tracking-tight text-fg sm:text-3xl">
            {title}
          </h1>
          {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
