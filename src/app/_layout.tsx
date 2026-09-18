import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope';
import * as SplashScreen from 'expo-splash-screen';
import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { AppLaunchScreen } from '@/components/app-launch-screen';
import { restoreSession } from '@/lib/auth-session';
import { AppProviders } from '@/providers/app-providers';

const MINIMUM_BRANDED_LAUNCH_MS = 2_000;

SplashScreen.preventAutoHideAsync();
export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  const [sessionRestored, setSessionRestored] = useState(false);
  const [nativeSplashHidden, setNativeSplashHidden] = useState(false);
  const [launchRevealComplete, setLaunchRevealComplete] = useState(false);
  useEffect(() => { void restoreSession().finally(() => setSessionRestored(true)); }, []);
  useEffect(() => {
    if (!fontsLoaded || nativeSplashHidden) return;
    const revealFrame = requestAnimationFrame(() => {
      setNativeSplashHidden(true);
      requestAnimationFrame(() => SplashScreen.hide());
    });
    return () => cancelAnimationFrame(revealFrame);
  }, [fontsLoaded, nativeSplashHidden]);
  useEffect(() => {
    if (!nativeSplashHidden) return;
    const timer = setTimeout(() => setLaunchRevealComplete(true), MINIMUM_BRANDED_LAUNCH_MS);
    return () => clearTimeout(timer);
  }, [nativeSplashHidden]);
  if (!nativeSplashHidden) return null;
  if (!sessionRestored || !launchRevealComplete) return <AppLaunchScreen />;
  return <AppProviders><Slot /></AppProviders>;
}
