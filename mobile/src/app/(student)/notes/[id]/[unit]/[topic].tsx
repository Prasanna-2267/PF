import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotesBrowserHeader } from '@/components/notes-browser-header';
import { NoteRow } from '@/components/note-management';
import { font, spacing } from '@/constants/theme';
import { canOpenNote, useAdminAccessStore } from '@/lib/admin-access-store';
import { useAuthStore } from '@/lib/auth-store';
import { findTopic, type Lesson } from '@/lib/demo-catalog';
import { useAppTheme } from '@/providers/app-providers';
import { useLessonReaderStore } from '@/lib/lesson-reader-store';

export default function TopicScreen() {
  const { id, unit: unitId, topic: topicId } = useLocalSearchParams(); const { subject, unit, topic } = findTopic(id, unitId, topicId); const router = useRouter(); const { theme } = useAppTheme(); const recordOpen = useLessonReaderStore((state) => state.recordOpen); const userEmail = useAuthStore((state) => state.user?.email); const grants = useAdminAccessStore((state) => state.grants); const [query, setQuery] = useState('');
  const lessons = (topic?.lessons ?? []).filter((lesson) => lesson.title.toLowerCase().includes(query.trim().toLowerCase()));
  const open = (lesson: Lesson) => { if (canOpenNote(lesson, userEmail, grants)) { recordOpen(lesson.id); router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } }); } else router.push({ pathname: '/purchase/[id]', params: { id: lesson.id } }); };
  if (!topic) return null;
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.canvas }]}>
    <NotesBrowserHeader query={query} onChangeQuery={setQuery} onBack={() => router.back()} placeholder="Search notes" />
    <View style={[styles.divider, { backgroundColor: theme.line }]} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text numberOfLines={1} style={[styles.breadcrumb, { color: theme.primary }]}>NOTES  /  {subject.title.toUpperCase()}  /  {unit.title.toUpperCase()}</Text><Text style={[styles.title, { color: theme.fg }]}>{topic.title}</Text><Text style={[styles.description, { color: theme.muted }]}>Protected notes available in this topic.</Text>
      <View style={styles.heading}><Text style={[styles.sectionTitle, { color: theme.fg }]}>Files</Text><Text style={[styles.count, { color: theme.muted }]}>{lessons.length} notes</Text></View>
      <View style={styles.list}>{lessons.map((lesson) => <NoteRow key={lesson.id} lesson={lesson} onOpen={() => open(lesson)} />)}</View>
      {lessons.length === 0 ? <Text style={[styles.empty, { color: theme.muted }]}>No notes match your search.</Text> : null}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, divider: { height: 1 }, content: { padding: spacing.lg, paddingBottom: 40, maxWidth: 680, width: '100%', alignSelf: 'center' }, breadcrumb: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.05 }, title: { fontFamily: font.extraBold, fontSize: 23, letterSpacing: -0.5, marginTop: 8 }, description: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, marginTop: 4 }, heading: { marginTop: 25, marginBottom: 10, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }, sectionTitle: { fontFamily: font.bold, fontSize: 16 }, count: { fontFamily: font.regular, fontSize: 10 }, list: { gap: 7 }, empty: { paddingVertical: 32, textAlign: 'center', fontFamily: font.regular, fontSize: 12 },
});
