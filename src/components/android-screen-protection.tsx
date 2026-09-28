import * as ScreenCapture from 'expo-screen-capture';
import { usePathname } from 'expo-router';
import { useLayoutEffect } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

const protectionKey = 'parallax-flow-student-app';
const profilePath = '/account';

function applyProtection(pathname: string, appState: AppStateStatus) {
  if (Platform.OS !== 'android') return;

  const profileIsActivelyVisible = pathname === profilePath && appState === 'active';
  if (profileIsActivelyVisible) {
    void ScreenCapture.allowScreenCaptureAsync(protectionKey);
    return;
  }

  void ScreenCapture.preventScreenCaptureAsync(protectionKey);
}

export function AndroidScreenProtection() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (Platform.OS !== 'android') return;

    applyProtection(pathname, AppState.currentState);
    const subscription = AppState.addEventListener('change', (nextState) => {
      applyProtection(pathname, nextState);
    });

    return () => {
      subscription.remove();
      if (pathname === profilePath) {
        void ScreenCapture.preventScreenCaptureAsync(protectionKey);
      }
    };
  }, [pathname]);

  return null;
}
