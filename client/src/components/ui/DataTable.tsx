import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  headerClassName?: string;
}

/** Responsive data table for admin workspaces. Scrolls horizontally on narrow screens. */
export function DataTable<T>({
  columns,
  rows,
  keyField,
  empty,
  dense = false,
  className,
  onRowClick,
}: {
  columns: Column<T>[];
  rows: T[];
  keyField: (row: T) => string;
  empty?: ReactNode;
  dense?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
}) {
  const alignClass = (a?: 'left' | 'right' | 'center') =>
    a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : 'text-left';

  return (
    <div className={cn('w-full overflow-x-auto rounded-card border border-line bg-surface', className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-sunken/60">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  'px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted',
                  alignClass(c.align),
                  c.headerClassName,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-muted">
                {empty ?? 'No records'}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={keyField(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-line last:border-0 hover:bg-sunken/40',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      dense ? 'px-3 py-2' : 'px-3 py-3',
                      'align-middle text-fg',
                      alignClass(c.align),
                      c.className,
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
