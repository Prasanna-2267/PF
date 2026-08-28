import { QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { themes, type AppTheme, type ThemePreference } from '@/constants/theme';
import { queryClient } from '@/lib/query-client';
import { RocketLaunchProvider } from '@/providers/rocket-launch-provider';
import { NotificationBootstrap } from '@/components/notification-bootstrap';
import { useThemePreferenceStore } from '@/lib/theme-preference-store';

type ThemeContextValue = { theme: AppTheme; preference: ThemePreference; setPreference: (preference: ThemePreference) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppProviders({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const preference = useThemePreferenceStore((state) => state.preference);
  const hydrate = useThemePreferenceStore((state) => state.hydrate);
  const storePreference = useThemePreferenceStore((state) => state.setPreference);
  useEffect(() => { void hydrate(); }, [hydrate]);
  const mode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo<ThemeContextValue>(() => ({ theme: themes[mode], preference, setPreference: (next) => { void storePreference(next); } }), [mode, preference, storePreference]);
  return <QueryClientProvider client={queryClient}><ThemeContext.Provider value={value}><RocketLaunchProvider><NotificationBootstrap />{children}</RocketLaunchProvider></ThemeContext.Provider></QueryClientProvider>;
}
export function useAppTheme() { const value = useContext(ThemeContext); if (!value) throw new Error('useAppTheme must be used inside AppProviders'); return value; }
