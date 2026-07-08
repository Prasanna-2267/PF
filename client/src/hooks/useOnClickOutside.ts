import { useEffect } from 'react';

/** Structural ref shape — accepts any React ref whose element is a Node. */
type OutsideRef = { readonly current: Node | null };

/**
 * Fire `handler` when a pointer/touch lands outside ALL of the given refs.
 * Accepts a single ref or several (e.g. a trigger + its portaled popover, so
 * clicking inside the popover doesn't count as "outside").
 */
export function useOnClickOutside(
  refs: OutsideRef | readonly OutsideRef[],
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;
    const list = Array.isArray(refs) ? refs : [refs as OutsideRef];
    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      for (const r of list) {
        const el = r.current;
        if (el && el.contains(target)) return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener, { passive: true });
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [refs, handler, enabled]);
}
