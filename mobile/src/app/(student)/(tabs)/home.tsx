import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, Clock3, Flame, Play, RotateCcw, Square } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font } from '@/constants/theme';
import { formatDuration, formatMinutes, useDemoStudyClock } from '@/lib/demo-study';
import { allLessonEntries } from '@/lib/demo-catalog';
import { useLessonReaderStore } from '@/lib/lesson-reader-store';
import { useAppTheme } from '@/providers/app-providers';

function DottedPanel({ children, style, tone = 'white', patternId }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'white' | 'cream' | 'blue'; patternId: string }) {
  const { theme } = useAppTheme(); const backgroundColor = tone === 'cream' ? '#FFFCF4' : tone === 'blue' ? '#F5F8FF' : theme.surface;
  return <View style={[styles.dottedPanel, { backgroundColor, borderColor: theme.line }, style]}><Svg style={[StyleSheet.absoluteFill, styles.noPointerEvents]} width="100%" height="100%"><Defs><Pattern id={patternId} width="18" height="18" patternUnits="userSpaceOnUse"><Circle cx="2" cy="2" r="0.62" fill={tone === 'cream' ? '#B9AA85' : '#A8B3CC'} opacity="0.25" /></Pattern></Defs><Rect width="100%" height="100%" fill={`url(#${patternId})`} /></Svg><View style={styles.dottedContent}>{children}</View></View>;
}

function CheckInOrb() {
  const study = useDemoStudyClock();
  const { width } = useWindowDimensions();
  const wide = width >= 540;
  const useNativeAnimationDriver = Platform.OS !== 'web';
  const [scaleAnimation] = useState(() => new Animated.Value(1));
  const [glowAnimation] = useState(() => new Animated.Value(0));
  const [orbitAnimation] = useState(() => new Animated.Value(0));
  const liveLoop = useRef<Animated.CompositeAnimation | null>(null);

  // Match client/src/pages/DashboardPage.tsx → ORB exactly.
  const orbSize = wide ? 228 : 196;
  const ringSize = wide ? 212 : 180;
  const stroke = wide ? 12 : 10;
  const haloSize = wide ? 300 : 240;
  const sweepSize = wide ? 268 : 232;
  const radius = (ringSize - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const liveSeconds = study.todayBaseMinutes * 60 + study.sessionSeconds;
  const liveMinutes = Math.floor(liveSeconds / 60);
  const progress = Math.min(100, (liveMinutes / 120) * 100);
  const dashOffset = circumference * (1 - progress / 100);
  const orbitRotation = orbitAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    const orbitLoop = Animated.loop(
      Animated.timing(orbitAnimation, {
        toValue: 1,
        duration: 22000,
        useNativeDriver: useNativeAnimationDriver,
      }),
    );
    orbitLoop.start();
    return () => orbitLoop.stop();
  }, [orbitAnimation, useNativeAnimationDriver]);

  useEffect(() => {
    liveLoop.current?.stop();
    if (study.checkedIn) {
      Animated.parallel([
        Animated.sequence([
          Animated.spring(scaleAnimation, { toValue: 1.06, friction: 4, tension: 150, useNativeDriver: useNativeAnimationDriver }),
          Animated.spring(scaleAnimation, { toValue: 1, friction: 5, tension: 110, useNativeDriver: useNativeAnimationDriver }),
        ]),
        Animated.timing(glowAnimation, { toValue: 1, duration: 300, useNativeDriver: false }),
      ]).start();
      liveLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnimation, { toValue: 0.52, duration: 1050, useNativeDriver: false }),
          Animated.timing(glowAnimation, { toValue: 1, duration: 1050, useNativeDriver: false }),
        ]),
      );
      liveLoop.current.start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnimation, { toValue: 1, friction: 5, useNativeDriver: useNativeAnimationDriver }),
        Animated.timing(glowAnimation, { toValue: 0, duration: 220, useNativeDriver: false }),
      ]).start();
    }
    return () => liveLoop.current?.stop();
  }, [glowAnimation, scaleAnimation, study.checkedIn, useNativeAnimationDriver]);

  const activate = () => {
    Animated.sequence([
      Animated.timing(scaleAnimation, { toValue: 0.95, duration: 85, useNativeDriver: useNativeAnimationDriver }),
      Animated.spring(scaleAnimation, { toValue: 1, friction: 5, tension: 160, useNativeDriver: useNativeAnimationDriver }),
    ]).start();
    study.toggleSession();
  };

  return <Animated.View style={[styles.orbShadow, {
    width: orbSize,
    height: orbSize,
    marginLeft: -orbSize / 2,
    borderRadius: orbSize / 2,
    transform: [{ scale: scaleAnimation }],
    shadowOpacity: glowAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.56] }),
    shadowRadius: glowAnimation.interpolate({ inputRange: [0, 1], outputRange: [14, 24] }),
  }]}>
    <Animated.View style={[styles.webHalo, styles.noPointerEvents, {
      width: haloSize,
      height: haloSize,
      left: (orbSize - haloSize) / 2,
      top: (orbSize - haloSize) / 2,
      borderRadius: haloSize / 2,
      opacity: glowAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.48] }),
    }]} />
    <Animated.View style={[styles.webSweep, styles.noPointerEvents, {
      width: sweepSize,
      height: sweepSize,
      left: (orbSize - sweepSize) / 2,
      top: (orbSize - sweepSize) / 2,
      transform: [{ rotate: orbitRotation }],
    }]}>
      <Svg width={sweepSize} height={sweepSize}>
        <Circle
          cx={sweepSize / 2}
          cy={sweepSize / 2}
          r={(sweepSize - 12) / 2}
          fill="transparent"
          stroke="rgba(201,167,106,0.28)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={[sweepSize * 0.75, sweepSize * 2.4]}
        />
      </Svg>
    </Animated.View>
    <LinearGradient
      colors={['#303781', '#252B69', '#161F45']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.orbOuter, { width: orbSize, height: orbSize, borderRadius: orbSize / 2 }]}
    >
      <View style={[styles.orbGloss, styles.noPointerEvents]} />
      <View style={[styles.orbDashed, styles.noPointerEvents, { borderRadius: (orbSize - 24) / 2 }]} />
      <View style={[styles.ringCanvas, { width: ringSize, height: ringSize }]}>
        <Svg width={ringSize} height={ringSize} style={[styles.progressSvg, styles.progressRotation]}>
          <Circle cx={ringSize / 2} cy={ringSize / 2} r={radius} stroke="rgba(255,255,255,0.16)" strokeWidth={stroke} fill="transparent" />
          <Circle cx={ringSize / 2} cy={ringSize / 2} r={radius} stroke="#C9A76A" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={[circumference, circumference]} strokeDashoffset={dashOffset} fill="transparent" />
        </Svg>
        <View style={styles.orbContent}>
          <Text style={styles.orbLabel}>{study.checkedIn ? 'CHECK OUT' : 'CHECK IN'}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={study.checkedIn ? 'Check out and end your session' : 'Check in and start studying'}
            onPress={activate}
            style={({ pressed }) => [styles.playButton, study.checkedIn && styles.playButtonLive, pressed && styles.playButtonPressed]}
          >
            {study.checkedIn ? <>
              <Animated.View style={[styles.activePulse, styles.noPointerEvents, {
                opacity: glowAnimation.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.42] }),
                transform: [{ scale: glowAnimation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.24] }) }],
              }]} />
              <Square fill="#FFFFFF" color="#FFFFFF" size={22} strokeWidth={2.5} />
            </> : <Play fill="#FFFFFF" color="#FFFFFF" size={27} strokeWidth={2.4} style={styles.playIcon} />}
          </Pressable>
          {study.checkedIn
            ? <Text numberOfLines={1} style={styles.orbLiveTime}>{formatDuration(liveSeconds)}</Text>
            : <View style={styles.orbTimeRow}>
                <Text numberOfLines={1} style={styles.orbBaseTime}>{formatMinutes(study.todayBaseMinutes)}</Text>
                <Text numberOfLines={1} style={styles.orbTargetTime}> / 2h</Text>
              </View>}
        </View>
      </View>
    </LinearGradient>
  </Animated.View>;
}

function CalendarGrid() {
  const days = [['S', 'M', 'T', 'W', 'T', 'F', 'S'], [' ', ' ', '1', '2', '3', '4', '5'], ['6', '7', '8', '9', '10', '11', '12'], ['13', '14', '15', '16', '17', '18', '19'], ['20', '21', '22', '23', '24', '25', '26'], ['27', '28', '29', '30', ' ', ' ', ' ']];
  return <View style={styles.calendar}>{<Text style={styles.calendarTitle}>SEPTEMBER 2026</Text>}{days.map((week, row) => <View key={row} style={styles.calendarRow}>{week.map((day, column) => <View key={`${row}-${column}`} style={[styles.dayCell, day === '1' && styles.selectedDay]}><Text style={[styles.day, row === 0 && styles.weekday, day === '1' && styles.selectedDayText]}>{day}</Text></View>)}</View>)}</View>;
}

const studyHours = [0, 1, 2, 0, 3, 1, 0, 2, 4, 2, 1, 0, 3, 0, 2, 1, 4, 2, 0, 3, 1, 2, 0, 1, 4, 3, 2, 0, 1, 3, 2, 1, 4, 0, 2, 3, 1, 0, 2, 4, 1, 3, 0, 2, 4, 1, 2, 3, 0, 1, 4, 2, 3, 1, 0, 2, 3, 4, 1, 0, 2, 1, 3, 4, 2, 0, 1, 3, 2, 4, 1, 0, 2, 3, 4, 1, 2, 0, 3, 1, 4, 2, 0, 1];

function ConsistencyGraph() {
  const { theme } = useAppTheme();
  const totalHours = studyHours.reduce((sum, value) => sum + value, 0);
  const cellColor = (hours: number) => hours === 0 ? theme.sunken : hours === 1 ? '#DCE3FF' : hours === 2 ? '#AAB8F2' : hours === 3 ? '#7184D3' : '#4659B5';
  return <DottedPanel tone="blue" patternId="consistency" style={styles.consistencyPanel}>
    <View style={styles.consistencyHeader}><View><Text style={[styles.consistencyEyebrow, { color: theme.primary }]}>STUDY RHYTHM</Text><Text style={[styles.consistencyTitle, { color: theme.fg }]}>Consistency</Text><Text style={[styles.consistencyCopy, { color: theme.muted }]}>Last 12 weeks · {totalHours}h studied</Text></View><View style={[styles.hoursBadge, { backgroundColor: theme.primarySoft }]}><Clock3 size={16} color={theme.primary} /><Text style={[styles.hoursBadgeText, { color: theme.primary }]}>4h best</Text></View></View>
    <View style={styles.heatmapWrap}><View style={styles.weekLabels}><Text style={[styles.weekLabel, { color: theme.faint }]}>M</Text><Text style={[styles.weekLabel, { color: theme.faint }]}>W</Text><Text style={[styles.weekLabel, { color: theme.faint }]}>F</Text></View><View style={styles.heatmap}>{studyHours.map((hours, index) => <View key={index} style={[styles.heatCell, { backgroundColor: cellColor(hours) }]} />)}</View></View>
    <View style={styles.heatmapFooter}><Text style={[styles.heatmapDate, { color: theme.muted }]}>May</Text><Text style={[styles.heatmapDate, { color: theme.muted }]}>Jun</Text><Text style={[styles.heatmapDate, { color: theme.muted }]}>Jul</Text><View style={styles.intensity}><Text style={[styles.intensityText, { color: theme.muted }]}>Less</Text>{[0, 1, 2, 3].map((level) => <View key={level} style={[styles.intensityDot, { backgroundColor: level === 0 ? theme.sunken : ['#DCE3FF', '#AAB8F2', '#4659B5'][level - 1] }]} />)}<Text style={[styles.intensityText, { color: theme.muted }]}>More</Text></View></View>
  </DottedPanel>;
}

export default function HomeScreen() {
  const { theme } = useAppTheme(); const router = useRouter(); const { width } = useWindowDimensions(); const wide = width >= 540; const heroHeight = wide ? 336 : 252; const heroWrapHeight = wide ? 456 : 350;
  const study = useDemoStudyClock();
  const recentlyOpened = useLessonReaderStore((state) => state.recentlyOpened);
  const lessonEntries = allLessonEntries();
  const recentNotes = recentlyOpened.map((lessonId) => lessonEntries.find((entry) => entry.lesson.id === lessonId)).filter((entry): entry is (typeof lessonEntries)[number] => Boolean(entry)).slice(0, 3);
  const minutesRemaining = Math.max(0, 120 - study.todayMinutes);
  return <SafeAreaView edges={['left', 'right']} style={[styles.safe, { backgroundColor: theme.canvas }]}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={[styles.heroWrap, { height: heroWrapHeight }]}><LinearGradient colors={['#18255D', '#343D86', '#5A4D59']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { height: heroHeight, paddingTop: wide ? 27 : 26 }]}><View style={[styles.heroCircle, styles.heroCircleOne]} /><View style={[styles.heroCircle, styles.heroCircleTwo]} /><View style={[styles.heroArc, styles.heroArcOne]} /><View style={[styles.heroArc, styles.heroArcTwo]} /><Text style={styles.heroDate}>●  SATURDAY, 25 JULY</Text><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} style={[styles.heroTitle, { fontSize: wide ? 45 : 30, lineHeight: wide ? 54 : 36 }]}>Good morning, S</Text><Text style={styles.heroSubtitle}>{wide ? 'Your session is running — stay in the zone.' : 'Check in below and make today count.'}</Text></LinearGradient><CheckInOrb /></View>
    <DottedPanel tone="cream" patternId="exam" style={styles.examPanel}><View style={styles.examTop}><View style={styles.calendarIcon}><CalendarDays color="#9A712B" size={26} /></View><View style={styles.medium}><Text style={styles.mediumText}>Medium</Text></View></View><CalendarGrid /><Text style={styles.examName}>CA INTERMEDIATE SEPT 2026</Text><Text style={styles.examDays}>39</Text><Text style={[styles.daysLabel, { color: theme.muted }]}>days left · 1 Sept</Text><View style={styles.pressureRow}><Text style={[styles.pressureLabel, { color: theme.muted }]}>Exam pressure</Text><Text style={[styles.pressureScore, { color: theme.muted }]}>57/100</Text></View><View style={styles.pressureTrack}><View style={styles.pressureFill} /></View></DottedPanel>
    <DottedPanel patternId="today-plan" style={styles.todayPanel}><View style={styles.todayHeader}><View><Text style={[styles.todayEyebrow, { color: theme.primary }]}>TODAY’S PLAN</Text><Text style={[styles.todayTitle, { color: theme.fg }]}>{formatMinutes(study.todayMinutes)} <Text style={[styles.todayTarget, { color: theme.muted }]}>of 2h focus</Text></Text></View><View style={[styles.targetBadge, { backgroundColor: study.targetPercent >= 100 ? theme.successSoft : theme.goldSoft }]}><CheckCircle2 size={16} color={study.targetPercent >= 100 ? theme.success : theme.goldStrong} /><Text style={[styles.targetBadgeText, { color: study.targetPercent >= 100 ? theme.success : theme.goldStrong }]}>{study.targetPercent}%</Text></View></View><View style={[styles.todayTrack, { backgroundColor: theme.sunken }]}><View style={[styles.todayFill, { backgroundColor: study.targetPercent >= 100 ? theme.success : theme.primary, width: `${study.targetPercent}%` }]} /></View><View style={styles.todayFooter}><Text style={[styles.todayCopy, { color: theme.muted }]}>{minutesRemaining ? `${formatMinutes(minutesRemaining)} left to meet your target` : 'Daily target achieved — excellent work.'}</Text><Pressable onPress={() => router.push('/tracker')}><Text style={[styles.todayLink, { color: theme.primary }]}>View tracker →</Text></Pressable></View></DottedPanel>
    <DottedPanel tone="cream" patternId="review-queue" style={styles.reviewPanel}><View style={styles.reviewIcon}><RotateCcw color="#9A712B" size={21} /></View><View style={styles.reviewCopy}><Text style={styles.reviewEyebrow}>REVISION QUEUE</Text><Text style={[styles.reviewTitle, { color: theme.fg }]}>The Preamble is due for review</Text><Text numberOfLines={1} style={[styles.reviewDetail, { color: theme.muted }]}>A quick 18-page revision keeps recall fresh.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Revise The Preamble" onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: 'preamble' } })} style={styles.reviewButton}><Text style={styles.reviewButtonText}>Revise</Text><ArrowUpRight color="#FFFFFF" size={15} /></Pressable></DottedPanel>
    <ConsistencyGraph />
    <DottedPanel patternId="streak" style={styles.streakPanel}><Text style={[styles.streakLabel, { color: theme.muted }]}>STREAK</Text><View style={styles.streakRow}><Text style={styles.streakNumber}>0<Text style={[styles.streakDays, { color: theme.muted }]}> days</Text></Text><Flame fill="#B98A31" color="#B98A31" size={48} /></View><Text style={[styles.streakCopy, { color: theme.muted }]}>Check in to extend it.</Text></DottedPanel>
    <DottedPanel patternId="home-recents" style={styles.recentPanel}><View style={styles.recentHeading}><View><Text style={[styles.recentEyebrow, { color: theme.primary }]}>PICK UP WHERE YOU LEFT OFF</Text><Text style={[styles.recentSectionTitle, { color: theme.fg }]}>Recently opened</Text></View><Pressable onPress={() => router.push('/notes')}><Text style={[styles.viewAll, { color: theme.primary }]}>All notes →</Text></Pressable></View><View style={styles.recentNotes}>{recentNotes.map((entry) => <Pressable key={entry.lesson.id} accessibilityRole="button" accessibilityLabel={`Resume ${entry.lesson.title}`} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: entry.lesson.id } })} style={({ pressed }) => [styles.recentNote, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.recentNoteIcon, { backgroundColor: `${entry.subject.accent}20` }]}><BookOpen color={entry.subject.accent} size={18} /></View><View style={styles.recentNoteCopy}><Text numberOfLines={1} style={[styles.recentNoteTitle, { color: theme.fg }]}>{entry.lesson.title}</Text><Text numberOfLines={1} style={[styles.recentNoteDetail, { color: theme.muted }]}>{entry.subject.title} · {entry.lesson.pages} pages</Text></View><ArrowUpRight color={theme.faint} size={17} /></Pressable>)}</View></DottedPanel>
    <DottedPanel tone="blue" patternId="syllabus" style={styles.syllabusPanel}><Text style={styles.syllabusPercent}>0%</Text><Text style={styles.syllabusTitle}>[ syllabus complete ]</Text><View style={styles.syllabusTrack}><View style={styles.syllabusFill} /></View><Text style={styles.syllabusCopy}>0/3 lessons done</Text></DottedPanel>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { padding: 14, paddingTop: 16, gap: 18, paddingBottom: 84, width: '100%', maxWidth: 680, alignSelf: 'center' }, heroWrap: { height: 350, position: 'relative', marginBottom: 4 }, hero: { height: 252, borderRadius: 17, overflow: 'hidden', alignItems: 'center', paddingTop: 26 }, heroDate: { color: '#D9B777', fontFamily: font.bold, fontSize: 10, letterSpacing: 1.35, zIndex: 2 }, heroTitle: { color: '#FFFFFF', fontFamily: font.extraBold, fontSize: 30, lineHeight: 36, textAlign: 'center', letterSpacing: -0.9, marginTop: 12, zIndex: 2 }, heroSubtitle: { color: '#E0E2ED', fontFamily: font.regular, fontSize: 13, textAlign: 'center', marginTop: 10, zIndex: 2 }, heroCircle: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(210,215,255,0.18)', borderRadius: 999 }, heroCircleOne: { height: 220, width: 220, left: -137, top: -135 }, heroCircleTwo: { height: 224, width: 224, right: -122, bottom: -144 }, heroArc: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 999 }, heroArcOne: { height: 190, width: 280, left: -115, bottom: -122 }, heroArcTwo: { height: 150, width: 215, right: -83, top: 45 },
  orbShadow: { position: 'absolute', bottom: 0, left: '50%', shadowColor: '#D7A341', shadowOffset: { width: 0, height: 8 }, elevation: 11 },
  webHalo: { position: 'absolute', backgroundColor: 'rgba(201,167,106,0.24)', shadowColor: '#D7A341', shadowOpacity: 0.32, shadowRadius: 30, shadowOffset: { width: 0, height: 0 } },
  webSweep: { position: 'absolute' },
  orbOuter: { zIndex: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', shadowColor: '#060C28', shadowOpacity: 0.52, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 8 },
  orbGloss: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.035)' },
  orbDashed: { position: 'absolute', top: 12, right: 12, bottom: 12, left: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)' },
  ringCanvas: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  progressSvg: { position: 'absolute', top: 0, left: 0 },
  progressRotation: { transform: [{ rotate: '-90deg' }] },
  orbContent: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  orbLabel: { color: 'rgba(255,255,255,0.7)', fontFamily: font.bold, fontSize: 11, letterSpacing: 1.4, marginBottom: 6 },
  playButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#C9A14D', alignItems: 'center', justifyContent: 'center', shadowColor: '#080C29', shadowOpacity: 0.34, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 5 },
  playButtonLive: { backgroundColor: '#D84657' },
  playButtonPressed: { transform: [{ scale: 0.95 }] },
  playIcon: { transform: [{ translateX: 2 }] },
  activePulse: { position: 'absolute', top: -6, right: -6, bottom: -6, left: -6, borderRadius: 38, backgroundColor: '#D84657', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  orbLiveTime: { color: '#FFFFFF', fontFamily: font.extraBold, fontSize: 16, lineHeight: 20, marginTop: 6, textAlign: 'center', fontVariant: ['tabular-nums'] },
  orbTimeRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 6 },
  orbBaseTime: { color: '#FFFFFF', fontFamily: font.extraBold, fontSize: 14, lineHeight: 18, fontVariant: ['tabular-nums'] },
  orbTargetTime: { color: 'rgba(255,255,255,0.7)', fontFamily: font.medium, fontSize: 11, lineHeight: 15, fontVariant: ['tabular-nums'] },
  noPointerEvents: { pointerEvents: 'none' },
  actions: { flexDirection: 'row', gap: 12, alignItems: 'stretch' }, actionPressable: { flex: 1, minWidth: 0 }, actionPanel: { height: 218 }, pressed: { opacity: 0.87 }, dottedPanel: { borderWidth: 1, borderRadius: 17, overflow: 'hidden', shadowColor: '#172149', shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 2 }, dottedContent: { flex: 1, padding: 12, gap: 5 }, actionIcon: { height: 42, width: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }, actionTitle: { fontFamily: font.extraBold, fontSize: 16, lineHeight: 20, letterSpacing: -0.3, flexShrink: 0 }, actionCopy: { fontFamily: font.regular, fontSize: 11, lineHeight: 15, minHeight: 30 }, actionLink: { fontFamily: font.bold, fontSize: 11, marginTop: 'auto' },
  examPanel: { minHeight: 365 }, examTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, calendarIcon: { height: 45, width: 45, borderRadius: 13, backgroundColor: '#F8F0DE', alignItems: 'center', justifyContent: 'center' }, medium: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 13, backgroundColor: '#FFFAED' }, mediumText: { color: '#8C672B', fontFamily: font.semibold, fontSize: 13 }, calendar: { marginTop: 11, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DDC4', borderRadius: 15, padding: 12, shadowColor: '#9C7A40', shadowOpacity: 0.08, shadowRadius: 7, shadowOffset: { width: 0, height: 3 } }, calendarTitle: { textAlign: 'center', color: '#8E6A33', fontFamily: font.bold, fontSize: 10, letterSpacing: 1.2, marginBottom: 7 }, calendarRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }, dayCell: { width: 22, height: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 10 }, day: { color: '#4B5061', fontFamily: font.medium, fontSize: 10 }, weekday: { color: '#8D92A0', fontFamily: font.bold, fontSize: 9 }, selectedDay: { backgroundColor: '#B48331', shadowColor: '#8A651F', shadowOpacity: 0.22, shadowRadius: 4, elevation: 2 }, selectedDayText: { color: '#FFFFFF', fontFamily: font.bold }, examName: { color: '#947039', fontFamily: font.bold, fontSize: 10, letterSpacing: 1.05, marginTop: 12 }, examDays: { color: '#9A6C20', fontFamily: font.extraBold, fontSize: 39, letterSpacing: -1.2, lineHeight: 42, marginTop: 1 }, daysLabel: { fontFamily: font.regular, fontSize: 13 }, pressureRow: { marginTop: 13, flexDirection: 'row', justifyContent: 'space-between' }, pressureLabel: { fontFamily: font.regular, fontSize: 12 }, pressureScore: { fontFamily: font.semibold, fontSize: 12 }, pressureTrack: { height: 7, borderRadius: 8, backgroundColor: '#ECECF1', overflow: 'hidden', marginTop: 7 }, pressureFill: { height: '100%', borderRadius: 8, backgroundColor: '#C1841A', width: '57%' },
  consistencyPanel: { minHeight: 204 }, consistencyHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }, consistencyEyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.25 }, consistencyTitle: { fontFamily: font.extraBold, fontSize: 20, letterSpacing: -0.45, marginTop: 2 }, consistencyCopy: { fontFamily: font.regular, fontSize: 11, marginTop: 3 }, hoursBadge: { minHeight: 32, borderRadius: 11, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, hoursBadgeText: { fontFamily: font.bold, fontSize: 10 }, heatmapWrap: { flexDirection: 'row', marginTop: 15, gap: 6 }, weekLabels: { width: 9, justifyContent: 'space-around', paddingVertical: 1 }, weekLabel: { fontFamily: font.bold, fontSize: 8 }, heatmap: { flex: 1, height: 64, flexDirection: 'column', flexWrap: 'wrap', gap: 3 }, heatCell: { width: 9, height: 9, borderRadius: 3 }, heatmapFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 }, heatmapDate: { flex: 1, fontFamily: font.medium, fontSize: 9 }, intensity: { flexDirection: 'row', alignItems: 'center', gap: 3 }, intensityText: { fontFamily: font.medium, fontSize: 8 }, intensityDot: { width: 8, height: 8, borderRadius: 2 }, streakPanel: { minHeight: 112 }, streakLabel: { fontFamily: font.regular, fontSize: 13 }, streakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, streakNumber: { color: '#9B6E23', fontFamily: font.extraBold, fontSize: 33, letterSpacing: -1 }, streakDays: { fontFamily: font.regular, fontSize: 17, letterSpacing: 0 }, streakCopy: { fontFamily: font.regular, fontSize: 13 }, recentPanel: { minHeight: 224 }, recentHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 9 }, recentEyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.1 }, recentSectionTitle: { fontFamily: font.extraBold, fontSize: 20, letterSpacing: -0.4, marginTop: 3 }, viewAll: { fontFamily: font.bold, fontSize: 10, marginTop: 7 }, recentNotes: { gap: 8, marginTop: 10 }, recentNote: { minHeight: 51, borderWidth: 1, borderRadius: 13, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 9 }, recentNoteIcon: { height: 32, width: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, recentNoteCopy: { flex: 1, minWidth: 0 }, recentNoteTitle: { fontFamily: font.bold, fontSize: 12 }, recentNoteDetail: { fontFamily: font.regular, fontSize: 10, marginTop: 2 }, notesPanel: { minHeight: 184, backgroundColor: '#202B56', borderColor: '#344171' }, notesTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 }, notesBadge: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#2C396D', alignItems: 'center', justifyContent: 'center', gap: 1 }, notesEyebrow: { color: '#B7C0E4', fontFamily: font.bold, fontSize: 10, letterSpacing: 1.3 }, notesTitle: { color: '#FFFFFF', fontFamily: font.extraBold, fontSize: 20, letterSpacing: -0.45, lineHeight: 25, marginTop: 4, maxWidth: 220 }, notesCopy: { color: '#BFC7E6', fontFamily: font.regular, fontSize: 12, lineHeight: 17 }, browseButton: { height: 48, backgroundColor: '#5366C4', borderRadius: 13, marginTop: 'auto', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: '#253678', shadowOpacity: 0.2, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 3 }, browseLabel: { color: '#FFFFFF', fontFamily: font.bold, fontSize: 15 }, syllabusPanel: { minHeight: 135 }, syllabusPercent: { color: '#111522', fontFamily: font.extraBold, fontSize: 38, letterSpacing: -1.4 }, syllabusTitle: { color: '#60697C', fontFamily: font.medium, fontSize: 15, marginTop: 2 }, syllabusTrack: { height: 8, borderRadius: 7, marginTop: 10, backgroundColor: '#E1E5EE', overflow: 'hidden' }, syllabusFill: { height: '100%', width: '0%', backgroundColor: '#5264BF' }, syllabusCopy: { color: '#667085', fontFamily: font.regular, fontSize: 12, marginTop: 2 },
  todayPanel: { minHeight: 128 }, todayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }, todayEyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.25 }, todayTitle: { fontFamily: font.extraBold, fontSize: 23, letterSpacing: -0.65, marginTop: 4 }, todayTarget: { fontFamily: font.medium, fontSize: 13, letterSpacing: 0 }, targetBadge: { minHeight: 31, borderRadius: 11, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, targetBadgeText: { fontFamily: font.bold, fontSize: 11 }, todayTrack: { height: 8, borderRadius: 5, overflow: 'hidden', marginTop: 13 }, todayFill: { height: '100%', borderRadius: 5 }, todayFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 8 }, todayCopy: { flex: 1, fontFamily: font.regular, fontSize: 10 }, todayLink: { fontFamily: font.bold, fontSize: 10 }, reviewPanel: { minHeight: 105, flexDirection: 'row', alignItems: 'center', gap: 10 }, reviewIcon: { height: 42, width: 42, borderRadius: 13, backgroundColor: '#F8F0DE', alignItems: 'center', justifyContent: 'center' }, reviewCopy: { flex: 1, minWidth: 0 }, reviewEyebrow: { color: '#947039', fontFamily: font.bold, fontSize: 9, letterSpacing: 1.1 }, reviewTitle: { fontFamily: font.bold, fontSize: 13, marginTop: 3 }, reviewDetail: { fontFamily: font.regular, fontSize: 10, marginTop: 3 }, reviewButton: { height: 34, borderRadius: 10, paddingHorizontal: 10, backgroundColor: '#9A712B', flexDirection: 'row', alignItems: 'center', gap: 5 }, reviewButtonText: { color: '#FFFFFF', fontFamily: font.bold, fontSize: 10 },
});
