import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpenCheck, BrainCircuit, CheckCircle2, CircleX, LockKeyhole, Sparkles, Target } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { ConceptWeakAreas } from '@/components/concept-weak-areas';
import { font, radius, spacing, themes } from '@/constants/theme';
import { practiceSubjects, type PracticeTopic } from '@/lib/demo-practice';
import { useAuthStore } from '@/lib/auth-store';
import { usePracticeProgressStore } from '@/lib/practice-progress-store';
import { useAppTheme } from '@/providers/app-providers';

const nativeDriver = Platform.OS !== 'web';

export default function PracticeTrackerScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const dark = theme.canvas === themes.dark.canvas;
  const paid = useAuthStore((state) => state.user?.plan === 'paid');
  const progress = usePracticeProgressStore((state) => state.byQuestionId);
  const [subjectId, setSubjectId] = useState(practiceSubjects[0].id);
  const subject = practiceSubjects.find((item) => item.id === subjectId) ?? practiceSubjects[0];
  const allQuestions = practiceSubjects.flatMap((item) => item.topics.flatMap((topic) => topic.questions));
  const solved = allQuestions.filter((question) => progress[question.id]).length;
  const correct = allQuestions.filter((question) => progress[question.id]?.correct).length;
  const closed = allQuestions.filter((question) => progress[question.id]?.lockedWrong).length;
  const accuracy = solved ? Math.round((correct / solved) * 100) : 0;

  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Pressable accessibilityRole="button" accessibilityLabel="Back to Practice" onPress={() => router.back()} style={({ pressed }) => [styles.back, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><ArrowLeft size={19} color={theme.fg} /></Pressable><View style={styles.headerCopy}><Text style={[styles.eyebrow, { color: theme.primary }]}>PRACTICE ANALYTICS</Text><Text style={[styles.title, { color: theme.fg }]}>Chapter tracker</Text><Text style={[styles.description, { color: theme.muted }]}>See exactly how many questions you have solved in every chapter.</Text></View></View>

      <PracticeTrackerHero dark={dark} solved={solved} total={allQuestions.length} accuracy={accuracy} />

      <View style={styles.metrics}><Metric icon={<CheckCircle2 size={17} color={theme.success} />} value={String(correct)} label="Correct" tone={theme.successSoft} /><Metric icon={<LockKeyhole size={17} color={theme.danger} />} value={String(closed)} label="Closed" tone={theme.dangerSoft} /><Metric icon={<Target size={17} color={theme.primaryStrong} />} value={`${accuracy}%`} label="Accuracy" tone={theme.primarySoft} /></View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subjectTabs}>{practiceSubjects.map((item) => { const active = item.id === subject.id; const itemSolved = item.topics.flatMap((topic) => topic.questions).filter((question) => progress[question.id]).length; return <Pressable key={item.id} onPress={() => setSubjectId(item.id)} style={({ pressed }) => [styles.subjectTab, { backgroundColor: active ? theme.primary : theme.surface, borderColor: active ? theme.primary : theme.line }, pressed && styles.pressed]}><BookOpenCheck size={14} color={active ? theme.primaryFg : theme.muted} /><View><Text numberOfLines={1} style={[styles.subjectName, { color: active ? theme.primaryFg : theme.fg }]}>{item.title}</Text><Text style={[styles.subjectCount, { color: active ? theme.primaryFg : theme.muted }]}>{itemSolved} solved</Text></View></Pressable>; })}</ScrollView>

      <View style={styles.sectionHeading}><View><Text style={[styles.sectionEyebrow, { color: theme.primary }]}>CHAPTER BREAKDOWN</Text><Text style={[styles.sectionTitle, { color: theme.fg }]}>{subject.title}</Text></View><View style={[styles.liveBadge, { backgroundColor: theme.successSoft }]}><View style={[styles.liveDot, { backgroundColor: theme.success }]} /><Text style={[styles.liveText, { color: theme.success }]}>LIVE DATA</Text></View></View>

      <View style={styles.chapterList}>{subject.topics.map((topic, index) => <ChapterProgressCard key={topic.id} topic={topic} index={index} progress={progress} />)}</View>

      <ConceptWeakAreas />

      <View style={[styles.policyNote, { backgroundColor: theme.sunken, borderColor: theme.line }]}>{paid ? <Sparkles size={17} color={theme.goldStrong} /> : <CircleX size={17} color={theme.danger} />}<View style={styles.policyCopy}><Text style={[styles.policyTitle, { color: theme.fg }]}>{paid ? 'Paid practice access' : 'Free attempt policy'}</Text><Text style={[styles.policyText, { color: theme.muted }]}>{paid ? 'Retry incorrect questions and review explanations after every submitted answer.' : 'Incorrect answers close after submission. Explanations unlock only when your answer is correct.'}</Text></View></View>
    </ScrollView>
  </SafeAreaView>;
}

function PracticeTrackerHero({ dark, solved, total, accuracy }: { dark: boolean; solved: number; total: number; accuracy: number }) {
  const { theme } = useAppTheme();
  const [motion] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(motion, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }), Animated.timing(motion, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver })]));
    loop.start();
    return () => loop.stop();
  }, [motion]);
  const float = motion.interpolate({ inputRange: [0, 1], outputRange: [4, -5] });
  const glow = motion.interpolate({ inputRange: [0, 1], outputRange: [.18, .05] });
  const percent = Math.round((solved / Math.max(total, 1)) * 100);
  return <LinearGradient colors={dark ? ['#182949', '#121A2A', '#101419'] : ['#EAF0FF', '#F6F8FF', '#FFFFFF']} style={[styles.hero, { borderColor: theme.line }]}>
    <Animated.View pointerEvents="none" style={[styles.heroGlow, { backgroundColor: theme.primaryStrong, opacity: glow }]} />
    <View style={styles.heroTop}><View><Text style={[styles.heroEyebrow, { color: theme.primaryStrong }]}>TOTAL MASTERY</Text><Text style={[styles.heroTitle, { color: theme.fg }]}>{solved}<Text style={[styles.heroTotal, { color: theme.muted }]}> / {total}</Text></Text><Text style={[styles.heroCopy, { color: theme.muted }]}>unique questions solved</Text></View><Animated.View style={[styles.brainOrb, { backgroundColor: theme.primarySoft, borderColor: theme.lineStrong, transform: [{ translateY: float }] }]}><BrainCircuit size={28} color={theme.primaryStrong} /><Sparkles style={styles.sparkle} size={12} color={theme.goldStrong} /></Animated.View></View>
    <View style={[styles.heroTrack, { backgroundColor: theme.sunken }]}><View style={[styles.heroFill, { width: `${percent}%`, backgroundColor: theme.primary }]} /></View>
    <View style={styles.heroFooter}><Text style={[styles.heroFooterText, { color: theme.muted }]}>{percent}% of question bank explored</Text><Text style={[styles.heroAccuracy, { color: theme.success }]}>{accuracy}% accurate</Text></View>
  </LinearGradient>;
}

function Metric({ icon, value, label, tone }: { icon: React.ReactNode; value: string; label: string; tone: string }) {
  const { theme } = useAppTheme();
  return <Card style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: tone }]}>{icon}</View><Text style={[styles.metricValue, { color: theme.fg }]}>{value}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text></Card>;
}

function ChapterProgressCard({ topic, index, progress }: { topic: PracticeTopic; index: number; progress: ReturnType<typeof usePracticeProgressStore.getState>['byQuestionId'] }) {
  const { theme } = useAppTheme();
  const [entrance] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 420, delay: index * 90, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }).start();
  }, [entrance, index]);
  const translateY = entrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });
  const results = topic.questions.map((question) => progress[question.id]).filter(Boolean);
  const solved = results.length;
  const correct = results.filter((result) => result.correct).length;
  const closed = results.filter((result) => result.lockedWrong).length;
  const percent = Math.round((solved / Math.max(topic.questions.length, 1)) * 100);
  return <Animated.View style={{ opacity: entrance, transform: [{ translateY }] }}><Card style={styles.chapterCard}>
    <View style={styles.chapterTop}><View style={[styles.chapterIcon, { backgroundColor: theme.primarySoft }]}><BookOpenCheck size={18} color={theme.primaryStrong} /></View><View style={styles.chapterCopy}><Text numberOfLines={2} style={[styles.chapterTitle, { color: theme.fg }]}>{topic.title}</Text><Text style={[styles.chapterMeta, { color: theme.muted }]}>{solved} of {topic.questions.length} solved</Text></View><View style={[styles.percentBadge, { backgroundColor: theme.primarySoft }]}><Text style={[styles.percentText, { color: theme.primaryStrong }]}>{percent}%</Text></View></View>
    <View style={[styles.chapterTrack, { backgroundColor: theme.sunken }]}><View style={[styles.chapterFill, { width: `${percent}%`, backgroundColor: percent === 100 ? theme.success : theme.primary }]} /></View>
    <View style={styles.chapterFooter}><View style={styles.miniStat}><CheckCircle2 size={12} color={theme.success} /><Text style={[styles.miniStatText, { color: theme.muted }]}>{correct} correct</Text></View><View style={styles.miniStat}><LockKeyhole size={12} color={theme.danger} /><Text style={[styles.miniStatText, { color: theme.muted }]}>{closed} closed</Text></View><Text style={[styles.remaining, { color: theme.faint }]}>{topic.questions.length - solved} remaining</Text></View>
  </Card></Animated.View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: spacing.lg, paddingBottom: 110, gap: spacing.lg }, header: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 }, back: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, minWidth: 0 }, eyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.3 }, title: { marginTop: 4, fontFamily: font.extraBold, fontSize: 28, letterSpacing: -.8 }, description: { marginTop: 4, fontFamily: font.regular, fontSize: 11, lineHeight: 17 },
  hero: { minHeight: 190, borderWidth: 1, borderRadius: 23, padding: 17, overflow: 'hidden' }, heroGlow: { position: 'absolute', width: 210, height: 210, borderRadius: 105, right: -105, top: -112 }, heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heroEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, heroTitle: { marginTop: 5, fontFamily: font.extraBold, fontSize: 37, letterSpacing: -1.2 }, heroTotal: { fontFamily: font.medium, fontSize: 17, letterSpacing: -.2 }, heroCopy: { marginTop: -2, fontFamily: font.regular, fontSize: 10 }, brainOrb: { width: 68, height: 68, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, sparkle: { position: 'absolute', top: 8, right: 8 }, heroTrack: { height: 8, marginTop: 24, borderRadius: 4, overflow: 'hidden' }, heroFill: { height: '100%', borderRadius: 4 }, heroFooter: { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, heroFooterText: { fontFamily: font.medium, fontSize: 8 }, heroAccuracy: { fontFamily: font.bold, fontSize: 8 },
  metrics: { flexDirection: 'row', gap: 8 }, metric: { flex: 1, minWidth: 0, minHeight: 104, padding: 11 }, metricIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, metricValue: { marginTop: 9, fontFamily: font.extraBold, fontSize: 19 }, metricLabel: { marginTop: 1, fontFamily: font.medium, fontSize: 8 }, subjectTabs: { gap: 8, paddingRight: spacing.lg }, subjectTab: { minWidth: 142, minHeight: 52, borderWidth: 1, borderRadius: 15, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }, subjectName: { maxWidth: 105, fontFamily: font.bold, fontSize: 10 }, subjectCount: { marginTop: 2, fontFamily: font.medium, fontSize: 7 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, sectionEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.15 }, sectionTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 18 }, liveBadge: { minHeight: 27, borderRadius: radius.pill, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5 }, liveDot: { width: 5, height: 5, borderRadius: 3 }, liveText: { fontFamily: font.bold, fontSize: 7, letterSpacing: .65 }, chapterList: { gap: 10 }, chapterCard: { padding: 13 }, chapterTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, chapterIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, chapterCopy: { flex: 1, minWidth: 0 }, chapterTitle: { fontFamily: font.bold, fontSize: 13, lineHeight: 18 }, chapterMeta: { marginTop: 2, fontFamily: font.regular, fontSize: 9 }, percentBadge: { minWidth: 43, minHeight: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, percentText: { fontFamily: font.extraBold, fontSize: 10 }, chapterTrack: { height: 6, marginTop: 13, borderRadius: 3, overflow: 'hidden' }, chapterFill: { height: '100%', borderRadius: 3 }, chapterFooter: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }, miniStat: { flexDirection: 'row', alignItems: 'center', gap: 4 }, miniStatText: { fontFamily: font.medium, fontSize: 8 }, remaining: { flex: 1, textAlign: 'right', fontFamily: font.medium, fontSize: 8 }, policyNote: { borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }, policyCopy: { flex: 1, minWidth: 0 }, policyTitle: { fontFamily: font.bold, fontSize: 10 }, policyText: { marginTop: 2, fontFamily: font.regular, fontSize: 8, lineHeight: 13 }, pressed: { opacity: .76, transform: [{ scale: .98 }] },
});
