import type { ReactNode } from 'react';
import { Wordmark } from './Wordmark';
import { ThemeToggle } from './ThemeToggle';

export function AppHeader({ sub, right }: { sub?: string; right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-6 py-3">
      <Wordmark sub={sub} />
      <div className="flex items-center gap-2">
        {right}
        <ThemeToggle />
      </div>
    </header>
  );
}
