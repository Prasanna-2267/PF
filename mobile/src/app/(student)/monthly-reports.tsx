import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpenCheck, BrainCircuit, CalendarCheck2, CheckCircle2, Clock3, Crown, LockKeyhole, Sparkles, Target } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { font, radius, spacing, themes } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { useAppTheme } from '@/providers/app-providers';

const nativeDriver = Platform.OS !== 'web';
const reports = [
  { id: 'aug-2026', month: 'August', year: '2026', hours: '34h 20m', questions: 286, accuracy: 78, goalDays: 19, notes: 8, weak: ['Directive Principles', 'Early resistance'], bars: [44, 72, 61, 88] },
  { id: 'jul-2026', month: 'July', year: '2026', hours: '41h 05m', questions: 342, accuracy: 82, goalDays: 23, notes: 11, weak: ['Physical Geography', 'Preamble'], bars: [62, 75, 81, 78] },
  { id: 'jun-2026', month: 'June', year: '2026', hours: '28h 40m', questions: 219, accuracy: 73, goalDays: 16, notes: 6, weak: ['National Movement', 'Fundamental Rights'], bars: [38, 54, 67, 73] },
  { id: 'may-2026', month: 'May', year: '2026', hours: '22h 15m', questions: 174, accuracy: 69, goalDays: 13, notes: 5, weak: ['Constitution', 'Monsoon systems'], bars: [31, 46, 58, 69] },
];

export default function MonthlyReportsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const dark = theme.canvas === themes.dark.canvas;
  const paid = useAuthStore((state) => state.user?.plan === 'paid');
  const [selectedId, setSelectedId] = useState(reports[0].id);
  const [entrance] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }).start();
  }, [entrance]);
  const report = useMemo(() => reports.find((item) => item.id === selectedId) ?? reports[0], [selectedId]);
  const rise = entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]} edges={['top', 'left', 'right']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft size={19} color={theme.fg} /></Pressable><View style={styles.headerCopy}><Text style={[styles.eyebrow, { color: theme.goldStrong }]}>PAID INSIGHTS</Text><Text style={[styles.title, { color: theme.fg }]}>Monthly reports</Text><Text style={[styles.description, { color: theme.muted }]}>A clear archive of how your preparation evolved.</Text></View><View style={[styles.crown, { backgroundColor: theme.goldSoft }]}><Crown size={20} color={theme.goldStrong} /></View></View>

    {!paid ? <Card style={styles.lockedCard}><View style={[styles.lockOrb, { backgroundColor: theme.goldSoft }]}><LockKeyhole size={27} color={theme.goldStrong} /></View><Text style={[styles.lockTitle, { color: theme.fg }]}>Your long-term story, in one place.</Text><Text style={[styles.lockCopy, { color: theme.muted }]}>Monthly study time, accuracy, completed notes and weak concepts are available with Paid access.</Text><View style={[styles.lockFeature, { backgroundColor: theme.sunken }]}><Sparkles size={15} color={theme.goldStrong} /><Text style={[styles.lockFeatureText, { color: theme.fg }]}>All completed months stay in your report archive</Text></View></Card> : <Animated.View style={{ opacity: entrance, transform: [{ translateY: rise }] }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.months}>{reports.map((item) => { const active = item.id === report.id; return <Pressable key={item.id} onPress={() => setSelectedId(item.id)} style={[styles.month, { backgroundColor: active ? theme.goldSoft : theme.surface, borderColor: active ? theme.gold : theme.line }]}><Text style={[styles.monthName, { color: active ? theme.goldStrong : theme.fg }]}>{item.month.slice(0, 3)}</Text><Text style={[styles.monthYear, { color: theme.muted }]}>{item.year}</Text>{active ? <View style={[styles.monthDot, { backgroundColor: theme.goldStrong }]} /> : null}</Pressable>; })}</ScrollView>

      <LinearGradient colors={dark ? ['#2B2114', '#17191D', '#111419'] : ['#FFF3D9', '#FFF9EC', '#FFFFFF']} style={[styles.hero, { borderColor: theme.gold }]}>
        <View style={styles.heroTop}><View><Text style={[styles.heroEyebrow, { color: theme.goldStrong }]}>MONTH IN REVIEW</Text><Text style={[styles.heroTitle, { color: theme.fg }]}>{report.month} {report.year}</Text><Text style={[styles.heroSubtitle, { color: theme.muted }]}>Consistency built one focused day at a time.</Text></View><CalendarCheck2 size={32} color={theme.goldStrong} /></View>
        <View style={styles.heroChart}>{report.bars.map((height, index) => <View key={index} style={styles.barColumn}><View style={[styles.barTrack, { backgroundColor: theme.sunken }]}><View style={[styles.barFill, { height: `${height}%`, backgroundColor: index === report.bars.length - 1 ? theme.gold : theme.primary }]} /></View><Text style={[styles.barLabel, { color: theme.faint }]}>W{index + 1}</Text></View>)}</View>
      </LinearGradient>

      <View style={styles.metricGrid}><ReportMetric icon={<Clock3 size={17} color={theme.primaryStrong} />} value={report.hours} label="Study time" /><ReportMetric icon={<Target size={17} color={theme.success} />} value={String(report.questions)} label="Questions" /><ReportMetric icon={<CheckCircle2 size={17} color={theme.goldStrong} />} value={`${report.accuracy}%`} label="Accuracy" /><ReportMetric icon={<BookOpenCheck size={17} color={theme.primaryStrong} />} value={String(report.notes)} label="Notes done" /></View>

      <Card style={styles.weakCard}><View style={styles.weakHeading}><View style={[styles.brain, { backgroundColor: theme.dangerSoft }]}><BrainCircuit size={20} color={theme.danger} /></View><View><Text style={[styles.weakEyebrow, { color: theme.danger }]}>FOCUS NEXT</Text><Text style={[styles.weakTitle, { color: theme.fg }]}>Concepts needing attention</Text></View></View><View style={styles.chips}>{report.weak.map((item) => <View key={item} style={[styles.chip, { backgroundColor: theme.sunken, borderColor: theme.line }]}><Text style={[styles.chipText, { color: theme.fg }]}>{item}</Text></View>)}</View><View style={[styles.goalRow, { borderTopColor: theme.line }]}><CalendarCheck2 size={15} color={theme.success} /><Text style={[styles.goalCopy, { color: theme.muted }]}><Text style={{ color: theme.fg, fontFamily: font.bold }}>{report.goalDays} goal days</Text> completed this month</Text></View></Card>
    </Animated.View>}
  </ScrollView></SafeAreaView>;
}

function ReportMetric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  const { theme } = useAppTheme();
  return <Card style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: theme.sunken }]}>{icon}</View><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, { color: theme.fg }]}>{value}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text></Card>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: spacing.lg, paddingBottom: 110, gap: spacing.lg }, header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, back: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, minWidth: 0 }, eyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, title: { marginTop: 4, fontFamily: font.extraBold, fontSize: 27, letterSpacing: -.7 }, description: { marginTop: 3, fontFamily: font.regular, fontSize: 10, lineHeight: 15 }, crown: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, lockedCard: { minHeight: 280, padding: 22, alignItems: 'center', justifyContent: 'center' }, lockOrb: { width: 68, height: 68, borderRadius: 23, alignItems: 'center', justifyContent: 'center' }, lockTitle: { marginTop: 18, fontFamily: font.extraBold, fontSize: 20, textAlign: 'center' }, lockCopy: { marginTop: 7, maxWidth: 360, fontFamily: font.regular, fontSize: 11, lineHeight: 18, textAlign: 'center' }, lockFeature: { minHeight: 48, marginTop: 20, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8 }, lockFeatureText: { flex: 1, fontFamily: font.semibold, fontSize: 9 }, months: { gap: 8, paddingRight: spacing.lg }, month: { width: 75, minHeight: 66, borderWidth: 1, borderRadius: 15, padding: 10, position: 'relative' }, monthName: { fontFamily: font.extraBold, fontSize: 13 }, monthYear: { marginTop: 3, fontFamily: font.medium, fontSize: 8 }, monthDot: { position: 'absolute', width: 5, height: 5, borderRadius: 3, right: 9, top: 9 }, hero: { minHeight: 255, marginTop: 14, borderWidth: 1, borderRadius: 23, padding: 17, overflow: 'hidden' }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, heroEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.1 }, heroTitle: { marginTop: 5, fontFamily: font.extraBold, fontSize: 24 }, heroSubtitle: { marginTop: 4, fontFamily: font.regular, fontSize: 9 }, heroChart: { height: 128, marginTop: 21, flexDirection: 'row', alignItems: 'flex-end', gap: 9 }, barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' }, barTrack: { width: '66%', height: 100, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' }, barFill: { width: '100%', borderRadius: 8 }, barLabel: { marginTop: 6, fontFamily: font.bold, fontSize: 7 }, metricGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metric: { width: '48.7%', minHeight: 108, padding: 12 }, metricIcon: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, metricValue: { marginTop: 9, fontFamily: font.extraBold, fontSize: 18 }, metricLabel: { marginTop: 2, fontFamily: font.medium, fontSize: 8 }, weakCard: { marginTop: 12, padding: 14 }, weakHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brain: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, weakEyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 }, weakTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 14 }, chips: { marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { minHeight: 34, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' }, chipText: { fontFamily: font.semibold, fontSize: 9 }, goalRow: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 7 }, goalCopy: { fontFamily: font.regular, fontSize: 9 },
});
