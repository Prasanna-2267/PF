import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** Render children into a detached node appended to <body>. */
export function Portal({ children }: { children: ReactNode }) {
  const [el] = useState(() => document.createElement('div'));
  useEffect(() => {
    el.setAttribute('data-pf-portal', '');
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, [el]);
  return createPortal(children, el);
}
