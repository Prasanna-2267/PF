import { useMemo, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BookOpen, ChevronRight, Grid2X2, List, Package, Search, Star, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font, spacing } from '@/constants/theme';
import { allLessonEntries, subjects, type LessonEntry } from '@/lib/demo-catalog';
import { NoteRow, initialReaderStatus } from '@/components/note-management';
import { useAppTheme } from '@/providers/app-providers';
import { useLearnerProfileStore } from '@/lib/learner-profile-store';
import { useLessonReaderStore } from '@/lib/lesson-reader-store';

type Filter = 'all' | 'inprogress' | 'completed';
type Layout = 'list' | 'grid';
const packages = [
  { id: 'jee-mains-core', title: 'JEE Mains Core', detail: 'Physics · Chemistry · Mathematics', lessons: 42, price: '₹999' },
  { id: 'jee-maths', title: 'JEE Mains Mathematics', detail: 'Algebra · Calculus · Coordinate Geometry', lessons: 18, price: '₹399' },
  { id: 'jee-physics', title: 'JEE Mains Physics', detail: 'Mechanics · Electrodynamics · Modern Physics', lessons: 20, price: '₹449' },
];

export default function NotesScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const profile = useLearnerProfileStore((state) => state.profile);
  const statusById = useLessonReaderStore((state) => state.byLessonId);
  const recentlyOpened = useLessonReaderStore((state) => state.recentlyOpened);
  const recordOpen = useLessonReaderStore((state) => state.recordOpen);
  const [mode, setMode] = useState<'notes' | 'packages'>('notes');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [layout, setLayout] = useState<Layout>('list');
  const entries = useMemo(() => allLessonEntries(), []);
  const lookup = (lessonId: string) => entries.find((entry) => entry.lesson.id === lessonId);
  const statusFor = (entry: LessonEntry) => statusById[entry.lesson.id] ?? initialReaderStatus(entry.lesson);
  const open = (lessonId: string) => { recordOpen(lessonId); router.push({ pathname: '/lesson/[id]', params: { id: lessonId } }); };
  const matchesFilter = (entry: LessonEntry) => filter === 'all' || (filter === 'completed' ? statusFor(entry).read : !statusFor(entry).read);
  const recently = recentlyOpened.map(lookup).filter((entry): entry is LessonEntry => Boolean(entry)).slice(0, 3);
  const favourites = entries.filter((entry) => statusFor(entry).favourite);
  const searchResults = entries.filter((entry) => `${entry.lesson.title} ${entry.subject.title} ${entry.unit.title} ${entry.topic?.title ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()) && matchesFilter(entry));

  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.canvas }]}>
    <View style={styles.topArea}>
      <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.line }]}><Search color={theme.muted} size={19} /><TextInput value={query} onChangeText={setQuery} placeholder="Search notes, subjects or topics" placeholderTextColor={theme.faint} style={[styles.searchInput, { color: theme.fg }]} />{query ? <Pressable accessibilityLabel="Clear search" onPress={() => setQuery('')} style={[styles.clear, { backgroundColor: theme.sunken }]}><X size={15} color={theme.muted} /></Pressable> : null}</View>
    </View>
    <View style={[styles.tabs, { borderBottomColor: theme.line }]}>{(['notes', 'packages'] as const).map((value) => <Pressable key={value} onPress={() => setMode(value)} style={styles.tab}><Text style={[styles.tabText, { color: mode === value ? theme.fg : theme.muted }]}>{value === 'notes' ? 'Notes' : 'Packages'}</Text>{mode === value ? <View style={[styles.tabIndicator, { backgroundColor: theme.primary }]} /> : null}</Pressable>)}</View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={styles.fileToolbar}><View><Text style={[styles.filesTitle, { color: theme.fg }]}>{mode === 'notes' ? 'Your files' : 'Study packages'}</Text><Text style={[styles.context, { color: theme.muted }]}>{profile.examName} · {profile.category}</Text></View>{mode === 'notes' ? <View style={[styles.layoutSwitch, { backgroundColor: theme.surface, borderColor: theme.line }]}><Pressable accessibilityLabel="List layout" onPress={() => setLayout('list')} style={[styles.layoutButton, layout === 'list' && { backgroundColor: theme.primarySoft }]}><List size={18} color={layout === 'list' ? theme.primaryStrong : theme.muted} /></Pressable><Pressable accessibilityLabel="Grid layout" onPress={() => setLayout('grid')} style={[styles.layoutButton, layout === 'grid' && { backgroundColor: theme.primarySoft }]}><Grid2X2 size={17} color={layout === 'grid' ? theme.primaryStrong : theme.muted} /></Pressable></View> : null}</View>

      {mode === 'packages' ? <View style={styles.list}>{packages.map((entry) => <Pressable key={entry.id} onPress={() => router.push('/library')} style={({ pressed }) => [styles.packageRow, { backgroundColor: theme.surface, borderBottomColor: theme.line }, pressed && styles.pressed]}><View style={[styles.fileIcon, { backgroundColor: theme.goldSoft }]}><Package color={theme.goldStrong} size={20} /></View><View style={styles.rowCopy}><Text numberOfLines={1} style={[styles.rowTitle, { color: theme.fg }]}>{entry.title}</Text><Text numberOfLines={1} style={[styles.rowDetail, { color: theme.muted }]}>{entry.detail}</Text><Text style={[styles.rowMeta, { color: theme.primary }]}>{entry.lessons} notes included</Text></View><View style={styles.priceWrap}><Text style={[styles.price, { color: theme.fg }]}>{entry.price}</Text><ChevronRight size={18} color={theme.faint} /></View></Pressable>)}</View> : <>
        <View style={styles.filters}>{(['all', 'inprogress', 'completed'] as const).map((value) => <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filter, { backgroundColor: filter === value ? theme.primarySoft : theme.surface, borderColor: filter === value ? theme.primary : theme.line }]}><Text style={[styles.filterText, { color: filter === value ? theme.primaryStrong : theme.muted }]}>{value === 'inprogress' ? 'In progress' : value[0].toUpperCase() + value.slice(1)}</Text></Pressable>)}</View>

        {query.trim() ? <Section title="Search results" count={`${searchResults.length} files`} theme={theme}>{searchResults.map((entry) => <NoteRow key={entry.lesson.id} lesson={entry.lesson} context={`${entry.subject.title} · ${entry.topic?.title ?? entry.unit.title}`} onOpen={() => open(entry.lesson.id)} />)}{searchResults.length === 0 ? <Empty text="No files match this search and filter." theme={theme} /> : null}</Section> : <>
          <Section title="Recently opened" count="Top 3" theme={theme}><View style={styles.list}>{recently.map((entry) => <NoteRow key={entry.lesson.id} lesson={entry.lesson} context={entry.subject.title} onOpen={() => open(entry.lesson.id)} />)}</View></Section>
          <Section title="Favourites" count={`${favourites.length} saved`} theme={theme}>{favourites.length ? <View style={styles.list}>{favourites.map((entry) => <NoteRow key={entry.lesson.id} lesson={entry.lesson} context={entry.subject.title} onOpen={() => open(entry.lesson.id)} />)}</View> : <Empty text="Favourite a note from its three-dot menu to keep it here." theme={theme} />}</Section>
          <Section title="Browse subjects" count={`${subjects.length} subjects`} theme={theme}><View style={layout === 'grid' ? styles.subjectGrid : styles.list}>{subjects.map((subject) => <Pressable key={subject.id} onPress={() => router.push({ pathname: '/notes/[id]', params: { id: subject.id } })} style={({ pressed }) => [layout === 'grid' ? styles.subjectGridCard : styles.subjectRow, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.fileIcon, { backgroundColor: `${subject.accent}20` }]}><BookOpen color={subject.accent} size={20} /></View><View style={styles.rowCopy}><Text numberOfLines={layout === 'grid' ? 2 : 1} style={[styles.rowTitle, { color: theme.fg }]}>{subject.title}</Text><Text style={[styles.rowDetail, { color: theme.muted }]}>{subject.units.length} units · {subject.lessonCount} notes</Text><View style={[styles.progressTrack, { backgroundColor: theme.sunken }]}><View style={[styles.progressFill, { width: `${subject.progress}%`, backgroundColor: subject.accent }]} /></View></View>{layout === 'list' ? <ChevronRight color={theme.faint} size={18} /> : null}</Pressable>)}</View></Section>
        </>}
      </>}
    </ScrollView>
  </SafeAreaView>;
}

function Section({ title, count, theme, children }: { title: string; count: string; theme: ReturnType<typeof useAppTheme>['theme']; children: ReactNode }) { return <View style={styles.section}><View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: theme.fg }]}>{title}</Text><Text style={[styles.sectionCount, { color: theme.muted }]}>{count}</Text></View>{children}</View>; }
function Empty({ text, theme }: { text: string; theme: ReturnType<typeof useAppTheme>['theme'] }) { return <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.line }]}><Star color={theme.faint} size={18} /><Text style={[styles.emptyText, { color: theme.muted }]}>{text}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1 }, topArea: { paddingHorizontal: spacing.lg, paddingTop: 10, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, search: { flex: 1, height: 50, borderWidth: 1, borderRadius: 25, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 9 }, searchInput: { flex: 1, minWidth: 0, fontFamily: font.regular, fontSize: 14, paddingVertical: 12 }, clear: { width: 27, height: 27, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, avatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: font.bold, fontSize: 13 }, tabs: { height: 54, borderBottomWidth: 1, flexDirection: 'row', paddingHorizontal: spacing.lg }, tab: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' }, tabText: { fontFamily: font.semibold, fontSize: 14 }, tabIndicator: { position: 'absolute', left: 20, right: 20, bottom: -1, height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 }, content: { paddingHorizontal: spacing.lg, paddingTop: 18, paddingBottom: 106, gap: 24, maxWidth: 680, width: '100%', alignSelf: 'center' }, fileToolbar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, filesTitle: { fontFamily: font.bold, fontSize: 20, letterSpacing: -0.35 }, context: { fontFamily: font.regular, fontSize: 10, marginTop: 3 }, layoutSwitch: { height: 39, borderRadius: 20, borderWidth: 1, padding: 3, flexDirection: 'row' }, layoutButton: { width: 38, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, filters: { flexDirection: 'row', gap: 8, marginTop: -7 }, filter: { minHeight: 35, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' }, filterText: { fontFamily: font.semibold, fontSize: 10 }, section: { gap: 10 }, sectionHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }, sectionTitle: { fontFamily: font.bold, fontSize: 16 }, sectionCount: { fontFamily: font.regular, fontSize: 10 }, list: { gap: 7 }, packageRow: { minHeight: 82, borderBottomWidth: 1, borderRadius: 12, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, fileIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, rowCopy: { flex: 1, minWidth: 0 }, rowTitle: { fontFamily: font.bold, fontSize: 13, lineHeight: 18 }, rowDetail: { fontFamily: font.regular, fontSize: 10, lineHeight: 15, marginTop: 2 }, rowMeta: { fontFamily: font.semibold, fontSize: 9, marginTop: 4 }, priceWrap: { alignItems: 'flex-end', gap: 5 }, price: { fontFamily: font.extraBold, fontSize: 13 }, subjectRow: { minHeight: 76, borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, subjectGridCard: { width: '48.5%', minHeight: 137, borderWidth: 1, borderRadius: 15, padding: 12, justifyContent: 'space-between', gap: 9 }, progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 7 }, progressFill: { height: '100%', borderRadius: 2 }, empty: { minHeight: 60, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }, emptyText: { flex: 1, fontFamily: font.regular, fontSize: 10, lineHeight: 15 }, pressed: { opacity: 0.76 },
});
