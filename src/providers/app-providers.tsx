import { QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';
import { themes, type AppTheme, type ThemePreference } from '@/constants/theme';
import { queryClient } from '@/lib/query-client';
import { RocketLaunchProvider } from '@/providers/rocket-launch-provider';
import { NotificationBootstrap } from '@/components/notification-bootstrap';
import { useThemePreferenceStore } from '@/lib/theme-preference-store';

type ThemeContextValue = { theme: AppTheme; preference: ThemePreference; setPreference: (preference: ThemePreference) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppProviders({ children }: PropsWithChildren) {
  const hydrate = useThemePreferenceStore((state) => state.hydrate);
  const storePreference = useThemePreferenceStore((state) => state.setPreference);
  useEffect(() => { void hydrate(); }, [hydrate]);
  const value = useMemo<ThemeContextValue>(() => ({ theme: themes.dark, preference: 'dark', setPreference: () => { void storePreference('dark'); } }), [storePreference]);
  return <QueryClientProvider client={queryClient}><ThemeContext.Provider value={value}><RocketLaunchProvider><NotificationBootstrap />{children}</RocketLaunchProvider></ThemeContext.Provider></QueryClientProvider>;
}
export function useAppTheme() { const value = useContext(ThemeContext); if (!value) throw new Error('useAppTheme must be used inside AppProviders'); return value; }
