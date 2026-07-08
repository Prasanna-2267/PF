import { Link, NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuthStore } from '../../lib/auth-store';
import { useLogout } from '../../features/auth/useLogout';
import { EyeMark } from '../brand';
import { Avatar, ThemeToggle } from '../ui';
import { LogOutIcon, ShieldIcon } from '../ui/icons';
import { studentNav } from './nav-items';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-indigo-700 text-white shadow-xs'
      : 'text-white/60 hover:bg-white/10 hover:text-white',
  );

/**
 * Persistent desktop sidebar (≥lg). Deliberately dark navy in BOTH themes —
 * the brand's `navy-900` is the desktop-navigation colour (design system §4).
 */
export function SidebarNav() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-hidden bg-navy-900 lg:flex print:hidden">
      {/* Lens-motif decoration */}
      <span className="pf-hero-ring -right-20 -top-24 h-56 w-56" aria-hidden="true" />
      <span className="pf-hero-ring-gold -right-12 -top-14 h-36 w-36" aria-hidden="true" />

      <div className="relative px-5 pb-4 pt-5">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-white">
          <EyeMark size={24} />
          <span className="font-display text-lg font-extrabold tracking-tight">Parallax Flow</span>
        </Link>
        <span className="mt-4 block h-px bg-gradient-to-r from-gold-500/50 to-transparent" aria-hidden="true" />
      </div>

      <nav className="relative flex-1 space-y-1 px-3">
        {studentNav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
            {({ isActive }) => (
              <>
                <item.icon size={20} className={isActive ? 'text-gold-400' : undefined} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {isAdmin ? (
        <div className="relative px-3 pb-1">
          <Link
            to="/admin"
            className="flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ShieldIcon size={20} />
            Admin workspace
          </Link>
        </div>
      ) : null}

      <div className="relative border-t border-white/10 p-3">
        <Link
          to="/account"
          className="flex items-center gap-3 rounded-field p-2 transition-colors hover:bg-white/10"
        >
          <Avatar name={user?.name ?? '?'} src={user?.avatarUrl} size="sm" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">
              {user?.name ?? 'Account'}
            </span>
            <span className="block truncate text-xs text-white/50">{user?.email}</span>
          </span>
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void logout()}
            className="flex flex-1 items-center justify-center gap-2 rounded-field border border-white/15 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOutIcon size={16} />
            Log out
          </button>
          <ThemeToggle variant="inverse" />
        </div>
      </div>
    </aside>
  );
}
