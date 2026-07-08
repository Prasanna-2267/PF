import { Link } from 'react-router-dom';
import { useAuthStore } from '../../lib/auth-store';
import { Wordmark } from '../brand';
import { Avatar, ThemeToggle } from '../ui';

/** Compact sticky top bar shown on mobile/tablet (<lg). */
export function MobileTopBar() {
  const user = useAuthStore((s) => s.user);
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/85 px-4 py-2.5 backdrop-blur lg:hidden print:hidden">
      <Link to="/dashboard" aria-label="Home">
        <Wordmark size="sm" />
      </Link>
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <Link
          to="/account"
          aria-label="Account"
          className="rounded-full p-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <Avatar name={user?.name ?? '?'} src={user?.avatarUrl} size="sm" />
        </Link>
      </div>
    </header>
  );
}
