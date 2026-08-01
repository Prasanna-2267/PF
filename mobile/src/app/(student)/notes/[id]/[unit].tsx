import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, FolderOpen } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotesBrowserHeader } from '@/components/notes-browser-header';
import { NoteRow } from '@/components/note-management';
import { font, spacing } from '@/constants/theme';
import { findUnit, type Lesson } from '@/lib/demo-catalog';
import { useAppTheme } from '@/providers/app-providers';
import { useLessonReaderStore } from '@/lib/lesson-reader-store';

export default function UnitScreen() {
  const { id, unit: unitId } = useLocalSearchParams(); const { subject, unit } = findUnit(id, unitId); const router = useRouter(); const { theme } = useAppTheme(); const recordOpen = useLessonReaderStore((state) => state.recordOpen); const [query, setQuery] = useState('');
  const topics = (unit.topics ?? []).filter((topic) => topic.title.toLowerCase().includes(query.trim().toLowerCase()));
  const lessons = (unit.lessons ?? []).filter((lesson) => lesson.title.toLowerCase().includes(query.trim().toLowerCase()));
  const open = (lesson: Lesson) => { if (lesson.access === 'free' || lesson.access === 'owned') { recordOpen(lesson.id); router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } }); } else router.push({ pathname: '/purchase/[id]', params: { id: lesson.id } }); };
  const hasTopics = Boolean(unit.topics);
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.canvas }]}>
    <NotesBrowserHeader query={query} onChangeQuery={setQuery} onBack={() => router.back()} placeholder={hasTopics ? 'Search topics' : 'Search notes'} />
    <View style={[styles.divider, { backgroundColor: theme.line }]} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.breadcrumb, { color: theme.primary }]}>NOTES  /  {subject.title.toUpperCase()}</Text><Text style={[styles.title, { color: theme.fg }]}>{unit.title}</Text><Text style={[styles.description, { color: theme.muted }]}>{unit.description}</Text>
      <View style={styles.heading}><Text style={[styles.sectionTitle, { color: theme.fg }]}>{hasTopics ? 'Topics' : 'Notes'}</Text><Text style={[styles.count, { color: theme.muted }]}>{hasTopics ? topics.length : lessons.length} {hasTopics ? 'folders' : 'files'}</Text></View>
      {hasTopics ? <View style={styles.list}>{topics.map((topic) => <Pressable key={topic.id} onPress={() => router.push({ pathname: '/notes/[id]/[unit]/[topic]', params: { id: subject.id, unit: unit.id, topic: topic.id } })} style={({ pressed }) => [styles.row, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.icon, { backgroundColor: theme.primarySoft }]}><FolderOpen color={theme.primaryStrong} size={19} /></View><View style={styles.copy}><Text numberOfLines={1} style={[styles.rowTitle, { color: theme.fg }]}>{topic.title}</Text><Text style={[styles.rowDescription, { color: theme.muted }]}>{topic.lessons.length} note files</Text></View><ChevronRight color={theme.faint} size={18} /></Pressable>)}</View> : <View style={styles.list}>{lessons.map((lesson) => <NoteRow key={lesson.id} lesson={lesson} onOpen={() => open(lesson)} />)}</View>}
      {(hasTopics ? topics.length : lessons.length) === 0 ? <Text style={[styles.empty, { color: theme.muted }]}>Nothing matches your search.</Text> : null}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, divider: { height: 1 }, content: { padding: spacing.lg, paddingBottom: 40, maxWidth: 680, width: '100%', alignSelf: 'center' }, breadcrumb: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.05 }, title: { fontFamily: font.extraBold, fontSize: 23, letterSpacing: -0.5, marginTop: 8 }, description: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, marginTop: 4 }, heading: { marginTop: 25, marginBottom: 10, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }, sectionTitle: { fontFamily: font.bold, fontSize: 16 }, count: { fontFamily: font.regular, fontSize: 10 }, list: { gap: 7 }, row: { minHeight: 75, borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0 }, rowTitle: { fontFamily: font.bold, fontSize: 13 }, rowDescription: { fontFamily: font.regular, fontSize: 10, marginTop: 4 }, empty: { paddingVertical: 32, textAlign: 'center', fontFamily: font.regular, fontSize: 12 }, pressed: { opacity: 0.76 },
});
