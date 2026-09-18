import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { ArrowLeft, LockKeyhole } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font, themes } from '@/constants/theme';
import { findLesson } from '@/lib/demo-catalog';
import { getAuthErrorMessage } from '@/lib/auth-session';
import { useAuthStore } from '@/lib/auth-store';
import { closeNoteViewerSession, createNoteViewerSession, heartbeatNoteViewerSession, loadNoteViewerManifest, protectedContentSource, updateNoteViewerProgress, type ContentAttachedLink, type NoteViewerSession } from '@/lib/note-viewer-api';
import { ProtectedPdfReader } from '@/components/protected-pdf-reader';
import { ProtectedImageReader } from '@/components/protected-image-reader';
import { ProtectedFileReader } from '@/components/protected-file-reader';
import { useAppTheme } from '@/providers/app-providers';
import { queryClient } from '@/lib/query-client';
import { noteKeys } from '@/lib/student-content-api';
import { ContentAttachedLinks } from '@/components/content-attached-links';

const captureProtectionKey = 'protected-lesson';
const allowDemoScreenShare = process.env.EXPO_PUBLIC_ALLOW_SCREEN_CAPTURE === 'true';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function PdfWatermarks({ email }: { email: string }) {
  const { theme } = useAppTheme();
  const entries = useMemo(() => Array.from({ length: 9 }, (_, index) => index), []);
  return <View style={styles.watermarkLayer}>{entries.map((entry) => <Text key={entry} style={[styles.watermark, { color: `${theme.primary}66` }]}>{email}</Text>)}</View>;
}

export default function LessonScreen() {
  const { id, returnTo } = useLocalSearchParams();
  const { lesson } = findLesson(id);
  const router = useRouter();
  const { theme } = useAppTheme();
  const dark = theme.canvas === themes.dark.canvas;
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const email = user?.email ?? 'demo.student@parallaxflow.app';
  const [pages, setPages] = useState(5);
  const [readerError, setReaderError] = useState<{ routeId: string; message: string } | null>(null);
  const [viewerState, setViewerState] = useState<{ routeId: string; session?: NoteViewerSession; error?: string } | null>(null);
  const [attachedLinkState, setAttachedLinkState] = useState<{ routeId: string; links: ContentAttachedLink[] } | null>(null);
  const routeId = Array.isArray(id) ? id[0] : id;
  const hasServerSession = Boolean(accessToken && !accessToken.startsWith('ui-only-'));
  const shouldOpenProtectedViewer = Boolean(hasServerSession && routeId && uuidPattern.test(routeId));
  const viewerSession = viewerState?.routeId === routeId ? viewerState.session ?? null : null;
  const attachedLinks = attachedLinkState?.routeId === routeId ? attachedLinkState.links : [];
  const error = readerError?.routeId === routeId ? readerError.message : viewerState?.routeId === routeId ? viewerState.error ?? null : null;
  const opening = shouldOpenProtectedViewer && viewerState?.routeId !== routeId;
  const viewerSource = viewerSession ? protectedContentSource(viewerSession.contentUrl) : undefined;
  const isImage = Boolean(viewerSession?.note.mimeType?.startsWith('image/'));
  const isPdf = !viewerSession || viewerSession.note.mimeType === 'application/pdf';
  const fileKind = isImage ? 'Protected image · pinch to zoom' : isPdf ? `${pages} page PDF · continuous scroll · pinch to zoom` : `Protected ${viewerSession?.note.mimeType?.split('/').pop()?.toUpperCase() ?? 'file'} preview`;
  const returnPath = Array.isArray(returnTo) ? returnTo[0] : returnTo;
  const goBackToNotes = () => {
    if (returnPath?.startsWith('/notes') || returnPath?.startsWith('/package/')) {
      if (router.canGoBack()) router.back(); else router.replace(returnPath as never);
      return;
    }
    router.replace('/notes');
  };
  const handleLoadComplete = useCallback((numberOfPages: number) => {
    setPages(numberOfPages);
    setReaderError(null);
    if (viewerSession) void updateNoteViewerProgress(viewerSession.viewerSessionId, { currentPage: 1, progressPercent: 1 }).catch(() => undefined);
  }, [viewerSession]);
  const handleReaderError = useCallback((message: string) => setReaderError({ routeId: routeId ?? 'sample', message }), [routeId]);

  useEffect(() => {
    if (!shouldOpenProtectedViewer || !routeId) return;
    let active = true;
    let openedViewerId: string | null = null;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    void createNoteViewerSession(routeId)
      .then((created) => {
        openedViewerId = created.viewerSessionId;
        void queryClient.invalidateQueries({ queryKey: noteKeys.all });
        if (!active) { void closeNoteViewerSession(created.viewerSessionId).catch(() => undefined); return; }

        // Start the protected document request immediately. The manifest is
        // supplementary metadata and must not sit in the critical path before
        // the native PDF/image renderer can begin downloading the content.
        setViewerState({ routeId, session: created });
        heartbeat = setInterval(() => { void heartbeatNoteViewerSession(created.viewerSessionId).catch(() => undefined); }, 5 * 60_000);

        void loadNoteViewerManifest(created.viewerSessionId)
          .then((manifest) => {
            if (!active) return;
            if (manifest.pageCount) setPages(manifest.pageCount);
            setAttachedLinkState({ routeId, links: manifest.attachedLinks ?? [] });
          })
          .catch(() => {
            // The protected content request performs the same authorization
            // checks. A transient manifest failure should not block the PDF.
          });
      })
      .catch((viewerError: unknown) => { if (active) setViewerState({ routeId, error: getAuthErrorMessage(viewerError) }); });
    return () => {
      active = false;
      if (heartbeat) clearInterval(heartbeat);
      if (openedViewerId) void closeNoteViewerSession(openedViewerId).catch(() => undefined);
    };
  }, [routeId, shouldOpenProtectedViewer]);

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
      <Pressable accessibilityRole="button" accessibilityLabel="Back to notes" onPress={goBackToNotes} style={[styles.topButton, { backgroundColor: theme.sunken, borderColor: theme.line }]}><ArrowLeft color={theme.fg} size={20} /></Pressable>
      <View style={styles.topCopy}>
        <Text numberOfLines={1} style={[styles.topTitle, { color: theme.fg }]}>{viewerSession?.note.title ?? lesson.title}</Text>
        <Text numberOfLines={1} style={[styles.topSub, { color: theme.muted }]}>{fileKind}</Text>
      </View>
      <View accessibilityLabel="Protected PDF" style={[styles.protectedBadge, { backgroundColor: theme.primarySoft, borderColor: dark ? 'rgba(124,156,255,0.32)' : theme.line }]}><LockKeyhole color={theme.primaryStrong} size={17} /><Text style={[styles.protectedText, { color: theme.primaryStrong }]}>Protected</Text></View>
    </View>
    <View style={[styles.reader, { backgroundColor: dark ? '#090B0D' : theme.sunken }]}>
      {opening ? <View style={styles.opening}><ActivityIndicator color={theme.primaryStrong} /><Text style={[styles.openingText, { color: theme.muted }]}>Preparing your protected note…</Text></View> : !error && isImage && viewerSource ? <ProtectedImageReader source={viewerSource} onLoadComplete={() => handleLoadComplete(1)} onError={handleReaderError} /> : !error && isPdf ? <ProtectedPdfReader source={viewerSource} onLoadComplete={handleLoadComplete} onError={handleReaderError} /> : !error && viewerSource ? <ProtectedFileReader source={viewerSource} onLoadComplete={() => handleLoadComplete(1)} onError={handleReaderError} /> : null}
      <PdfWatermarks email={email} />
      {error ? <View style={[styles.error, { backgroundColor: theme.canvas }]}><Text style={[styles.errorTitle, { color: theme.fg }]}>Unable to open this note</Text><Text style={[styles.errorCopy, { color: theme.muted }]}>{error}</Text></View> : null}
    </View>
    <ContentAttachedLinks links={attachedLinks} />
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
  opening: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  openingText: { fontFamily: font.medium, fontSize: 12 },
  watermarkLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', flexDirection: 'row', flexWrap: 'wrap', alignContent: 'space-around', justifyContent: 'space-around', paddingVertical: 28, paddingHorizontal: 10 },
  watermark: { width: '48%', fontFamily: font.bold, fontSize: 12, textAlign: 'center', transform: [{ rotate: '-28deg' }], marginVertical: 17 },
  error: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', padding: 28 },
  errorTitle: { fontFamily: font.bold, fontSize: 16, textAlign: 'center' },
  errorCopy: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, marginTop: 7, textAlign: 'center' },
});
