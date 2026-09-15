import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { restoreSession } from '@/lib/auth-session';
import { AppProviders } from '@/providers/app-providers';

SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  const [sessionRestored, setSessionRestored] = useState(false);
  useEffect(() => { void restoreSession().finally(() => setSessionRestored(true)); }, []);
  useEffect(() => { if (fontsLoaded && sessionRestored) void SplashScreen.hideAsync(); }, [fontsLoaded, sessionRestored]);
  if (!fontsLoaded || !sessionRestored) return null;
  return <AppProviders><Slot /></AppProviders>;
}
