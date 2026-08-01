import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { ArrowLeft, LockKeyhole } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font, themes } from '@/constants/theme';
import { findLesson } from '@/lib/demo-catalog';
import { useAuthStore } from '@/lib/auth-store';
import { ProtectedPdfReader } from '@/components/protected-pdf-reader';
import { useAppTheme } from '@/providers/app-providers';

const captureProtectionKey = 'protected-lesson';
const allowDemoScreenShare = process.env.EXPO_PUBLIC_ALLOW_SCREEN_CAPTURE === 'true';

function PdfWatermarks({ email }: { email: string }) {
  const { theme } = useAppTheme();
  const entries = useMemo(() => Array.from({ length: 9 }, (_, index) => index), []);
  return <View style={styles.watermarkLayer}>{entries.map((entry) => <Text key={entry} style={[styles.watermark, { color: `${theme.primary}2E` }]}>{email}</Text>)}</View>;
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams();
  const { lesson } = findLesson(id);
  const router = useRouter();
  const { theme } = useAppTheme();
  const dark = theme.canvas === themes.dark.canvas;
  const email = useAuthStore((state) => state.user?.email ?? 'demo.student@parallaxflow.app');
  const [pages, setPages] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const handleLoadComplete = useCallback((numberOfPages: number) => { setPages(numberOfPages); setError(null); }, []);
  const handleReaderError = useCallback((message: string) => setError(message), []);

  useFocusEffect(useCallback(() => {
    if (Platform.OS === 'web') return;

    const releaseProtection = () => {
      void ScreenCapture.allowScreenCaptureAsync(captureProtectionKey);
      if (Platform.OS === 'ios') void ScreenCapture.disableAppSwitcherProtectionAsync();
    };

    if (allowDemoScreenShare) {
      // Also clears a secure flag left behind by Fast Refresh or a previous route instance.
      releaseProtection();
      return releaseProtection;
    }

    void ScreenCapture.preventScreenCaptureAsync(captureProtectionKey);
    if (Platform.OS === 'ios') void ScreenCapture.enableAppSwitcherProtectionAsync(1);
    return releaseProtection;
  }, []));

  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]} edges={['top', 'left', 'right']}>
    <View style={[styles.top, { backgroundColor: dark ? 'rgba(18,22,24,0.96)' : theme.surface, borderBottomColor: theme.line }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to notes" onPress={() => router.back()} style={[styles.topButton, { backgroundColor: theme.sunken, borderColor: theme.line }]}><ArrowLeft color={theme.fg} size={20} /></Pressable>
      <View style={styles.topCopy}>
        <Text numberOfLines={1} style={[styles.topTitle, { color: theme.fg }]}>{lesson.title}</Text>
        <Text numberOfLines={1} style={[styles.topSub, { color: theme.muted }]}>{pages} page sample PDF · continuous scroll · pinch to zoom</Text>
      </View>
      <View accessibilityLabel="Protected PDF" style={[styles.protectedBadge, { backgroundColor: theme.primarySoft, borderColor: dark ? 'rgba(124,156,255,0.32)' : theme.line }]}><LockKeyhole color={theme.primaryStrong} size={17} /><Text style={[styles.protectedText, { color: theme.primaryStrong }]}>Protected</Text></View>
    </View>
    <View style={[styles.reader, { backgroundColor: dark ? '#090B0D' : theme.sunken }]}>
      <ProtectedPdfReader onLoadComplete={handleLoadComplete} onError={handleReaderError} />
      <PdfWatermarks email={email} />
      {error ? <View style={[styles.error, { backgroundColor: theme.canvas }]}><Text style={[styles.errorTitle, { color: theme.fg }]}>Unable to open the sample PDF</Text><Text style={[styles.errorCopy, { color: theme.muted }]}>{error}</Text></View> : null}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  top: { minHeight: 68, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 10, borderBottomWidth: 1 },
  topButton: { width: 40, height: 40, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  topCopy: { flex: 1, minWidth: 0 },
  topTitle: { fontFamily: font.bold, fontSize: 14 },
  topSub: { fontFamily: font.regular, fontSize: 9, marginTop: 3 },
  protectedBadge: { height: 34, borderRadius: 17, borderWidth: 1, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  protectedText: { fontFamily: font.bold, fontSize: 9 },
  reader: { flex: 1 },
  watermarkLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', flexDirection: 'row', flexWrap: 'wrap', alignContent: 'space-around', justifyContent: 'space-around', paddingVertical: 28, paddingHorizontal: 10 },
  watermark: { width: '48%', fontFamily: font.bold, fontSize: 11, textAlign: 'center', transform: [{ rotate: '-28deg' }], marginVertical: 17 },
  error: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', padding: 28 },
  errorTitle: { fontFamily: font.bold, fontSize: 16, textAlign: 'center' },
  errorCopy: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, marginTop: 7, textAlign: 'center' },
});
