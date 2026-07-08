import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/cn';

/** Light/dark theme toggle. Persisted in the theme store (localStorage). */
export function ThemeToggle({
  className,
  variant = 'default',
}: {
  className?: string;
  /** `inverse` for use on dark navy surfaces (sidebar, hero panels). */
  variant?: 'default' | 'inverse';
}) {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className={cn(
        'inline-flex h-11 w-11 items-center justify-center rounded-field transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        variant === 'inverse'
          ? 'text-white/70 hover:bg-white/10 hover:text-white'
          : 'text-muted hover:bg-sunken hover:text-fg',
        className,
      )}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
