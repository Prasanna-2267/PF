import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { ThemePreference } from '@/constants/theme';

const THEME_KEY = 'pf-theme';
type ThemePreferenceState = { preference: ThemePreference; hydrated: boolean; hydrate: () => Promise<void>; setPreference: (preference: ThemePreference) => Promise<void> };

export const useThemePreferenceStore = create<ThemePreferenceState>((set) => ({
  preference: 'system', hydrated: false,
  hydrate: async () => {
    const saved = await AsyncStorage.getItem(THEME_KEY);
    set({ preference: saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system', hydrated: true });
  },
  setPreference: async (preference) => { set({ preference }); await AsyncStorage.setItem(THEME_KEY, preference); },
}));
