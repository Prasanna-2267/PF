import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { studentNav } from './nav-items';

/** Mobile bottom tab bar (<lg). */
export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-rail/95 pb-safe shadow-nav backdrop-blur lg:hidden print:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {studentNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold transition-colors',
                isActive ? 'text-primary' : 'text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-7 items-center justify-center rounded-full px-3.5 transition-all duration-200',
                    isActive ? 'bg-primary text-primary-fg shadow-xs' : 'text-muted',
                  )}
                >
                  <item.icon size={21} />
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
