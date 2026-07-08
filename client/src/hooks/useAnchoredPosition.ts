import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

export type AnchoredRect = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'top' | 'bottom';
};

/**
 * Viewport-fixed coordinates for a popover anchored to `ref`, recomputed on
 * scroll/resize. Flips above the trigger when there isn't room below. Pair with
 * a portal so the popover escapes ancestor `overflow`/stacking contexts.
 */
export function useAnchoredPosition<T extends HTMLElement>(
  ref: RefObject<T | null>,
  open: boolean,
  gap = 6,
): AnchoredRect | null {
  const [rect, setRect] = useState<AnchoredRect | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    const compute = () => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const below = vh - r.bottom;
      const above = r.top;
      const placement: 'top' | 'bottom' = below < 260 && above > below ? 'top' : 'bottom';
      const space = (placement === 'bottom' ? below : above) - gap - 8;
      setRect({
        top: placement === 'bottom' ? r.bottom + gap : r.top - gap,
        left: r.left,
        width: r.width,
        maxHeight: Math.max(160, Math.min(340, space)),
        placement,
      });
    };
    compute();
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [open, ref, gap]);

  return rect;
}
