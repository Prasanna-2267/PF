import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Layers3 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotesBrowserHeader } from '@/components/notes-browser-header';
import { font, spacing } from '@/constants/theme';
import { findSubject } from '@/lib/demo-catalog';
import { useAppTheme } from '@/providers/app-providers';

export default function SubjectScreen() {
  const { id } = useLocalSearchParams(); const subject = findSubject(id); const router = useRouter(); const { theme } = useAppTheme(); const [query, setQuery] = useState('');
  const units = subject.units.filter((unit) => `${unit.title} ${unit.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.canvas }]}>
    <NotesBrowserHeader query={query} onChangeQuery={setQuery} onBack={() => router.back()} placeholder="Search units" />
    <View style={[styles.divider, { backgroundColor: theme.line }]} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={[styles.breadcrumb, { color: theme.primary }]}>NOTES  /  {subject.title.toUpperCase()}</Text><Text style={[styles.title, { color: theme.fg }]}>{subject.title}</Text><Text style={[styles.description, { color: theme.muted }]}>Choose a unit to continue through the syllabus.</Text>
      <View style={styles.heading}><Text style={[styles.sectionTitle, { color: theme.fg }]}>Units</Text><Text style={[styles.count, { color: theme.muted }]}>{units.length} folders</Text></View>
      <View style={styles.list}>{units.map((unit, index) => { const noteCount = unit.topics ? unit.topics.reduce((total, topic) => total + topic.lessons.length, 0) : unit.lessons?.length ?? 0; return <Pressable key={unit.id} onPress={() => router.push({ pathname: '/notes/[id]/[unit]', params: { id: subject.id, unit: unit.id } })} style={({ pressed }) => [styles.row, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.icon, { backgroundColor: `${subject.accent}20` }]}><Text style={[styles.index, { color: subject.accent }]}>{String(index + 1).padStart(2, '0')}</Text></View><View style={styles.copy}><Text numberOfLines={1} style={[styles.rowTitle, { color: theme.fg }]}>{unit.title}</Text><Text numberOfLines={1} style={[styles.rowDescription, { color: theme.muted }]}>{unit.description}</Text><View style={styles.meta}><Layers3 color={theme.primary} size={12} /><Text style={[styles.metaText, { color: theme.primary }]}>{unit.topics ? `${unit.topics.length} topics · ` : ''}{noteCount} notes</Text></View></View><ChevronRight color={theme.faint} size={18} /></Pressable>; })}</View>
      {units.length === 0 ? <Text style={[styles.empty, { color: theme.muted }]}>No units match your search.</Text> : null}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, divider: { height: 1 }, content: { padding: spacing.lg, paddingBottom: 40, maxWidth: 680, width: '100%', alignSelf: 'center' }, breadcrumb: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.05 }, title: { fontFamily: font.extraBold, fontSize: 23, letterSpacing: -0.5, marginTop: 8 }, description: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, marginTop: 4 }, heading: { marginTop: 25, marginBottom: 10, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }, sectionTitle: { fontFamily: font.bold, fontSize: 16 }, count: { fontFamily: font.regular, fontSize: 10 }, list: { gap: 7 }, row: { minHeight: 82, borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, index: { fontFamily: font.extraBold, fontSize: 11 }, copy: { flex: 1, minWidth: 0 }, rowTitle: { fontFamily: font.bold, fontSize: 13 }, rowDescription: { fontFamily: font.regular, fontSize: 10, marginTop: 3 }, meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }, metaText: { fontFamily: font.semibold, fontSize: 9 }, empty: { paddingVertical: 32, textAlign: 'center', fontFamily: font.regular, fontSize: 12 }, pressed: { opacity: 0.76 },
});
