import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Layers3 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font, spacing } from '@/constants/theme';
import { findSubject } from '@/lib/demo-catalog';
import { useAppTheme } from '@/providers/app-providers';
import { useLearnerProfileStore } from '@/lib/learner-profile-store';

export default function SubjectScreen() {
  const { id } = useLocalSearchParams(); const subject = findSubject(id); const router = useRouter(); const { theme } = useAppTheme(); const profile = useLearnerProfileStore((state) => state.profile);
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]}><ScrollView contentContainerStyle={styles.content}>
    <Pressable accessibilityRole="button" accessibilityLabel="Back to Notes" onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft size={19} color={theme.fg} /></Pressable>
    <Text style={[styles.eyebrow, { color: theme.goldStrong }]}>{profile.examName.toUpperCase()} · {profile.category.toUpperCase()}</Text><Text style={[styles.title, { color: theme.fg }]}>{subject.title}</Text><Text style={[styles.description, { color: theme.muted }]}>Choose a unit to continue your syllabus.</Text>
    <View style={styles.unitList}>{subject.units.map((unit, index) => { const count = unit.topics ? unit.topics.reduce((total, topic) => total + topic.lessons.length, 0) : unit.lessons?.length ?? 0; return <Pressable key={unit.id} accessibilityRole="button" accessibilityLabel={`Open ${unit.title}`} onPress={() => router.push({ pathname: '/notes/[id]/[unit]', params: { id: subject.id, unit: unit.id } })} style={({ pressed }) => [styles.unit, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.unitIndex, { backgroundColor: `${subject.accent}20` }]}><Text style={[styles.unitIndexText, { color: subject.accent }]}>{String(index + 1).padStart(2, '0')}</Text></View><View style={styles.unitCopy}><Text style={[styles.unitTitle, { color: theme.fg }]}>{unit.title}</Text><Text style={[styles.unitDescription, { color: theme.muted }]}>{unit.description}</Text><View style={styles.unitMeta}><Layers3 color={theme.primary} size={13} /><Text style={[styles.unitCount, { color: theme.primary }]}>{unit.topics ? `${unit.topics.length} topics · ` : ''}{count} notes</Text></View></View><ChevronRight color={theme.faint} size={20} /></Pressable>; })}</View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40, maxWidth: 680, width: '100%', alignSelf: 'center' }, back: { width: 42, height: 42, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 5 }, eyebrow: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1.3 }, title: { fontFamily: font.extraBold, fontSize: 29, letterSpacing: -0.7 }, description: { fontFamily: font.regular, fontSize: 13, lineHeight: 20 }, unitList: { marginTop: spacing.sm, gap: spacing.sm }, unit: { minHeight: 112, borderWidth: 1, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 }, unitIndex: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, unitIndexText: { fontFamily: font.extraBold, fontSize: 12 }, unitCopy: { flex: 1, minWidth: 0 }, unitTitle: { fontFamily: font.bold, fontSize: 15 }, unitDescription: { fontFamily: font.regular, fontSize: 11, lineHeight: 16, marginTop: 3 }, unitMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }, unitCount: { fontFamily: font.semibold, fontSize: 10 }, pressed: { opacity: 0.84 },
});
