import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';
import { Field } from './Field';
import { Portal } from './Portal';
import { ChevronDownIcon, SearchIcon, CloseIcon } from './icons';

export type MultiOption = { value: string; label: string; description?: string };

/** Multi-select with removable chips + searchable checkbox list. The popover is
 *  portaled + viewport-fixed so it is never clipped or hidden behind siblings. */
export function MultiSelect({
  values,
  onChange,
  options,
  placeholder = 'Select…',
  searchable = true,
  disabled = false,
  label,
  hint,
  error,
  emptyText = 'No matches',
  maxChips = 6,
  className,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiOption[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  emptyText?: string;
  maxChips?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pos = useAnchoredPosition(triggerRef, open);
  useOnClickOutside([triggerRef, panelRef], () => setOpen(false), open);

  const selectedSet = useMemo(() => new Set(values), [values]);
  const selectedOptions = options.filter((o) => selectedSet.has(o.value));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const toggle = (value: string) => {
    if (selectedSet.has(value)) onChange(values.filter((v) => v !== value));
    else onChange([...values, value]);
  };

  const chips = selectedOptions.slice(0, maxChips);
  const overflow = selectedOptions.length - chips.length;

  return (
    <Field label={label} hint={hint} error={error} className={className}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex min-h-11 w-full items-center justify-between gap-2 rounded-field border bg-surface px-2.5 py-1.5 text-left',
          'outline-none transition-[border-color,box-shadow] duration-150',
          'focus-visible:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15',
          'disabled:cursor-not-allowed disabled:opacity-55',
          error ? 'border-danger' : 'border-line',
        )}
      >
        <span className="flex flex-1 flex-wrap items-center gap-1.5">
          {selectedOptions.length === 0 ? (
            <span className="px-1 text-[15px] text-faint">{placeholder}</span>
          ) : (
            <>
              {chips.map((o) => (
                <span
                  key={o.value}
                  className="inline-flex items-center gap-1 rounded-md bg-primary-soft py-0.5 pl-2 pr-1 text-xs font-medium text-primary-soft-fg"
                >
                  {o.label}
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`Remove ${o.label}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(o.value);
                    }}
                    className="rounded p-0.5 hover:bg-black/10"
                  >
                    <CloseIcon size={12} />
                  </span>
                </span>
              ))}
              {overflow > 0 ? (
                <span className="text-xs font-medium text-muted">+{overflow} more</span>
              ) : null}
            </>
          )}
        </span>
        <ChevronDownIcon
          size={16}
          className={cn('shrink-0 text-faint transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && pos ? (
        <Portal>
          <div
            ref={panelRef}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              transform: pos.placement === 'top' ? 'translateY(-100%)' : undefined,
              zIndex: 60,
            }}
            className="animate-fade-in overflow-hidden rounded-field border border-line bg-elevated shadow-pop"
          >
            {searchable ? (
              <div className="flex items-center gap-2 border-b border-line px-3">
                <SearchIcon size={16} className="text-faint" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="h-10 w-full bg-transparent text-sm text-fg outline-none placeholder:text-faint"
                />
              </div>
            ) : null}
            <ul
              role="listbox"
              aria-multiselectable
              style={{ maxHeight: pos.maxHeight }}
              className="overflow-y-auto p-1"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted">{emptyText}</li>
              ) : (
                filtered.map((o) => {
                  const checked = selectedSet.has(o.value);
                  return (
                    <li key={o.value} role="option" aria-selected={checked}>
                      <button
                        type="button"
                        onClick={() => toggle(o.value)}
                        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-fg hover:bg-sunken"
                      >
                        <span
                          className={cn(
                            'flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-[5px] border',
                            checked
                              ? 'border-primary bg-primary text-primary-fg'
                              : 'border-line-strong',
                          )}
                        >
                          {checked ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path
                                d="m5 12 5 5 9-11"
                                stroke="currentColor"
                                strokeWidth="2.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{o.label}</span>
                          {o.description ? (
                            <span className="block truncate text-xs text-muted">
                              {o.description}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        </Portal>
      ) : null}
    </Field>
  );
}
