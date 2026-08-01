import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { ArrowLeft, LockKeyhole } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font } from '@/constants/theme';
import { findLesson } from '@/lib/demo-catalog';
import { useAuthStore } from '@/lib/auth-store';
import { ProtectedPdfReader } from '@/components/protected-pdf-reader';

function PdfWatermarks({ email }: { email: string }) {
  const entries = useMemo(() => Array.from({ length: 9 }, (_, index) => index), []);
  return <View style={styles.watermarkLayer}>{entries.map((entry) => <Text key={entry} style={styles.watermark}>{email}</Text>)}</View>;
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams();
  const { lesson } = findLesson(id);
  const router = useRouter();
  const email = useAuthStore((state) => state.user?.email ?? 'demo.student@parallaxflow.app');
  const [pages, setPages] = useState(5);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void ScreenCapture.preventScreenCaptureAsync('protected-lesson');
    if (Platform.OS === 'ios') void ScreenCapture.enableAppSwitcherProtectionAsync(1);
    return () => {
      void ScreenCapture.allowScreenCaptureAsync('protected-lesson');
      if (Platform.OS === 'ios') void ScreenCapture.disableAppSwitcherProtectionAsync();
    };
  }, []);


  return <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
    <View style={styles.top}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to notes" onPress={() => router.back()} style={styles.topButton}><ArrowLeft color="#FFFFFF" size={21} /></Pressable>
      <View style={styles.topCopy}>
        <Text numberOfLines={1} style={styles.topTitle}>{lesson.title}</Text>
        <Text style={styles.topSub}>{pages} page sample PDF · scroll and pinch to zoom</Text>
      </View>
      <View accessibilityLabel="Protected PDF" style={styles.topButton}><LockKeyhole color="#D8BC86" size={19} /></View>
    </View>
    <View style={styles.reader}>
      <ProtectedPdfReader onLoadComplete={(numberOfPages: number) => { setPages(numberOfPages); setError(null); }} onError={setError} />
      <PdfWatermarks email={email} />
      {error ? <View style={styles.error}><Text style={styles.errorTitle}>Unable to open the sample PDF</Text><Text style={styles.errorCopy}>{error}</Text></View> : null}
    </View>

  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D1226' },
  top: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 13, gap: 10, borderBottomWidth: 1, borderBottomColor: '#2F3A61' },
  topButton: { width: 39, height: 39, borderRadius: 12, backgroundColor: '#1B254B', alignItems: 'center', justifyContent: 'center' },
  topCopy: { flex: 1, minWidth: 0 },
  topTitle: { color: '#FFFFFF', fontFamily: font.bold, fontSize: 14 },
  topSub: { color: '#AAB4D4', fontFamily: font.regular, fontSize: 10, marginTop: 3 },
  protectionNotice: { minHeight: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, backgroundColor: '#141C3A' },
  protectionText: { color: '#C7D0EE', fontFamily: font.medium, fontSize: 10 },
  reader: { flex: 1, backgroundColor: '#0A0F20' },
  watermarkLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', flexDirection: 'row', flexWrap: 'wrap', alignContent: 'space-around', justifyContent: 'space-around', paddingVertical: 28, paddingHorizontal: 10 },
  watermark: { width: '48%', color: 'rgba(25,35,80,0.18)', fontFamily: font.bold, fontSize: 11, textAlign: 'center', transform: [{ rotate: '-28deg' }], marginVertical: 17 },
  error: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#0A0F20' },
  errorTitle: { color: '#FFFFFF', fontFamily: font.bold, fontSize: 16, textAlign: 'center' },
  errorCopy: { color: '#B6C0E4', fontFamily: font.regular, fontSize: 12, lineHeight: 18, marginTop: 7, textAlign: 'center' },
});
