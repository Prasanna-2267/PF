import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpenCheck, CalendarClock, Check, Clock3, RotateCcw, Sparkles } from 'lucide-react-native';

import { initialReaderStatus } from '@/components/note-management';
import { font, layout, radius, themes } from '@/constants/theme';
import { allLessonEntries } from '@/lib/demo-catalog';
import { useLessonReaderStore } from '@/lib/lesson-reader-store';
import { useAppTheme } from '@/providers/app-providers';

const nativeDriver = Platform.OS !== 'web';
type RevisionFilter = 'all' | 'due' | 'not-started';
type ChapterStat = { id: string; subjectId: string; subject: string; accent: string; chapter: string; lessonIds: string[]; revisions: number; completed: number; percent: number };

export function RevisionChapterTracker() {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const wide = width >= layout.tabletBreakpoint;
  const dark = theme.canvas === themes.dark.canvas;
  const stored = useLessonReaderStore((state) => state.byLessonId);
  const [filter, setFilter] = useState<RevisionFilter>('all');
  const definitions = useMemo(() => {
    const grouped = new Map<string, Omit<ChapterStat, 'revisions' | 'completed' | 'percent'>>();
    allLessonEntries().forEach(({ subject, unit, topic, lesson }) => {
      const id = `${subject.id}-${unit.id}-${topic?.id ?? 'unit'}`;
      const current = grouped.get(id) ?? { id, subjectId: subject.id, subject: subject.title, accent: subject.accent, chapter: topic?.title ?? unit.title, lessonIds: [] };
      current.lessonIds.push(lesson.id);
      grouped.set(id, current);
    });
    return [...grouped.values()];
  }, []);
  const lessonEntries = useMemo(() => new Map(allLessonEntries().map((entry) => [entry.lesson.id, entry.lesson])), []);
  const chapters: ChapterStat[] = definitions.map((chapter) => {
    const statuses = chapter.lessonIds.map((id) => stored[id] ?? initialReaderStatus(lessonEntries.get(id)!));
    const revisions = statuses.reduce((sum, status) => sum + status.revisions, 0);
    const completed = statuses.filter((status) => status.read).length;
    return { ...chapter, revisions, completed, percent: Math.min(100, Math.round((revisions / Math.max(chapter.lessonIds.length * 3, 1)) * 100)) };
  });
  const totalRevisions = chapters.reduce((sum, chapter) => sum + chapter.revisions, 0);
  const revisedChapters = chapters.filter((chapter) => chapter.revisions > 0).length;
  const dueChapters = chapters.filter((chapter) => chapter.revisions > 0 && chapter.percent < 66).length;
  const coverage = Math.round((revisedChapters / Math.max(chapters.length, 1)) * 100);
  const filtered = chapters.filter((chapter) => {
    if (filter === 'all') return true;
    if (filter === 'due') return chapter.revisions > 0 && chapter.percent < 66;
    return chapter.revisions === 0;
  });
  const subjectGroups = [...new Set(filtered.map((chapter) => chapter.subjectId))].map((subjectId) => ({ subjectId, chapters: filtered.filter((chapter) => chapter.subjectId === subjectId) }));

  return <View style={styles.wrapper}>
    <LinearGradient colors={dark ? ['#1A2746', '#111A2C', '#101317'] : ['#E9EEFF', '#F5F7FF', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { borderColor: theme.line }]}>
      <View pointerEvents="none" style={[styles.heroGlow, { backgroundColor: theme.primaryStrong }]} />
      <View style={styles.heroTop}><View style={styles.heroCopy}><View style={styles.eyebrowRow}><Sparkles size={12} color={theme.goldStrong} /><Text style={[styles.eyebrow, { color: theme.goldStrong }]}>REVISION RHYTHM</Text></View><Text style={[styles.title, { color: theme.fg }]}>Know what to revisit next.</Text><Text style={[styles.subtitle, { color: theme.muted }]}>A chapter-level view of returns, depth and upcoming attention.</Text></View><RevisionOrbit value={totalRevisions} /></View>
      <View style={[styles.heroMetrics, { borderTopColor: theme.line }]}><HeroMetric value={`${revisedChapters}/${chapters.length}`} label="Touched" /><View style={[styles.metricDivider, { backgroundColor: theme.line }]} /><HeroMetric value={String(dueChapters)} label="Due next" accent={theme.goldStrong} /><View style={[styles.metricDivider, { backgroundColor: theme.line }]} /><HeroMetric value={`${coverage}%`} label="Coverage" accent={theme.success} /></View>
    </LinearGradient>

    <View style={[styles.queueToolbar, wide && styles.queueToolbarWide]}>
      <View style={[styles.sectionHeading, wide && styles.sectionHeadingWide]}><View><Text style={[styles.sectionEyebrow, { color: theme.primary }]}>CHAPTER QUEUE</Text><Text style={[styles.sectionTitle, { color: theme.fg }]}>{filter === 'all' ? 'Your revision map' : filter === 'due' ? 'Ready for another pass' : 'Build the first return'}</Text></View><View style={[styles.countPill, { backgroundColor: theme.sunken }]}><Text style={[styles.countText, { color: theme.muted }]}>{filtered.length} chapters</Text></View></View>
      <View style={[styles.filterRow, wide && styles.filterRowWide]}>{([['all', 'All chapters'], ['due', 'Due next'], ['not-started', 'Not started']] as const).map(([value, label]) => { const active = filter === value; return <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setFilter(value)} style={({ pressed }) => [styles.filter, { backgroundColor: active ? theme.primary : theme.surface, borderColor: active ? theme.primary : theme.line }, pressed && styles.pressed]}>{value === 'due' ? <Clock3 size={13} color={active ? theme.primaryFg : theme.goldStrong} /> : value === 'not-started' ? <BookOpenCheck size={13} color={active ? theme.primaryFg : theme.muted} /> : <RotateCcw size={13} color={active ? theme.primaryFg : theme.primaryStrong} />}<Text style={[styles.filterText, { color: active ? theme.primaryFg : theme.muted }]}>{label}</Text></Pressable>; })}</View>
    </View>

    {subjectGroups.length ? <View style={[styles.groups, wide && styles.groupsWide]}>{subjectGroups.map((group, index) => <SubjectRevisionGroup key={group.subjectId} chapters={group.chapters} index={index} wide={wide} />)}</View> : <View style={[styles.empty, { backgroundColor: theme.sunken, borderColor: theme.line }]}><Check size={22} color={theme.success} /><Text style={[styles.emptyTitle, { color: theme.fg }]}>Nothing waiting here</Text><Text style={[styles.emptyText, { color: theme.muted }]}>Your revision queue is clear for this filter.</Text></View>}
  </View>;
}

function RevisionOrbit({ value }: { value: number }) {
  const { theme } = useAppTheme();
  const [motion] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(motion, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: nativeDriver }));
    loop.start();
    return () => loop.stop();
  }, [motion]);
  const rotate = motion.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return <View style={styles.orbit}><Animated.View style={[styles.orbitRail, { borderColor: theme.primaryStrong, transform: [{ rotate }] }]}><View style={[styles.orbitDot, { backgroundColor: theme.goldStrong }]} /></Animated.View><View style={[styles.orbitCore, { backgroundColor: theme.primarySoft, borderColor: theme.lineStrong }]}><RotateCcw size={15} color={theme.primaryStrong} /><Text style={[styles.orbitValue, { color: theme.fg }]}>{value}</Text><Text style={[styles.orbitLabel, { color: theme.muted }]}>RETURNS</Text></View></View>;
}

function HeroMetric({ value, label, accent }: { value: string; label: string; accent?: string }) {
  const { theme } = useAppTheme();
  return <View style={styles.heroMetric}><Text style={[styles.heroMetricValue, { color: accent ?? theme.fg }]}>{value}</Text><Text style={[styles.heroMetricLabel, { color: theme.muted }]}>{label}</Text></View>;
}

function SubjectRevisionGroup({ chapters, index, wide }: { chapters: ChapterStat[]; index: number; wide: boolean }) {
  const { theme } = useAppTheme();
  const [entrance] = useState(() => new Animated.Value(0));
  useEffect(() => { Animated.timing(entrance, { toValue: 1, duration: 460, delay: index * 90, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }).start(); }, [entrance, index]);
  const translateY = entrance.interpolate({ inputRange: [0, 1], outputRange: [17, 0] });
  const active = chapters.filter((chapter) => chapter.revisions > 0).length;
  return <Animated.View style={[styles.group, wide && styles.groupWide, { backgroundColor: theme.surface, borderColor: theme.line, opacity: entrance, transform: [{ translateY }] }]}>
    <View style={[styles.groupHeader, { backgroundColor: `${chapters[0].accent}12`, borderBottomColor: theme.line }]}><View style={[styles.subjectMark, { backgroundColor: chapters[0].accent }]} /><View style={styles.groupCopy}><Text style={[styles.groupLabel, { color: chapters[0].accent }]}>SUBJECT</Text><Text style={[styles.groupTitle, { color: theme.fg }]}>{chapters[0].subject}</Text></View><Text style={[styles.groupCount, { color: theme.muted }]}>{active}/{chapters.length} active</Text></View>
    {chapters.map((chapter, chapterIndex) => <ChapterLane key={chapter.id} chapter={chapter} last={chapterIndex === chapters.length - 1} />)}
  </Animated.View>;
}

function ChapterLane({ chapter, last }: { chapter: ChapterStat; last: boolean }) {
  const { theme } = useAppTheme();
  const due = chapter.revisions > 0 && chapter.percent < 66;
  const inRhythm = chapter.percent >= 66;
  const status = inRhythm ? 'In rhythm' : due ? 'Due next' : 'Not started';
  const statusColor = inRhythm ? theme.success : due ? theme.goldStrong : theme.faint;
  const filledStages = chapter.revisions === 0 ? 0 : chapter.percent < 34 ? 1 : chapter.percent < 67 ? 2 : 3;
  return <View style={[styles.lane, !last && { borderBottomColor: theme.line, borderBottomWidth: 1 }]}>
    <View style={styles.laneTop}><View style={styles.laneCopy}><Text numberOfLines={1} style={[styles.chapterTitle, { color: theme.fg }]}>{chapter.chapter}</Text><View style={styles.chapterMeta}><Text style={[styles.metaText, { color: theme.muted }]}>{chapter.revisions} returns</Text><View style={[styles.metaDot, { backgroundColor: theme.lineStrong }]} /><Text style={[styles.metaText, { color: theme.muted }]}>{chapter.completed}/{chapter.lessonIds.length} notes complete</Text></View></View><View style={[styles.statusPill, { backgroundColor: inRhythm ? theme.successSoft : due ? theme.goldSoft : theme.sunken }]}>{due ? <CalendarClock size={11} color={statusColor} /> : inRhythm ? <Check size={11} color={statusColor} /> : <Clock3 size={11} color={statusColor} />}<Text style={[styles.statusText, { color: statusColor }]}>{status}</Text></View></View>
    <View style={styles.depthRow}><Text style={[styles.depthLabel, { color: theme.faint }]}>REVISION DEPTH</Text><View style={styles.stageRail}><StagePoint stage={1} filled={filledStages >= 1} color={statusColor} inRhythm={inRhythm} /><View style={[styles.stageLine, { backgroundColor: filledStages >= 2 ? statusColor : theme.line }]} /><StagePoint stage={2} filled={filledStages >= 2} color={statusColor} inRhythm={inRhythm} /><View style={[styles.stageLine, { backgroundColor: filledStages >= 3 ? statusColor : theme.line }]} /><StagePoint stage={3} filled={filledStages >= 3} color={statusColor} inRhythm={inRhythm} /></View><Text style={[styles.depthValue, { color: statusColor }]}>{chapter.percent}%</Text></View>
  </View>;
}

function StagePoint({ stage, filled, color, inRhythm }: { stage: number; filled: boolean; color: string; inRhythm: boolean }) {
  const { theme } = useAppTheme();
  return <View style={[styles.stage, { backgroundColor: filled ? color : theme.sunken, borderColor: filled ? color : theme.lineStrong }]}>{filled ? <Check size={9} color={inRhythm ? '#082219' : '#251704'} strokeWidth={3} /> : <Text style={[styles.stageNumber, { color: theme.faint }]}>{stage}</Text>}</View>;
}

const styles = StyleSheet.create({
  wrapper: { gap: 13 }, hero: { minHeight: 214, borderWidth: 1, borderRadius: 23, padding: 16, overflow: 'hidden' }, heroGlow: { position: 'absolute', width: 205, height: 205, borderRadius: 103, right: -103, top: -112, opacity: .08 }, heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 }, heroCopy: { flex: 1, minWidth: 0 }, eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, eyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.15 }, title: { maxWidth: 250, marginTop: 7, fontFamily: font.extraBold, fontSize: 22, lineHeight: 28, letterSpacing: -.65 }, subtitle: { maxWidth: 245, marginTop: 5, fontFamily: font.regular, fontSize: 9, lineHeight: 14 }, orbit: { width: 78, height: 78, alignItems: 'center', justifyContent: 'center' }, orbitRail: { position: 'absolute', width: 75, height: 75, borderRadius: 38, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center' }, orbitDot: { width: 7, height: 7, marginTop: -4, borderRadius: 4 }, orbitCore: { width: 61, height: 61, borderRadius: 21, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, orbitValue: { marginTop: 1, fontFamily: font.extraBold, fontSize: 17, lineHeight: 19 }, orbitLabel: { fontFamily: font.bold, fontSize: 5, letterSpacing: .75 }, heroMetrics: { minHeight: 58, marginTop: 18, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center' }, heroMetric: { flex: 1, alignItems: 'center' }, heroMetricValue: { fontFamily: font.extraBold, fontSize: 15 }, heroMetricLabel: { marginTop: 2, fontFamily: font.medium, fontSize: 7 }, metricDivider: { width: 1, height: 27 },
  queueToolbar: { gap: 10 }, queueToolbarWide: { flexDirection: 'row', alignItems: 'center' }, filterRow: { flexDirection: 'row', gap: 7 }, filterRowWide: { width: 390 }, filter: { flex: 1, minWidth: 0, minHeight: 40, borderWidth: 1, borderRadius: 12, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, filterText: { fontFamily: font.bold, fontSize: 8 }, sectionHeading: { minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, sectionHeadingWide: { flex: 1, minWidth: 0 }, sectionEyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1.05 }, sectionTitle: { marginTop: 2, fontFamily: font.extraBold, fontSize: 16 }, countPill: { minHeight: 27, borderRadius: radius.pill, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' }, countText: { fontFamily: font.bold, fontSize: 7 }, groups: { gap: 10 }, groupsWide: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' },
  group: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' }, groupWide: { width: '49%' }, groupHeader: { minHeight: 57, borderBottomWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }, subjectMark: { width: 4, height: 30, borderRadius: 2 }, groupCopy: { flex: 1, minWidth: 0 }, groupLabel: { fontFamily: font.bold, fontSize: 6, letterSpacing: .9 }, groupTitle: { marginTop: 2, fontFamily: font.extraBold, fontSize: 13 }, groupCount: { fontFamily: font.bold, fontSize: 8 }, lane: { minHeight: 112, padding: 12 }, laneTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, laneCopy: { flex: 1, minWidth: 0 }, chapterTitle: { fontFamily: font.bold, fontSize: 11 }, chapterMeta: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 5 }, metaText: { fontFamily: font.medium, fontSize: 7 }, metaDot: { width: 3, height: 3, borderRadius: 2 }, statusPill: { minHeight: 27, borderRadius: radius.pill, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }, statusText: { fontFamily: font.bold, fontSize: 7 }, depthRow: { marginTop: 15, flexDirection: 'row', alignItems: 'center', gap: 8 }, depthLabel: { width: 62, fontFamily: font.bold, fontSize: 5.5, letterSpacing: .65 }, stageRail: { flex: 1, flexDirection: 'row', alignItems: 'center' }, stageLine: { flex: 1, height: 2 }, stage: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, stageNumber: { fontFamily: font.bold, fontSize: 7 }, depthValue: { width: 32, fontFamily: font.extraBold, fontSize: 9, textAlign: 'right' }, empty: { minHeight: 130, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 16 }, emptyTitle: { marginTop: 8, fontFamily: font.bold, fontSize: 12 }, emptyText: { marginTop: 3, fontFamily: font.regular, fontSize: 8 }, pressed: { opacity: .76, transform: [{ scale: .98 }] },
});
