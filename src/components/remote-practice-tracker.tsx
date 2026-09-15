import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BrainCircuit, CheckCircle2, CircleX, LockKeyhole, Target } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { font, spacing } from '@/constants/theme';
import { getPracticeTracker } from '@/lib/practice-api';
import { useAppTheme } from '@/providers/app-providers';

export function RemotePracticeTrackerScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const tracker = useQuery({ queryKey: ['student', 'practice', 'tracker'], queryFn: getPracticeTracker });
  const data = tracker.data;
  const accuracy = data && data.totals.correct + data.totals.wrong
    ? Math.round(data.totals.correct / (data.totals.correct + data.totals.wrong) * 100)
    : 0;

  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft size={19} color={theme.fg} /></Pressable>
        <View style={styles.copy}><Text style={[styles.eyebrow, { color: theme.primary }]}>PRACTICE ANALYTICS</Text><Text style={[styles.heading, { color: theme.fg }]}>Practice tracker</Text><Text style={[styles.hint, { color: theme.muted }]}>Live progress from free course questions uploaded by Admin.</Text></View>
      </View>

      {tracker.isLoading ? <State loading /> : tracker.isError ? <State onRetry={() => tracker.refetch()} /> : data ? <>
        <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={[styles.heroIcon, { backgroundColor: theme.primarySoft }]}><BrainCircuit size={27} color={theme.primary} /></View>
          <View style={styles.copy}><Text style={[styles.heroValue, { color: theme.fg }]}>{data.totals.questionsSolved}</Text><Text style={[styles.hint, { color: theme.muted }]}>unique questions solved in {data.course.name}</Text></View>
          <View style={[styles.accuracy, { backgroundColor: theme.successSoft }]}><Text style={[styles.accuracyValue, { color: theme.success }]}>{accuracy}%</Text><Text style={[styles.accuracyLabel, { color: theme.success }]}>accuracy</Text></View>
        </View>

        <View style={styles.metrics}><Metric icon={<CheckCircle2 size={17} color={theme.success} />} value={data.totals.correct} label="Correct" /><Metric icon={<CircleX size={17} color={theme.danger} />} value={data.totals.wrong} label="Wrong" /><Metric icon={<Target size={17} color={theme.primary} />} value={data.totals.attempts} label="Attempts" /></View>

        <SectionTitle title="Subject overview" meta={`${data.subjects.length} subjects`} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectRail}>
          {data.subjects.map((subject) => <View key={subject.subjectId} style={[styles.subjectCard, { backgroundColor: theme.surface, borderColor: theme.line }]}><Text numberOfLines={1} style={[styles.cardTitle, { color: theme.fg }]}>{subject.subjectName}</Text><Text style={[styles.subjectValue, { color: theme.primary }]}>{subject.questionsSolved}</Text><Text style={[styles.hint, { color: theme.muted }]}>questions · {subject.accuracyPercent ?? 0}% accurate</Text></View>)}
        </ScrollView>

        <SectionTitle title="Chapter breakdown" meta={`${data.chapters.length} chapters`} />
        <View style={styles.list}>{data.chapters.map((chapter) => <View key={chapter.chapterId} style={[styles.chapter, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={styles.chapterTop}><View style={[styles.chapterIcon, { backgroundColor: theme.primarySoft }]}><Target size={17} color={theme.primary} /></View><View style={styles.copy}><Text numberOfLines={1} style={[styles.cardTitle, { color: theme.fg }]}>{chapter.chapterName}</Text><Text style={[styles.hint, { color: theme.muted }]}>{chapter.subject.name} · {chapter.questionsSolved} solved · {chapter.attempts} attempts</Text></View><Text style={[styles.percent, { color: chapter.accuracyPercent !== null && chapter.accuracyPercent < 60 ? theme.danger : theme.success }]}>{chapter.accuracyPercent ?? 0}%</Text></View><View style={[styles.track, { backgroundColor: theme.sunken }]}><View style={[styles.fill, { width: `${chapter.accuracyPercent ?? 0}%`, backgroundColor: chapter.accuracyPercent !== null && chapter.accuracyPercent < 60 ? theme.danger : theme.success }]} /></View></View>)}</View>

        {data.capabilities.conceptWeakAreas ? <View style={[styles.weak, { backgroundColor: theme.goldSoft, borderColor: theme.goldStrong }]}><BrainCircuit size={20} color={theme.goldStrong} /><View style={styles.copy}><Text style={[styles.weakTitle, { color: theme.fg }]}>Topic-wise weak areas</Text><Text style={[styles.hint, { color: theme.muted }]}>{data.weakAreas?.length ? data.weakAreas.map((area) => `${area.topicName} (${area.chapter.name})`).join(', ') : 'No repeated weak topic detected yet.'}</Text></View></View> : <View style={[styles.weak, { backgroundColor: theme.sunken, borderColor: theme.line }]}><LockKeyhole size={19} color={theme.muted} /><View style={styles.copy}><Text style={[styles.weakTitle, { color: theme.fg }]}>Weak-area intelligence</Text><Text style={[styles.hint, { color: theme.muted }]}>Detailed topic signals are a Paid feature. Every practice question remains free.</Text></View></View>}
      </> : null}
    </ScrollView>
  </SafeAreaView>;
}

function SectionTitle({ title, meta }: { title: string; meta: string }) {
  const { theme } = useAppTheme();
  return <View style={styles.sectionHead}><Text style={[styles.sectionTitle, { color: theme.fg }]}>{title}</Text><Text style={[styles.sectionMeta, { color: theme.muted }]}>{meta}</Text></View>;
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  const { theme } = useAppTheme();
  return <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}>{icon}<Text style={[styles.metricValue, { color: theme.fg }]}>{value}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text></View>;
}

function State({ loading, onRetry }: { loading?: boolean; onRetry?: () => void }) {
  const { theme } = useAppTheme();
  return <View style={styles.state}>{loading ? <ActivityIndicator color={theme.primary} /> : <><Text style={[styles.hint, { color: theme.muted }]}>Unable to load practice analytics.</Text><Pressable onPress={onRetry}><Text style={[styles.retry, { color: theme.primary }]}>Try again</Text></Pressable></>}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: spacing.lg, paddingBottom: 110, gap: spacing.lg }, header: { flexDirection: 'row', gap: 11 }, back: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0 }, eyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.3 }, heading: { marginTop: 4, fontFamily: font.extraBold, fontSize: 28 }, hint: { marginTop: 3, fontFamily: font.regular, fontSize: 9, lineHeight: 14 },
  hero: { minHeight: 112, borderWidth: 1, borderRadius: 21, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }, heroIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, heroValue: { fontFamily: font.extraBold, fontSize: 28 }, accuracy: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' }, accuracyValue: { fontFamily: font.extraBold, fontSize: 16 }, accuracyLabel: { fontFamily: font.medium, fontSize: 7 }, metrics: { flexDirection: 'row', gap: 8 }, metric: { flex: 1, minHeight: 92, borderWidth: 1, borderRadius: 16, padding: 12, justifyContent: 'space-between' }, metricValue: { fontFamily: font.extraBold, fontSize: 18 }, metricLabel: { fontFamily: font.medium, fontSize: 9 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }, sectionTitle: { fontFamily: font.bold, fontSize: 17 }, sectionMeta: { fontFamily: font.regular, fontSize: 9 }, subjectRail: { gap: 8, paddingRight: spacing.lg }, subjectCard: { width: 156, minHeight: 94, borderWidth: 1, borderRadius: 17, padding: 13 }, subjectValue: { marginTop: 10, fontFamily: font.extraBold, fontSize: 20 }, list: { gap: 9 }, chapter: { borderWidth: 1, borderRadius: 17, padding: 13 }, chapterTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, chapterIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, cardTitle: { fontFamily: font.bold, fontSize: 12 }, percent: { fontFamily: font.extraBold, fontSize: 13 }, track: { height: 6, borderRadius: 3, overflow: 'hidden', marginTop: 12 }, fill: { height: '100%', borderRadius: 3 }, weak: { borderWidth: 1, borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, weakTitle: { fontFamily: font.bold, fontSize: 12 }, state: { minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 10 }, retry: { fontFamily: font.bold, fontSize: 11 },
});
