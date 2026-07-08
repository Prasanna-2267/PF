import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { ChevronRightIcon } from '../ui/icons';

export type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex flex-wrap items-center gap-1 text-sm', className)}>
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 ? <ChevronRightIcon size={14} className="text-faint" /> : null}
          {item.to && i < items.length - 1 ? (
            <Link to={item.to} className="text-muted transition-colors hover:text-fg">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-fg">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
