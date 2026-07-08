import { useState } from 'react';
import { cn } from '../../lib/cn';
import type { PubSubject } from '../content/content.api';
import { ChevronRightIcon } from '../../components/ui/icons';

/** Recursive subject navigator. Handles arbitrary nesting with a guide-line indent. */
export function SubjectTree({
  nodes,
  selectedId,
  onSelect,
  className,
}: {
  nodes: PubSubject[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <ul role="tree" className={cn('space-y-0.5', className)}>
      {nodes.map((n) => (
        <TreeNode key={n.id} node={n} depth={0} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </ul>
  );
}

function TreeNode({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: PubSubject;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const [open, setOpen] = useState(depth < 1);
  const selected = node.id === selectedId;

  return (
    <li role="treeitem" aria-selected={selected} aria-expanded={hasChildren ? open : undefined}>
      <div
        className={cn(
          'flex items-center rounded-field transition-colors',
          selected ? 'bg-primary-soft' : 'hover:bg-sunken',
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Collapse' : 'Expand'}
            className="flex h-8 w-7 items-center justify-center text-faint"
          >
            <ChevronRightIcon
              size={15}
              className={cn('transition-transform duration-150', open && 'rotate-90')}
            />
          </button>
        ) : (
          <span className="w-7" />
        )}
        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className={cn(
            'flex-1 truncate py-2 pr-2 text-left text-sm transition-colors',
            selected ? 'font-semibold text-primary-soft-fg' : 'text-fg',
          )}
        >
          {node.name}
        </button>
      </div>
      {hasChildren && open ? (
        <ul role="group" className="ml-3.5 space-y-0.5 border-l border-line pl-1">
          {node.children.map((c) => (
            <TreeNode
              key={c.id}
              node={c}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}
