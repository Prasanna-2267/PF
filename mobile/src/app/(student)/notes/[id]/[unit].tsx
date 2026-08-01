import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, FolderOpen } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font, spacing } from '@/constants/theme';
import { findUnit } from '@/lib/demo-catalog';
import { NoteRow } from '@/components/note-management';
import { useAppTheme } from '@/providers/app-providers';
import { useLessonReaderStore } from '@/lib/lesson-reader-store';

export default function UnitScreen() {
  const { id, unit: unitId } = useLocalSearchParams(); const { subject, unit } = findUnit(id, unitId); const router = useRouter(); const { theme } = useAppTheme(); const recordOpen = useLessonReaderStore((state) => state.recordOpen);
  const open = (lessonId: string) => { recordOpen(lessonId); router.push({ pathname: '/lesson/[id]', params: { id: lessonId } }); };
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]}><ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to subject" onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft color={theme.fg} size={19} /></Pressable><Text style={[styles.crumb, { color: subject.accent }]}>{subject.title.toUpperCase()}</Text><Text style={[styles.title, { color: theme.fg }]}>{unit.title}</Text><Text style={[styles.description, { color: theme.muted }]}>{unit.description}</Text>
    {unit.topics ? <View style={styles.list}>{unit.topics.map((topic, index) => <Pressable key={topic.id} onPress={() => router.push({ pathname: '/notes/[id]/[unit]/[topic]', params: { id: subject.id, unit: unit.id, topic: topic.id } })} style={({ pressed }) => [styles.topic, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.topicIcon, { backgroundColor: theme.primarySoft }]}><FolderOpen color={theme.primary} size={19} /></View><View style={styles.topicCopy}><Text style={[styles.topicNumber, { color: theme.goldStrong }]}>TOPIC {index + 1}</Text><Text style={[styles.topicTitle, { color: theme.fg }]}>{topic.title}</Text><Text style={[styles.topicCount, { color: theme.muted }]}>{topic.lessons.length} notes</Text></View><ChevronRight color={theme.faint} size={19} /></Pressable>)}</View> : <View style={styles.list}>{(unit.lessons ?? []).map((lesson) => <NoteRow key={lesson.id} lesson={lesson} onOpen={() => open(lesson.id)} />)}</View>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40, maxWidth: 680, width: '100%', alignSelf: 'center' }, back: { width: 42, height: 42, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 5 }, crumb: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1.2 }, title: { fontFamily: font.extraBold, fontSize: 28, letterSpacing: -0.7 }, description: { fontFamily: font.regular, fontSize: 13, lineHeight: 20 }, list: { marginTop: spacing.sm, gap: spacing.sm }, topic: { minHeight: 90, borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, topicIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, topicCopy: { flex: 1, minWidth: 0 }, topicNumber: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1 }, topicTitle: { fontFamily: font.bold, fontSize: 14, marginTop: 2 }, topicCount: { fontFamily: font.regular, fontSize: 11, marginTop: 3 }, pressed: { opacity: 0.84 },
});
