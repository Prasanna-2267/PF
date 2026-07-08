import { useEffect, useState } from 'react';

/** Subscribe to a CSS media query. SSR-safe (defaults to false on the server). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** True at the `lg` breakpoint and up (>=1024px) — our desktop threshold. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/** True below `md` (<768px) — the phone layout. */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
