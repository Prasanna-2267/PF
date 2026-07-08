import { Link, NavLink, Outlet } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuthStore } from '../../lib/auth-store';
import { useLogout } from '../../features/auth/useLogout';
import { useDisclosure } from '../../hooks';
import { EyeMark } from '../brand';
import { Avatar, Badge, Drawer, IconButton, ThemeToggle } from '../ui';
import { ArrowLeftIcon, LogOutIcon, MenuIcon } from '../ui/icons';
import { adminNav } from './nav-items';

const navyLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-indigo-700 text-white shadow-xs'
      : 'text-white/60 hover:bg-white/10 hover:text-white',
  );

const lightLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-field px-3 py-2.5 text-sm font-semibold transition-colors',
    isActive ? 'bg-primary-soft text-primary-soft-fg' : 'text-muted hover:bg-sunken hover:text-fg',
  );

function AdminBrand({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', inverse ? 'text-white' : 'text-brand')}>
      <EyeMark size={22} />
      <span className="font-display text-base font-extrabold tracking-tight">Parallax Flow</span>
      <Badge tone="gold" size="sm">
        Admin
      </Badge>
    </span>
  );
}

function AdminNavList({ inverse = false, onNavigate }: { inverse?: boolean; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {adminNav.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={inverse ? navyLink : lightLink}
        >
          {({ isActive }) => (
            <>
              <item.icon size={20} className={inverse && isActive ? 'text-gold-400' : undefined} />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

/** Desktop-first admin workspace shell: navy sidebar + a mobile drawer. */
export function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const drawer = useDisclosure();

  return (
    <div className="min-h-dvh bg-canvas">
      {/* Desktop sidebar — brand navy, matching the student shell */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-hidden bg-navy-900 lg:flex print:hidden">
        <span className="pf-hero-ring -right-20 -top-24 h-56 w-56" aria-hidden="true" />
        <span className="pf-hero-ring-gold -right-12 -top-14 h-36 w-36" aria-hidden="true" />

        <div className="relative px-5 pb-4 pt-5">
          <AdminBrand inverse />
          <span className="mt-4 block h-px bg-gradient-to-r from-gold-500/50 to-transparent" aria-hidden="true" />
        </div>
        <div className="relative flex-1 px-3">
          <AdminNavList inverse />
        </div>
        <div className="relative space-y-2 border-t border-white/10 p-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-field px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeftIcon size={16} />
            Back to app
          </Link>
          <div className="flex items-center gap-2 rounded-field p-2">
            <Avatar name={user?.name ?? '?'} src={user?.avatarUrl} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-white">{user?.name}</span>
              <span className="block truncate text-xs text-white/50">{user?.email}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
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

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-rail/90 px-4 py-2.5 backdrop-blur lg:hidden print:hidden">
        <IconButton aria-label="Open menu" icon={<MenuIcon />} onClick={drawer.open} />
        <AdminBrand />
        <ThemeToggle />
      </header>

      <Drawer open={drawer.isOpen} onClose={drawer.close} title="Admin">
        <AdminNavList onNavigate={drawer.close} />
        <div className="mt-4 space-y-2 border-t border-line pt-4">
          <Link
            to="/dashboard"
            onClick={drawer.close}
            className="flex items-center gap-2 rounded-field px-3 py-2 text-sm font-medium text-muted hover:bg-sunken hover:text-fg"
          >
            <ArrowLeftIcon size={16} />
            Back to app
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-2 rounded-field px-3 py-2 text-sm font-semibold text-muted hover:bg-sunken hover:text-fg"
          >
            <LogOutIcon size={16} />
            Log out
          </button>
        </div>
      </Drawer>

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
