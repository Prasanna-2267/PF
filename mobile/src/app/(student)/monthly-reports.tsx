import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowLeft, BookOpenCheck, CalendarCheck2, CheckCircle2, Clock3, Crown, Flame, LockKeyhole, RefreshCw, Sparkles } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import { font, radius, spacing, themes } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { listMonthlyReports, type MonthlyReport } from '@/lib/monthly-report-api';
import { isDemoSession } from '@/lib/student-session';
import { useAppTheme } from '@/providers/app-providers';

const nativeDriver = Platform.OS !== 'web';
const demoReports: MonthlyReport[] = [
  demoReport('2026-08', 'LIVE', 123_600, [15_200, 26_500, 33_400, 38_700, 9_800], 19, 8, 12, 42),
  demoReport('2026-07', 'FROZEN', 147_900, [28_200, 31_700, 38_000, 41_600, 8_400], 23, 11, 16, 36),
  demoReport('2026-06', 'FROZEN', 103_200, [18_400, 24_100, 27_300, 26_200, 7_200], 16, 6, 9, 29),
  demoReport('2026-05', 'FROZEN', 80_100, [13_400, 18_600, 20_800, 21_500, 5_800], 13, 5, 7, 23),
];

function demoReport(yearMonth: string, state: 'LIVE' | 'FROZEN', totalSeconds: number, weeklySeconds: number[], goalDays: number, notes: number, revisions: number, syllabus: number): MonthlyReport {
  return { id: state === 'LIVE' ? null : `demo-${yearMonth}`, yearMonth, state, timezone: 'Asia/Kolkata', course: { id: 'upsc-prelims', code: 'UPSC', name: 'UPSC Prelims' }, study: { totalSeconds, focusSeconds: Math.round(totalSeconds * .72), readingSeconds: Math.round(totalSeconds * .2), practiceSeconds: 0, revisionSeconds: Math.round(totalSeconds * .08), weeklySeconds, activeDays: goalDays + 2, goalDays }, streak: { qualifiedDays: goalDays, protectedDays: 1 }, learning: { notesCompleted: notes, revisionsCompleted: revisions, studyTasksCompleted: goalDays + 4, totalNotes: 42, syllabusCompleted: Math.round(42 * syllabus / 100), syllabusPercent: syllabus }, capabilities: { practiceAnalytics: false, practiceAnalyticsReason: 'PRACTICE_BACKEND_PAUSED' }, generatedAt: state === 'FROZEN' ? `${yearMonth}-28T12:00:00.000Z` : null };
}

function monthLabel(yearMonth: string) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function duration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export default function MonthlyReportsScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const dark = theme.canvas === themes.dark.canvas;
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const paid = user?.plan === 'paid';
  const demo = isDemoSession(accessToken, user?.id);
  const query = useQuery({ queryKey: ['student', 'monthly-reports'], queryFn: listMonthlyReports, enabled: paid && !demo, staleTime: 60_000 });
  const reports = useMemo(() => demo ? demoReports : query.data?.items ?? [], [demo, query.data?.items]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [entrance] = useState(() => new Animated.Value(0));
  useEffect(() => { Animated.timing(entrance, { toValue: 1, duration: 560, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }).start(); }, [entrance]);
  const report = useMemo(() => reports.find((item) => item.yearMonth === selectedId) ?? reports[0], [reports, selectedId]);
  const rise = entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]} edges={['top', 'left', 'right']}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft size={19} color={theme.fg} /></Pressable><View style={styles.headerCopy}><Text style={[styles.eyebrow, { color: theme.goldStrong }]}>PAID INSIGHTS</Text><Text style={[styles.title, { color: theme.fg }]}>Monthly reports</Text><Text style={[styles.description, { color: theme.muted }]}>Your learning history, preserved month by month.</Text></View><View style={[styles.crown, { backgroundColor: theme.goldSoft }]}><Crown size={20} color={theme.goldStrong} /></View></View>

    {!paid ? <LockedReport /> : query.isLoading && !demo ? <StatusPanel icon={<ActivityIndicator color={theme.goldStrong} />} title="Preparing your archive" copy="Building your first monthly learning snapshots…" /> : query.isError && !demo ? <Pressable onPress={() => query.refetch()}><StatusPanel icon={<RefreshCw color={theme.goldStrong} size={22} />} title="Report archive unavailable" copy="Tap to try again. Your saved learning activity is safe." /></Pressable> : report ? <Animated.View style={{ opacity: entrance, transform: [{ translateY: rise }] }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.months}>{reports.map((item) => { const active = item.yearMonth === report.yearMonth; const label = monthLabel(item.yearMonth); return <Pressable key={item.yearMonth} onPress={() => setSelectedId(item.yearMonth)} style={[styles.month, { backgroundColor: active ? theme.goldSoft : theme.surface, borderColor: active ? theme.gold : theme.line }]}><Text style={[styles.monthName, { color: active ? theme.goldStrong : theme.fg }]}>{label.slice(0, 3)}</Text><Text style={[styles.monthYear, { color: theme.muted }]}>{item.yearMonth.slice(0, 4)}</Text>{item.state === 'LIVE' ? <Text style={[styles.live, { color: theme.success }]}>LIVE</Text> : null}{active ? <View style={[styles.monthDot, { backgroundColor: theme.goldStrong }]} /> : null}</Pressable>; })}</ScrollView>

      <LinearGradient colors={dark ? ['#2B2114', '#17191D', '#111419'] : ['#FFF3D9', '#FFF9EC', '#FFFFFF']} style={[styles.hero, { borderColor: theme.gold }]}>
        <View style={styles.heroTop}><View style={styles.flex}><Text style={[styles.heroEyebrow, { color: theme.goldStrong }]}>{report.state === 'LIVE' ? 'CURRENT MONTH · LIVE' : 'MONTH IN REVIEW'}</Text><Text style={[styles.heroTitle, { color: theme.fg }]}>{monthLabel(report.yearMonth)}</Text><Text style={[styles.heroSubtitle, { color: theme.muted }]}>{report.course.name} · {report.study.activeDays} active days</Text></View><CalendarCheck2 size={30} color={theme.goldStrong} /></View>
        <WeeklyChart values={report.study.weeklySeconds} />
      </LinearGradient>

      <View style={styles.metricGrid}><ReportMetric icon={<Clock3 size={17} color={theme.primaryStrong} />} value={duration(report.study.totalSeconds)} label="Study time" /><ReportMetric icon={<CheckCircle2 size={17} color={theme.success} />} value={String(report.study.goalDays)} label="Goal days" /><ReportMetric icon={<BookOpenCheck size={17} color={theme.goldStrong} />} value={String(report.learning.notesCompleted)} label="Notes completed" /><ReportMetric icon={<RefreshCw size={17} color={theme.primaryStrong} />} value={String(report.learning.revisionsCompleted)} label="Revisions" /></View>

      <Card style={styles.progressCard}><View style={styles.progressHeading}><View style={[styles.progressIcon, { backgroundColor: theme.primarySoft }]}><BookOpenCheck size={20} color={theme.primaryStrong} /></View><View style={styles.flex}><Text style={[styles.progressEyebrow, { color: theme.primary }]}>SYLLABUS PROGRESS</Text><Text style={[styles.progressTitle, { color: theme.fg }]}>{report.learning.syllabusPercent}% completed</Text></View><Text style={[styles.progressCount, { color: theme.muted }]}>{report.learning.syllabusCompleted}/{report.learning.totalNotes}</Text></View><View style={[styles.track, { backgroundColor: theme.sunken }]}><View style={[styles.fill, { backgroundColor: theme.primary, width: `${report.learning.syllabusPercent}%` }]} /></View><View style={[styles.signalRow, { borderTopColor: theme.line }]}><View style={styles.signal}><Flame size={15} color={theme.goldStrong} /><Text style={[styles.signalText, { color: theme.muted }]}><Text style={[styles.signalStrong, { color: theme.fg }]}>{report.streak.qualifiedDays}</Text> streak days</Text></View><View style={styles.signal}><CheckCircle2 size={15} color={theme.success} /><Text style={[styles.signalText, { color: theme.muted }]}><Text style={[styles.signalStrong, { color: theme.fg }]}>{report.learning.studyTasksCompleted}</Text> plan tasks</Text></View></View></Card>
    </Animated.View> : <StatusPanel icon={<CalendarCheck2 color={theme.goldStrong} size={22} />} title="No reports yet" copy="Your current month will appear after learning activity is recorded." />}
  </ScrollView></SafeAreaView>;
}

function LockedReport() { const { theme } = useAppTheme(); return <Card style={styles.lockedCard}><View style={[styles.lockOrb, { backgroundColor: theme.goldSoft }]}><LockKeyhole size={27} color={theme.goldStrong} /></View><Text style={[styles.lockTitle, { color: theme.fg }]}>Your long-term story, in one place.</Text><Text style={[styles.lockCopy, { color: theme.muted }]}>Monthly study time, goal days, notes, revisions and syllabus progress are available with Paid access.</Text><View style={[styles.lockFeature, { backgroundColor: theme.sunken }]}><Sparkles size={15} color={theme.goldStrong} /><Text style={[styles.lockFeatureText, { color: theme.fg }]}>Completed months remain frozen in your archive</Text></View></Card>; }
function StatusPanel({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) { const { theme } = useAppTheme(); return <Card style={styles.status}><View style={[styles.statusIcon, { backgroundColor: theme.goldSoft }]}>{icon}</View><Text style={[styles.statusTitle, { color: theme.fg }]}>{title}</Text><Text style={[styles.statusCopy, { color: theme.muted }]}>{copy}</Text></Card>; }
function WeeklyChart({ values }: { values: number[] }) { const { theme } = useAppTheme(); const max = Math.max(1, ...values); return <View style={styles.heroChart}>{values.map((value, index) => <View key={index} style={styles.barColumn}><View style={[styles.barTrack, { backgroundColor: theme.sunken }]}><View style={[styles.barFill, { height: `${Math.max(value ? 8 : 0, Math.round(value / max * 100))}%`, backgroundColor: index === values.length - 1 ? theme.gold : theme.primary }]} /></View><Text style={[styles.barLabel, { color: theme.faint }]}>W{index + 1}</Text></View>)}</View>; }
function ReportMetric({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { const { theme } = useAppTheme(); return <Card style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: theme.sunken }]}>{icon}</View><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricValue, { color: theme.fg }]}>{value}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text></Card>; }

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: spacing.lg, paddingBottom: 110, gap: spacing.lg }, flex: { flex: 1, minWidth: 0 }, header: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, back: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, headerCopy: { flex: 1, minWidth: 0 }, eyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, title: { marginTop: 4, fontFamily: font.extraBold, fontSize: 27, letterSpacing: -.7 }, description: { marginTop: 3, fontFamily: font.regular, fontSize: 10, lineHeight: 15 }, crown: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, lockedCard: { minHeight: 280, padding: 22, alignItems: 'center', justifyContent: 'center' }, lockOrb: { width: 68, height: 68, borderRadius: 23, alignItems: 'center', justifyContent: 'center' }, lockTitle: { marginTop: 18, fontFamily: font.extraBold, fontSize: 20, textAlign: 'center' }, lockCopy: { marginTop: 7, maxWidth: 360, fontFamily: font.regular, fontSize: 11, lineHeight: 18, textAlign: 'center' }, lockFeature: { minHeight: 48, marginTop: 20, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8 }, lockFeatureText: { flex: 1, fontFamily: font.semibold, fontSize: 9 }, status: { minHeight: 250, alignItems: 'center', justifyContent: 'center', padding: 22 }, statusIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, statusTitle: { marginTop: 14, fontFamily: font.extraBold, fontSize: 16 }, statusCopy: { marginTop: 5, maxWidth: 330, textAlign: 'center', fontFamily: font.regular, fontSize: 10, lineHeight: 16 }, months: { gap: 8, paddingRight: spacing.lg }, month: { width: 75, minHeight: 69, borderWidth: 1, borderRadius: 15, padding: 10, position: 'relative' }, monthName: { fontFamily: font.extraBold, fontSize: 13 }, monthYear: { marginTop: 3, fontFamily: font.medium, fontSize: 8 }, live: { marginTop: 5, fontFamily: font.bold, fontSize: 6, letterSpacing: 1 }, monthDot: { position: 'absolute', width: 5, height: 5, borderRadius: 3, right: 9, top: 9 }, hero: { minHeight: 255, marginTop: 14, borderWidth: 1, borderRadius: 23, padding: 17, overflow: 'hidden' }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }, heroEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.1 }, heroTitle: { marginTop: 5, fontFamily: font.extraBold, fontSize: 23 }, heroSubtitle: { marginTop: 4, fontFamily: font.regular, fontSize: 9 }, heroChart: { height: 128, marginTop: 21, flexDirection: 'row', alignItems: 'flex-end', gap: 9 }, barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' }, barTrack: { width: '66%', height: 100, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' }, barFill: { width: '100%', borderRadius: 8 }, barLabel: { marginTop: 6, fontFamily: font.bold, fontSize: 7 }, metricGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metric: { width: '48.7%', minHeight: 108, padding: 12 }, metricIcon: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, metricValue: { marginTop: 9, fontFamily: font.extraBold, fontSize: 18 }, metricLabel: { marginTop: 2, fontFamily: font.medium, fontSize: 8 }, progressCard: { marginTop: 12, padding: 14 }, progressHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, progressIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, progressEyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 }, progressTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 14 }, progressCount: { fontFamily: font.bold, fontSize: 9 }, track: { height: 7, marginTop: 14, borderRadius: radius.pill, overflow: 'hidden' }, fill: { height: '100%', borderRadius: radius.pill }, signalRow: { marginTop: 14, paddingTop: 12, borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 18 }, signal: { flexDirection: 'row', alignItems: 'center', gap: 6 }, signalText: { fontFamily: font.regular, fontSize: 9 }, signalStrong: { fontFamily: font.bold },
});
