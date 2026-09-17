import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { ThemePreference } from '@/constants/theme';

const THEME_KEY = 'pf-theme';
type ThemePreferenceState = { preference: ThemePreference; hydrated: boolean; hydrate: () => Promise<void>; setPreference: (preference: ThemePreference) => Promise<void> };

export const useThemePreferenceStore = create<ThemePreferenceState>((set) => ({
  preference: 'dark', hydrated: false,
  hydrate: async () => {
    await AsyncStorage.setItem(THEME_KEY, 'dark');
    set({ preference: 'dark', hydrated: true });
  },
  setPreference: async () => { set({ preference: 'dark' }); await AsyncStorage.setItem(THEME_KEY, 'dark'); },
}));
