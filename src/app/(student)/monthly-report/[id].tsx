import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { ArrowLeft, LockKeyhole, RefreshCw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProtectedPdfReader } from '@/components/protected-pdf-reader';
import { font } from '@/constants/theme';
import { getAuthErrorMessage } from '@/lib/auth-session';
import {
  closeMonthlyReportViewerSession,
  createMonthlyReportViewerSession,
  monthlyReportContentSource,
  type MonthlyReportViewerSession,
} from '@/lib/monthly-report-api';
import { useAppTheme } from '@/providers/app-providers';

const captureKey = 'monthly-report-viewer';

export default function MonthlyReportViewerScreen() {
  const { id, label } = useLocalSearchParams<{ id: string; label?: string }>();
  const router = useRouter();
  const { theme } = useAppTheme();
  const [session, setSession] = useState<MonthlyReportViewerSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;
    let opened: string | null = null;

    void createMonthlyReportViewerSession(id)
      .then((value) => {
        opened = value.viewerSessionId;
        if (active) setSession(value);
        else void closeMonthlyReportViewerSession(value.viewerSessionId).catch(() => undefined);
      })
      .catch((reason: unknown) => {
        if (active) setError(getAuthErrorMessage(reason));
      });

    return () => {
      active = false;
      if (opened) void closeMonthlyReportViewerSession(opened).catch(() => undefined);
    };
  }, [attempt, id]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void ScreenCapture.preventScreenCaptureAsync(captureKey);
    if (Platform.OS === 'ios') void ScreenCapture.enableAppSwitcherProtectionAsync(1);
    return () => {
      void ScreenCapture.allowScreenCaptureAsync(captureKey);
      if (Platform.OS === 'ios') void ScreenCapture.disableAppSwitcherProtectionAsync();
    };
  }, []);

  const fail = useCallback((message: string) => setError(message), []);
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/monthly-reports');
  const retry = () => {
    setSession(null);
    setError(null);
    setAttempt((value) => value + 1);
  };

  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]} edges={['top', 'left', 'right']}>
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.line }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to monthly reports" onPress={goBack} style={[styles.back, { backgroundColor: theme.sunken, borderColor: theme.line }]}>
        <ArrowLeft color={theme.fg} size={20} />
      </Pressable>
      <View style={styles.copy}>
        <Text numberOfLines={1} style={[styles.title, { color: theme.fg }]}>{label ?? session?.report.title ?? 'Monthly Report'}</Text>
        <Text style={[styles.sub, { color: theme.muted }]}>Secure PDF · continuous scroll · pinch to zoom</Text>
      </View>
      <View style={[styles.protected, { backgroundColor: theme.primarySoft, borderColor: theme.line }]}>
        <LockKeyhole color={theme.primaryStrong} size={16} />
        <Text style={[styles.protectedText, { color: theme.primaryStrong }]}>Protected</Text>
      </View>
    </View>

    <View style={styles.reader}>
      {!session && !error ? <View style={styles.center}>
        <ActivityIndicator color={theme.primaryStrong} />
        <Text style={[styles.status, { color: theme.muted }]}>Preparing your report…</Text>
      </View> : session && !error ? <ProtectedPdfReader
        key={session.viewerSessionId}
        source={monthlyReportContentSource(session.contentUrl)}
        onLoadComplete={() => undefined}
        onError={fail}
      /> : <View style={styles.center}>
        <Text style={[styles.errorTitle, { color: theme.fg }]}>Unable to open this report</Text>
        <Text style={[styles.status, { color: theme.muted }]}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={retry} style={[styles.retry, { backgroundColor: theme.primary }]}>
          <RefreshCw color="#FFFFFF" size={17} />
          <Text style={styles.retryText}>Request a fresh viewer</Text>
        </Pressable>
      </View>}
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { minHeight: 68, borderBottomWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  back: { width: 40, height: 40, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: font.bold, fontSize: 14 },
  sub: { marginTop: 3, fontFamily: font.regular, fontSize: 8 },
  protected: { height: 34, borderWidth: 1, borderRadius: 17, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  protectedText: { fontFamily: font.bold, fontSize: 8 },
  reader: { flex: 1, backgroundColor: '#090B0D' },
  center: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', gap: 10 },
  status: { maxWidth: 340, fontFamily: font.regular, fontSize: 11, lineHeight: 17, textAlign: 'center' },
  errorTitle: { fontFamily: font.extraBold, fontSize: 17, textAlign: 'center' },
  retry: { minHeight: 44, marginTop: 8, borderRadius: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
  retryText: { color: '#FFFFFF', fontFamily: font.bold, fontSize: 10 },
});
