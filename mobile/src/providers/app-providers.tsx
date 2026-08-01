import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { themes, type AppTheme, type ThemePreference } from '@/constants/theme';

const THEME_KEY = 'pf-theme';
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });
type ThemeContextValue = { theme: AppTheme; preference: ThemePreference; setPreference: (preference: ThemePreference) => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function AppProviders({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setStoredPreference] = useState<ThemePreference>('system');
  useEffect(() => { void AsyncStorage.getItem(THEME_KEY).then((saved) => { if (saved === 'light' || saved === 'dark' || saved === 'system') setStoredPreference(saved); }); }, []);
  const mode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo<ThemeContextValue>(() => ({ theme: themes[mode], preference, setPreference: (next) => { setStoredPreference(next); void AsyncStorage.setItem(THEME_KEY, next); } }), [mode, preference]);
  return <QueryClientProvider client={queryClient}><ThemeContext.Provider value={value}>{children}</ThemeContext.Provider></QueryClientProvider>;
}
export function useAppTheme() { const value = useContext(ThemeContext); if (!value) throw new Error('useAppTheme must be used inside AppProviders'); return value; }
