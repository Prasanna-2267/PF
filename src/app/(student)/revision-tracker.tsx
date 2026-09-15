import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RevisionChapterTracker } from '@/components/revision-chapter-tracker';
import { font, layout, spacing } from '@/constants/theme';
import { useAppTheme } from '@/providers/app-providers';

export default function RevisionTrackerScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const wide = width >= layout.tabletBreakpoint;
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]} edges={['top', 'left', 'right']}><ScrollView contentContainerStyle={[styles.content, wide && styles.contentWide]} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back to Tracker" onPress={() => router.back()} style={({ pressed }) => [styles.back, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><ArrowLeft size={19} color={theme.fg} /></Pressable><View style={styles.headerCopy}><Text style={[styles.eyebrow, { color: theme.primary }]}>TRACKER · REVISION</Text><Text style={[styles.title, { color: theme.fg }]}>Revision tracker</Text><Text style={[styles.description, { color: theme.muted }]}>Plan each return with a clear chapter-level view.</Text></View><View style={[styles.secure, { backgroundColor: theme.successSoft }]}><ShieldCheck size={16} color={theme.success} /></View></View>
    <RevisionChapterTracker />
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: spacing.lg, paddingBottom: 48, gap: spacing.lg }, contentWide: { maxWidth: layout.studentContentMaxWidth, paddingHorizontal: spacing.xl }, header: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 }, back: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, minWidth: 0 }, eyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, title: { marginTop: 3, fontFamily: font.extraBold, fontSize: 27, letterSpacing: -.75 }, description: { marginTop: 3, fontFamily: font.regular, fontSize: 10, lineHeight: 15 }, secure: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: .72, transform: [{ scale: .97 }] },
});
