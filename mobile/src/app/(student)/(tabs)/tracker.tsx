import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookCheck, CalendarClock, Flame, Gauge, GraduationCap, RotateCcw, Sparkles, Target, TrendingUp } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '@/components/ui';
import { RevisionTrackerShortcut } from '@/components/revision-tracker-shortcut';
import { MonthlyReportShortcut } from '@/components/monthly-report-shortcut';
import { GrandSessionControl, ProgressBar } from '@/components/study-ui';
import { TrackerStreakCalendar } from '@/components/tracker-streak-calendar';
import { font, layout, spacing, themes } from '@/constants/theme';
import { demoStudy, formatMinutes, useDemoStudyClock } from '@/lib/demo-study';
import { useAppTheme } from '@/providers/app-providers';

const nativeDriver = Platform.OS !== 'web';

const week = [
  { day: 'M', minutes: 95 }, { day: 'T', minutes: 132 }, { day: 'W', minutes: 48 },
  { day: 'T', minutes: 164 }, { day: 'F', minutes: 118 }, { day: 'S', minutes: 76 }, { day: 'S', minutes: 78 },
];
const maxMinutes = 180;

function ConsistencyChart() {
  const { theme } = useAppTheme();
  const totalMinutes = week.reduce((sum, entry) => sum + entry.minutes, 0);
  return <Card style={styles.chartCard}>
    <View style={styles.chartHeading}><View><Text style={[styles.sectionEyebrow, { color: theme.primary }]}>LAST 7 DAYS</Text><Text style={[styles.cardTitle, { color: theme.fg }]}>Study consistency</Text><Text style={[styles.chartSummary, { color: theme.muted }]}>{formatMinutes(totalMinutes)} total · 1h 42m daily average</Text></View><View style={[styles.trendBadge, { backgroundColor: theme.successSoft }]}><TrendingUp color={theme.success} size={15} /><Text style={[styles.trendText, { color: theme.success }]}>+12%</Text></View></View>
    <View style={styles.chartArea}>
      <View style={[styles.goalLine, { borderTopColor: theme.lineStrong }]}><Text style={[styles.goalLabel, { color: theme.faint }]}>2h goal</Text></View>
      <View style={styles.bars}>{week.map((entry, index) => { const height = Math.max(10, Math.round((entry.minutes / maxMinutes) * 104)); const today = index === week.length - 1; return <View key={`${entry.day}-${index}`} style={styles.barColumn}><Text style={[styles.barValue, { color: today ? theme.primaryStrong : theme.muted }]}>{Math.round(entry.minutes / 6) / 10}h</Text><View style={[styles.barTrack, { backgroundColor: theme.sunken }]}><LinearGradient colors={today ? [theme.primaryStrong, theme.primary] : [theme.lineStrong, theme.primarySoft]} style={[styles.barFill, { height }]} /></View><Text style={[styles.dayLabel, { color: today ? theme.primaryStrong : theme.muted }]}>{entry.day}</Text>{today ? <View style={[styles.todayDot, { backgroundColor: theme.primary }]} /> : null}</View>; })}</View>
    </View>
    <View style={styles.chartInsights}><Insight icon={<Target color={theme.primary} size={16} />} value="5/7" label="Goal days" /><View style={[styles.insightDivider, { backgroundColor: theme.line }]} /><Insight icon={<Flame color={theme.goldStrong} size={16} />} value="2h 44m" label="Best day" /><View style={[styles.insightDivider, { backgroundColor: theme.line }]} /><Insight icon={<CalendarClock color={theme.success} size={16} />} value="6 days" label="Current streak" /></View>
  </Card>;
}

function Insight({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  const { theme } = useAppTheme();
  return <View style={styles.insight}>{icon}<Text style={[styles.insightValue, { color: theme.fg }]}>{value}</Text><Text style={[styles.insightLabel, { color: theme.muted }]}>{label}</Text></View>;
}

function TrackerHeaderMark() {
  const { theme } = useAppTheme();
  const [rotation] = useState(() => new Animated.Value(0));
  const [hatTurn] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const orbitLoop = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: nativeDriver }));
    const hatLoop = Animated.loop(Animated.timing(hatTurn, { toValue: 1, duration: 4200, easing: Easing.linear, useNativeDriver: nativeDriver }));
    orbitLoop.start(); hatLoop.start();
    return () => { orbitLoop.stop(); hatLoop.stop(); };
  }, [hatTurn, rotation]);
  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const hatRotateY = hatTurn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const hatScale = hatTurn.interpolate({ inputRange: [0, .25, .5, .75, 1], outputRange: [1, .9, 1, .9, 1] });
  return <View pointerEvents="none" style={styles.headerMark}><Animated.View style={[styles.headerMarkOrbit, { borderColor: theme.primary, transform: [{ rotate }] }]}><View style={[styles.headerMarkDot, { backgroundColor: theme.primaryStrong }]} /></Animated.View><Animated.View style={{ transform: [{ perspective: 500 }, { rotateY: hatRotateY }, { scale: hatScale }] }}><GraduationCap size={24} color={theme.primaryStrong} strokeWidth={2} /></Animated.View></View>;
}

function TrackerHeroMotion({ active }: { active: boolean }) {
  const { theme } = useAppTheme();
  const [orbit] = useState(() => new Animated.Value(0));
  const [drift] = useState(() => new Animated.Value(0));
  const [twinkle] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const orbitLoop = Animated.loop(Animated.timing(orbit, { toValue: 1, duration: active ? 7200 : 11000, easing: Easing.linear, useNativeDriver: nativeDriver }));
    const driftLoop = Animated.loop(Animated.sequence([Animated.timing(drift, { toValue: 1, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }), Animated.timing(drift, { toValue: 0, duration: 2100, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver })]));
    const twinkleLoop = Animated.loop(Animated.sequence([Animated.timing(twinkle, { toValue: 1, duration: 620, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }), Animated.timing(twinkle, { toValue: 0, duration: 760, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver })]));
    orbitLoop.start(); driftLoop.start(); twinkleLoop.start();
    return () => { orbitLoop.stop(); driftLoop.stop(); twinkleLoop.stop(); };
  }, [active, drift, orbit, twinkle]);
  const rotate = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const rise = drift.interpolate({ inputRange: [0, 1], outputRange: [7, -8] });
  const sway = drift.interpolate({ inputRange: [0, 1], outputRange: [-6, 7] });
  const sparkScale = twinkle.interpolate({ inputRange: [0, 1], outputRange: [.35, 1.15] });
  const accent = active ? theme.goldStrong : theme.primaryStrong;
  return <View pointerEvents="none" accessibilityElementsHidden style={styles.trackerHeroMotion}>
    <Animated.View style={[styles.trackerOrbitSystem, { borderColor: `${accent}30`, transform: [{ rotate }] }]}><View style={[styles.trackerOrbitInner, { borderColor: `${accent}24` }]} /><View style={[styles.trackerOrbitDot, { backgroundColor: accent }]} /></Animated.View>
    <View style={[styles.trackerContour, styles.trackerContourOne, { borderColor: theme.lineStrong }]} /><View style={[styles.trackerContour, styles.trackerContourTwo, { borderColor: theme.line }]} />
    <Animated.View style={[styles.trackerParticle, styles.trackerParticleOne, { backgroundColor: accent, transform: [{ translateX: sway }, { translateY: rise }] }]} />
    <Animated.View style={[styles.trackerParticle, styles.trackerParticleTwo, { backgroundColor: theme.primaryStrong, opacity: twinkle, transform: [{ translateY: sway }] }]} />
    <Animated.View style={[styles.trackerSpark, { backgroundColor: accent, opacity: twinkle, transform: [{ scale: sparkScale }, { rotate: '45deg' }] }]} />
  </View>;
}

function FocusGauge({ percent }: { percent: number }) {
  const { theme } = useAppTheme();
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1, duration: 1150, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }), Animated.timing(pulse, { toValue: 0, duration: 1150, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver })]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [.94, 1.08] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [.34, .08] });
  return <View style={styles.focusGauge}><Animated.View style={[styles.focusGaugePulse, { borderColor: theme.primaryStrong, opacity: ringOpacity, transform: [{ scale: ringScale }] }]} /><View style={[styles.focusGaugeRing, { backgroundColor: theme.primarySoft, borderColor: theme.lineStrong }]}><Gauge size={16} color={theme.primaryStrong} /><Text style={[styles.focusGaugeValue, { color: theme.fg }]}>{percent}%</Text><Text style={[styles.focusGaugeLabel, { color: theme.primaryStrong }]}>PACE</Text></View></View>;
}

function TrackerMetricCard({ icon, label, value, detail, color, progress }: { icon: ReactNode; label: string; value: string; detail: string; color: string; progress: number }) {
  const { theme } = useAppTheme();
  const filled = Math.max(1, Math.round(progress * 6));
  return <Card style={styles.trackerMetricCard}><View style={styles.metricCardTop}><View style={[styles.metricIcon, { backgroundColor: `${color}18` }]}>{icon}</View><View style={[styles.metricStatusDot, { backgroundColor: color }]} /></View><Text style={[styles.metricCardLabel, { color }]}>{label}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricCardValue, { color: theme.fg }]}>{value}</Text><Text numberOfLines={1} style={[styles.metricCardDetail, { color: theme.muted }]}>{detail}</Text><View style={styles.metricSegments}>{Array.from({ length: 6 }, (_, index) => <View key={index} style={[styles.metricSegment, { backgroundColor: index < filled ? color : theme.sunken }]} />)}</View></Card>;
}

function ExamPressureDial({ value }: { value: number }) {
  const { theme } = useAppTheme();
  const [rotation] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(rotation, { toValue: 1, duration: 10500, easing: Easing.linear, useNativeDriver: nativeDriver }));
    loop.start();
    return () => loop.stop();
  }, [rotation]);
  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <View style={styles.examDial}><Animated.View style={[styles.examDialOrbit, { borderColor: theme.goldStrong, transform: [{ rotate }] }]}><View style={[styles.examDialDot, { backgroundColor: theme.goldStrong }]} /></Animated.View><View style={[styles.pressure, { backgroundColor: theme.goldSoft }]}><Text style={[styles.pressureValue, { color: theme.goldStrong }]}>{value}</Text><Text style={[styles.pressureText, { color: theme.goldStrong }]}>PRESSURE</Text></View></View>;
}

function ReadinessCard({ icon, label, value, detail, progress, color }: { icon: ReactNode; label: string; value: string; detail: string; progress: number; color: string }) {
  const { theme } = useAppTheme();
  return <Card style={styles.readinessCard}><View style={styles.readinessTop}><View style={[styles.readinessIcon, { backgroundColor: `${color}18` }]}>{icon}</View><Text style={[styles.readinessValue, { color: theme.fg }]}>{value}</Text></View><Text style={[styles.readinessCardLabel, { color }]}>{label}</Text><Text style={[styles.readinessDetail, { color: theme.muted }]}>{detail}</Text><View style={[styles.readinessTrack, { backgroundColor: theme.sunken }]}><View style={[styles.readinessFill, { width: `${Math.min(100, progress)}%`, backgroundColor: color }]} /></View></Card>;
}

export default function TrackerScreen() {
  const { theme } = useAppTheme(); const dark = theme.canvas === themes.dark.canvas; const study = useDemoStudyClock();
  const { width } = useWindowDimensions();
  const wide = width >= layout.tabletBreakpoint;
  const remaining = Math.max(0, demoStudy.targetMinutes - study.todayMinutes);
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.canvas }]}><ScrollView contentContainerStyle={[styles.content, wide && styles.contentWide]} showsVerticalScrollIndicator={false}>
    <View style={styles.pageHeading}><View style={styles.pageHeadingCopy}><Text style={[styles.eyebrow, { color: theme.primary }]}>STUDY ANALYTICS</Text><Text style={[styles.title, { color: theme.fg }]}>Tracker</Text><Text style={[styles.description, { color: theme.muted }]}>Understand your rhythm and keep each day intentional.</Text></View><TrackerHeaderMark /></View>

    <View style={[styles.responsiveRow, wide && styles.responsiveRowWide]}>
    <View style={[styles.responsiveCell, wide && styles.responsiveCellWide]}><LinearGradient colors={dark ? ['#17213A', '#111624', '#0D0F14'] : ['#EEF4FF', '#F7FAFF', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.sessionHero, { borderColor: theme.line }]}>
      <TrackerHeroMotion active={study.checkedIn} /><View style={styles.heroGlow} /><View style={styles.sessionTop}><Text style={[styles.sectionEyebrow, { color: study.checkedIn ? theme.goldStrong : theme.primary }]}>FOCUS SESSION</Text><View style={[styles.livePill, { backgroundColor: study.checkedIn ? theme.goldSoft : theme.primarySoft }]}><View style={[styles.liveDot, { backgroundColor: study.checkedIn ? theme.goldStrong : theme.primary }]} /><Text style={[styles.liveText, { color: study.checkedIn ? theme.goldStrong : theme.primaryStrong }]}>{study.checkedIn ? 'LIVE' : 'IDLE'}</Text></View></View><View style={styles.sessionIntro}><Text style={[styles.sessionTitle, { color: theme.fg }]}>{study.checkedIn ? 'You are in the zone' : 'Ready when you are'}</Text><Text style={[styles.sessionCopy, { color: theme.muted }]}>{study.checkedIn ? 'This session is adding to today’s consistency.' : 'Start a focused session when you are ready.'}</Text></View>
      <View style={styles.sessionControl}><GrandSessionControl active={study.checkedIn} seconds={study.sessionSeconds} onPress={study.toggleSession} /></View>
    </LinearGradient></View>

    <View style={[styles.responsiveCell, wide && styles.responsiveCellWide]}><Card style={wide ? { ...styles.focusCard, ...styles.focusCardWide } : styles.focusCard}><View pointerEvents="none" style={[styles.focusCardAccent, { backgroundColor: theme.primarySoft }]} /><View style={styles.targetTop}><View style={styles.focusCopy}><View style={[styles.focusLabelRow, { backgroundColor: theme.primarySoft }]}><Target size={13} color={theme.primaryStrong} /><Text style={[styles.sectionEyebrow, { color: theme.primary }]}>TODAY’S FOCUS</Text></View><Text style={[styles.focusValue, { color: theme.fg }]}>{formatMinutes(study.todayMinutes)}</Text><Text style={[styles.targetHint, { color: theme.muted }]}>{remaining ? `${remaining} minutes to complete your goal` : 'Daily target completed — excellent work'}</Text></View><FocusGauge percent={study.targetPercent} /></View><View style={styles.progressSpacing}><ProgressBar value={study.targetPercent} /></View><View style={styles.targetLabels}><Text style={[styles.targetSmall, { color: theme.faint }]}>Session start</Text><Text style={[styles.targetSmall, { color: theme.muted }]}>Daily target · 2h</Text></View><View style={[styles.focusInsight, { backgroundColor: theme.sunken }]}><Sparkles size={14} color={theme.primaryStrong} /><Text style={[styles.focusInsightText, { color: theme.muted }]}>{study.targetPercent >= 65 ? 'You are moving at a strong pace today.' : 'One focused block will build today’s momentum.'}</Text></View></Card></View>
    </View>

    <View style={[styles.responsiveRow, wide && styles.responsiveRowWide]}>
      <View style={[styles.responsiveCell, wide && styles.responsiveCellWide]}><ConsistencyChart /></View>
      <View style={[styles.responsiveCell, wide && styles.responsiveCellWide]}><TrackerStreakCalendar /></View>
    </View>

    <View style={[styles.responsiveRow, wide && styles.responsiveRowWide]}>
    <View style={[styles.responsiveCell, wide && styles.responsiveCellWide]}><View style={styles.metricGrid}><TrackerMetricCard icon={<Flame color={theme.goldStrong} fill={theme.goldStrong} size={19} />} label="STREAK" value={`${demoStudy.streak} days`} detail="Current learning run" color={theme.goldStrong} progress={.68} /><TrackerMetricCard icon={<TrendingUp color={theme.success} size={19} />} label="MOMENTUM" value={`${demoStudy.momentum}`} detail="Strong this week" color={theme.success} progress={.84} /></View></View>

    <View style={[styles.responsiveCell, wide && styles.responsiveCellWide]}><Card style={styles.examCard}><View pointerEvents="none" style={[styles.examGlow, { backgroundColor: theme.goldSoft }]} /><View style={styles.examHeading}><View style={styles.examHeadingCopy}><View style={styles.examEyebrowRow}><CalendarClock color={theme.goldStrong} size={16} /><Text style={[styles.sectionEyebrow, { color: theme.goldStrong }]}>EXAM COUNTDOWN</Text></View><Text numberOfLines={1} style={[styles.examName, { color: theme.fg }]}>{demoStudy.exam.label}</Text></View><View style={[styles.examStatus, { backgroundColor: theme.goldSoft }]}><Text style={[styles.examStatusText, { color: theme.goldStrong }]}>IN MOTION</Text></View></View><View style={styles.examRow}><View style={styles.examCountCopy}><Text style={[styles.examDays, { color: theme.fg }]}>{demoStudy.exam.daysLeft}<Text style={[styles.daysSuffix, { color: theme.muted }]}> days</Text></Text><Text style={[styles.examDate, { color: theme.muted }]}>until {demoStudy.exam.date}</Text><Text style={[styles.examPrompt, { color: theme.goldStrong }]}>Build calm through consistent preparation.</Text></View><ExamPressureDial value={demoStudy.exam.pressure} /></View><View style={styles.progressSpacing}><ProgressBar value={demoStudy.exam.pressure} color={theme.gold} /></View><View style={styles.examMilestones}><Text style={[styles.examMilestone, { color: theme.goldStrong }]}>NOW</Text><View style={[styles.examMilestoneLine, { backgroundColor: theme.line }]} /><Text style={[styles.examMilestone, { color: theme.muted }]}>REVISION WINDOW</Text><View style={[styles.examMilestoneLine, { backgroundColor: theme.line }]} /><Text style={[styles.examMilestone, { color: theme.muted }]}>EXAM</Text></View></Card></View>
    </View>

    <View style={[styles.responsiveRow, wide && styles.responsiveRowWide]}>
      <View style={[styles.responsiveCell, wide && styles.responsiveCellWide]}><View><View style={styles.readinessHeading}><View><Text style={[styles.readinessLabel, { color: theme.primary }]}>YOUR READINESS</Text><Text style={[styles.readinessTitle, { color: theme.fg }]}>Preparation signals</Text></View><BookCheck size={20} color={theme.primaryStrong} /></View><View style={styles.readiness}><ReadinessCard icon={<BookCheck size={18} color={theme.primaryStrong} />} label="SYLLABUS" value={`${demoStudy.syllabusPercent}%`} detail="Coverage completed" progress={demoStudy.syllabusPercent} color={theme.primaryStrong} /><ReadinessCard icon={<RotateCcw size={18} color={theme.goldStrong} />} label="REVISIONS" value={`${demoStudy.revisions}`} detail="Intentional returns" progress={60} color={theme.goldStrong} /></View></View></View>
      <View style={[styles.responsiveCell, styles.shortcutStack, wide && styles.responsiveCellWide]}><RevisionTrackerShortcut /><MonthlyReportShortcut /></View>
    </View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  headerMark: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  headerMarkOrbit: { position: 'absolute', width: 42, height: 42, borderWidth: 1, borderStyle: 'dashed', borderRadius: 21, alignItems: 'center' },
  headerMarkDot: { width: 6, height: 6, marginTop: -3, borderRadius: 3 },
  trackerHeroMotion: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
  trackerOrbitSystem: { position: 'absolute', width: 174, height: 174, borderWidth: 1, borderRadius: 87, right: -77, top: -76, alignItems: 'center', justifyContent: 'center' },
  trackerOrbitInner: { width: 116, height: 116, borderWidth: 1, borderStyle: 'dashed', borderRadius: 58 },
  trackerOrbitDot: { position: 'absolute', width: 9, height: 9, top: -5, left: 82, borderRadius: 5 },
  trackerContour: { position: 'absolute', borderWidth: 1, borderRadius: 150, opacity: .35 },
  trackerContourOne: { width: 224, height: 224, left: -150, bottom: -129 },
  trackerContourTwo: { width: 150, height: 150, left: -104, bottom: -75 },
  trackerParticle: { position: 'absolute', width: 6, height: 6, borderRadius: 3 },
  trackerParticleOne: { right: 47, top: 116 },
  trackerParticleTwo: { width: 4, height: 4, left: 39, top: 81 },
  trackerSpark: { position: 'absolute', width: 6, height: 6, borderRadius: 1, right: 27, bottom: 67 },
  focusCard: { overflow: 'hidden', padding: 15 },
  focusCardWide: { minHeight: 326, justifyContent: 'center' },
  focusCardAccent: { position: 'absolute', width: 148, height: 148, borderRadius: 74, right: -79, top: -85, opacity: .55 },
  focusCopy: { flex: 1, minWidth: 0 },
  focusLabelRow: { alignSelf: 'flex-start', minHeight: 28, borderRadius: 14, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  focusGauge: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  focusGaugePulse: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 7 },
  focusGaugeRing: { width: 62, height: 62, borderRadius: 31, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  focusGaugeValue: { marginTop: 1, fontFamily: font.extraBold, fontSize: 14, letterSpacing: -.4 },
  focusGaugeLabel: { marginTop: -1, fontFamily: font.bold, fontSize: 6, letterSpacing: .8 },
  focusInsight: { minHeight: 38, marginTop: 12, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  focusInsightText: { flex: 1, fontFamily: font.medium, fontSize: 9, lineHeight: 13 },
  trackerMetricCard: { flex: 1, minWidth: 0, minHeight: 164, padding: 13, overflow: 'hidden' },
  metricCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metricIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricStatusDot: { width: 6, height: 6, borderRadius: 3 },
  metricCardLabel: { marginTop: 12, fontFamily: font.bold, fontSize: 8, letterSpacing: 1.05 },
  metricCardValue: { marginTop: 3, fontFamily: font.extraBold, fontSize: 20, letterSpacing: -.55 },
  metricCardDetail: { marginTop: 2, fontFamily: font.regular, fontSize: 8 },
  metricSegments: { marginTop: 12, height: 7, flexDirection: 'row', gap: 3 },
  metricSegment: { flex: 1, height: 6, borderRadius: 3 },
  examCard: { overflow: 'hidden', padding: 15 },
  examGlow: { position: 'absolute', width: 170, height: 170, borderRadius: 85, right: -91, bottom: -98, opacity: .58 },
  examHeadingCopy: { flex: 1, minWidth: 0 },
  examEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  examStatus: { minHeight: 27, borderRadius: 14, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  examStatusText: { fontFamily: font.bold, fontSize: 7, letterSpacing: .7 },
  examCountCopy: { flex: 1, minWidth: 0 },
  examPrompt: { marginTop: 8, maxWidth: 210, fontFamily: font.medium, fontSize: 8, lineHeight: 12 },
  examDial: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center' },
  examDialOrbit: { position: 'absolute', width: 76, height: 76, borderRadius: 38, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center' },
  examDialDot: { width: 8, height: 8, marginTop: -4, borderRadius: 4 },
  examMilestones: { minHeight: 31, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  examMilestone: { fontFamily: font.bold, fontSize: 6, letterSpacing: .5 },
  examMilestoneLine: { flex: 1, height: 1 },
  readinessHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readinessTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 17, letterSpacing: -.35 },
  readinessCard: { flex: 1, minWidth: 0, minHeight: 147, padding: 13 },
  readinessTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readinessIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  readinessValue: { fontFamily: font.extraBold, fontSize: 20, letterSpacing: -.5 },
  readinessCardLabel: { marginTop: 11, fontFamily: font.bold, fontSize: 8, letterSpacing: 1 },
  readinessDetail: { marginTop: 3, fontFamily: font.regular, fontSize: 8 },
  readinessTrack: { width: '100%', height: 6, marginTop: 12, borderRadius: 3, overflow: 'hidden' },
  readinessFill: { height: '100%', borderRadius: 3 },
  safe: { flex: 1 }, content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 106, maxWidth: 720, width: '100%', alignSelf: 'center' }, contentWide: { maxWidth: layout.studentContentMaxWidth, paddingHorizontal: spacing.xl }, responsiveRow: { gap: spacing.lg }, responsiveRowWide: { flexDirection: 'row', alignItems: 'flex-start' }, responsiveCell: { minWidth: 0 }, responsiveCellWide: { flex: 1 }, shortcutStack: { gap: spacing.lg }, eyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.35 }, title: { fontFamily: font.extraBold, fontSize: 29, letterSpacing: -0.8, marginTop: 4 }, description: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, marginTop: 3 }, sessionHero: { minHeight: 326, borderWidth: 1, borderRadius: 22, padding: spacing.lg, overflow: 'hidden' }, heroGlow: { position: 'absolute', width: 190, height: 190, borderRadius: 95, right: -80, top: -90, backgroundColor: 'rgba(124,156,255,0.11)' }, sessionTop: { minHeight: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, sessionIntro: { alignItems: 'center', paddingHorizontal: 18, marginTop: 9 }, sessionTitle: { fontFamily: font.extraBold, fontSize: 20, letterSpacing: -0.4, textAlign: 'center' }, sessionCopy: { maxWidth: 265, fontFamily: font.regular, fontSize: 11, lineHeight: 16, marginTop: 4, textAlign: 'center' }, sessionControl: { flex: 1, minHeight: 184, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, sectionEyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.15 }, livePill: { minHeight: 29, borderRadius: 15, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, liveDot: { width: 6, height: 6, borderRadius: 3 }, liveText: { fontFamily: font.bold, fontSize: 9, letterSpacing: 0.7 }, targetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, focusValue: { marginTop: 4, fontFamily: font.extraBold, fontSize: 31, letterSpacing: -0.8 }, targetHint: { marginTop: 2, fontFamily: font.regular, fontSize: 10 }, percentRing: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, target: { fontFamily: font.extraBold, fontSize: 17 }, progressSpacing: { marginTop: spacing.md }, targetLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }, targetSmall: { fontFamily: font.medium, fontSize: 9 }, chartCard: { gap: 0 }, chartHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }, cardTitle: { fontFamily: font.extraBold, fontSize: 19, letterSpacing: -0.4, marginTop: 4 }, chartSummary: { fontFamily: font.regular, fontSize: 10, marginTop: 4 }, trendBadge: { minHeight: 30, borderRadius: 15, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, trendText: { fontFamily: font.bold, fontSize: 10 }, chartArea: { height: 164, marginTop: 18, position: 'relative' }, goalLine: { position: 'absolute', top: 42, left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed' }, goalLabel: { position: 'absolute', right: 0, top: -15, fontFamily: font.medium, fontSize: 8 }, bars: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 7 }, barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' }, barValue: { fontFamily: font.semibold, fontSize: 8, marginBottom: 5 }, barTrack: { width: '74%', maxWidth: 28, height: 108, borderRadius: 9, overflow: 'hidden', justifyContent: 'flex-end' }, barFill: { width: '100%', borderRadius: 9 }, dayLabel: { fontFamily: font.bold, fontSize: 9, marginTop: 6 }, todayDot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 }, chartInsights: { minHeight: 73, borderTopWidth: 0, flexDirection: 'row', alignItems: 'center', marginTop: 11 }, insight: { flex: 1, alignItems: 'center' }, insightValue: { fontFamily: font.bold, fontSize: 12, marginTop: 4 }, insightLabel: { fontFamily: font.regular, fontSize: 8, marginTop: 2 }, insightDivider: { width: 1, height: 37 }, metricGrid: { flexDirection: 'row', gap: spacing.sm }, examHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, examName: { fontFamily: font.bold, fontSize: 15, marginTop: 4 }, examRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md }, examDays: { fontFamily: font.extraBold, fontSize: 30, letterSpacing: -0.8 }, daysSuffix: { fontFamily: font.medium, fontSize: 14, letterSpacing: 0 }, examDate: { fontFamily: font.regular, fontSize: 10, marginTop: 3 }, pressure: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' }, pressureValue: { fontFamily: font.extraBold, fontSize: 17 }, pressureText: { fontFamily: font.bold, fontSize: 7 }, readinessLabel: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.2 }, readiness: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  pageHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, pageHeadingCopy: { flex: 1, minWidth: 0 },
});
