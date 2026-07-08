import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';
import { Field } from './Field';
import { Portal } from './Portal';
import { ChevronDownIcon, SearchIcon, CheckIcon } from './icons';

export type ComboOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

/** Searchable single-select. The popover is portaled + viewport-fixed so it is
 *  never clipped or hidden by ancestor overflow / stacking contexts. */
export function Combobox({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  searchable = true,
  disabled = false,
  label,
  hint,
  error,
  emptyText = 'No matches',
  className,
  buttonClassName,
}: {
  value: string | null;
  onChange: (value: string) => void;
  options: ComboOption[];
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  emptyText?: string;
  className?: string;
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pos = useAnchoredPosition(triggerRef, open);
  useOnClickOutside([triggerRef, panelRef], () => setOpen(false), open);

  const selected = options.find((o) => o.value === value) ?? null;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const choose = (opt: ComboOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && open) {
      e.preventDefault();
      const opt = filtered[active];
      if (opt) choose(opt);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Field label={label} hint={hint} error={error} className={className}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-field border bg-surface pl-3.5 pr-3 text-left text-[15px]',
          'outline-none transition-[border-color,box-shadow] duration-150',
          'focus-visible:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15',
          'disabled:cursor-not-allowed disabled:opacity-55',
          error ? 'border-danger' : 'border-line',
          buttonClassName,
        )}
      >
        <span className={cn('truncate', selected ? 'text-fg' : 'text-faint')}>
          {selected ? selected.label : placeholder}
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
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Search…"
                  className="h-10 w-full bg-transparent text-sm text-fg outline-none placeholder:text-faint"
                />
              </div>
            ) : null}
            <ul role="listbox" style={{ maxHeight: pos.maxHeight }} className="overflow-y-auto p-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted">{emptyText}</li>
              ) : (
                filtered.map((o, i) => {
                  const isSel = o.value === value;
                  return (
                    <li key={o.value} role="option" aria-selected={isSel}>
                      <button
                        type="button"
                        disabled={o.disabled}
                        onMouseEnter={() => setActive(i)}
                        onClick={() => choose(o)}
                        className={cn(
                          'flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-left text-sm',
                          'disabled:opacity-50',
                          i === active ? 'bg-primary-soft text-primary-soft-fg' : 'text-fg',
                        )}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{o.label}</span>
                          {o.description ? (
                            <span className="block truncate text-xs text-muted">
                              {o.description}
                            </span>
                          ) : null}
                        </span>
                        {isSel ? <CheckIcon size={16} className="shrink-0 text-primary" /> : null}
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
