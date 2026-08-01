import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font, spacing } from '@/constants/theme';
import { findTopic } from '@/lib/demo-catalog';
import { NoteRow } from '@/components/note-management';
import { useAppTheme } from '@/providers/app-providers';
import { useLessonReaderStore } from '@/lib/lesson-reader-store';

export default function TopicScreen() {
  const { id, unit: unitId, topic: topicId } = useLocalSearchParams(); const { subject, unit, topic } = findTopic(id, unitId, topicId); const router = useRouter(); const { theme } = useAppTheme(); const recordOpen = useLessonReaderStore((state) => state.recordOpen);
  const open = (lessonId: string) => { recordOpen(lessonId); router.push({ pathname: '/lesson/[id]', params: { id: lessonId } }); };
  if (!topic) return null;
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]}><ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to unit" onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft color={theme.fg} size={19} /></Pressable><Text style={[styles.crumb, { color: subject.accent }]}>{unit.title.toUpperCase()}</Text><Text style={[styles.title, { color: theme.fg }]}>{topic.title}</Text><Text style={[styles.description, { color: theme.muted }]}>Select a note to open it in the protected reader.</Text><View style={styles.list}>{topic.lessons.map((lesson) => <NoteRow key={lesson.id} lesson={lesson} onOpen={() => open(lesson.id)} />)}</View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40, maxWidth: 680, width: '100%', alignSelf: 'center' }, back: { width: 42, height: 42, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 5 }, crumb: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1.2 }, title: { fontFamily: font.extraBold, fontSize: 28, letterSpacing: -0.7 }, description: { fontFamily: font.regular, fontSize: 13, lineHeight: 20 }, list: { marginTop: spacing.sm, gap: spacing.sm },
});
