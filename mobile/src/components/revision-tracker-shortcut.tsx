import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowUpRight, BookOpenCheck, RotateCcw, Sparkles } from 'lucide-react-native';

import { font, themes } from '@/constants/theme';
import { allLessonEntries } from '@/lib/demo-catalog';
import { useLessonReaderStore } from '@/lib/lesson-reader-store';
import { useAppTheme } from '@/providers/app-providers';

const nativeDriver = Platform.OS !== 'web';

export function RevisionTrackerShortcut() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const dark = theme.canvas === themes.dark.canvas;
  const stored = useLessonReaderStore((state) => state.byLessonId);
  const [motion] = useState(() => new Animated.Value(0));
  const entries = allLessonEntries();
  const tracked = entries.filter((entry) => (stored[entry.lesson.id]?.revisions ?? entry.lesson.revisions ?? 0) > 0).length;
  const returns = entries.reduce((sum, entry) => sum + (stored[entry.lesson.id]?.revisions ?? entry.lesson.revisions ?? 0), 0);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(motion, { toValue: 1, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }), Animated.timing(motion, { toValue: 0, duration: 1300, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver })]));
    loop.start();
    return () => loop.stop();
  }, [motion]);
  const rotate = motion.interpolate({ inputRange: [0, 1], outputRange: ['-12deg', '14deg'] });
  const glowScale = motion.interpolate({ inputRange: [0, 1], outputRange: [.92, 1.12] });
  const glowOpacity = motion.interpolate({ inputRange: [0, 1], outputRange: [.2, .05] });

  return <Pressable accessibilityRole="button" accessibilityLabel="Open chapter revision tracker" onPress={() => router.push('/revision-tracker' as never)} style={({ pressed }) => [styles.shell, { borderColor: theme.line }, pressed && styles.pressed]}>
    <LinearGradient colors={dark ? ['#182642', '#121B2C', '#111419'] : ['#EAF0FF', '#F5F7FF', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View pointerEvents="none" style={[styles.decorLine, { borderColor: theme.primaryStrong }]} />
      <View style={styles.iconWrap}><Animated.View style={[styles.iconGlow, { borderColor: theme.primaryStrong, opacity: glowOpacity, transform: [{ scale: glowScale }] }]} /><View style={[styles.iconCore, { backgroundColor: theme.primarySoft, borderColor: theme.lineStrong }]}><Animated.View style={{ transform: [{ rotate }] }}><RotateCcw size={22} color={theme.primaryStrong} /></Animated.View><Sparkles style={styles.sparkle} size={10} color={theme.goldStrong} /></View></View>
      <View style={styles.copy}><Text style={[styles.eyebrow, { color: theme.goldStrong }]}>REVISION RHYTHM</Text><Text style={[styles.title, { color: theme.fg }]}>Open chapter revision tracker</Text><Text style={[styles.description, { color: theme.muted }]}>See due chapters, revision depth and subject-wise returns.</Text><View style={styles.metrics}><View style={styles.metric}><BookOpenCheck size={12} color={theme.success} /><Text style={[styles.metricText, { color: theme.muted }]}>{tracked} notes revisited</Text></View><View style={[styles.metricDot, { backgroundColor: theme.lineStrong }]} /><Text style={[styles.metricStrong, { color: theme.primaryStrong }]}>{returns} returns</Text></View></View>
      <View style={[styles.action, { backgroundColor: theme.primary }]}><ArrowUpRight size={18} color={theme.primaryFg} /></View>
    </LinearGradient>
  </Pressable>;
}

const styles = StyleSheet.create({
  shell: { borderWidth: 1, borderRadius: 21, overflow: 'hidden' }, card: { minHeight: 142, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden' }, decorLine: { position: 'absolute', width: 150, height: 150, borderWidth: 1, borderRadius: 75, right: -90, top: -95, opacity: .18 }, iconWrap: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }, iconGlow: { position: 'absolute', width: 54, height: 54, borderRadius: 27, borderWidth: 7 }, iconCore: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, sparkle: { position: 'absolute', top: 5, right: 5 }, copy: { flex: 1, minWidth: 0 }, eyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1.05 }, title: { marginTop: 4, fontFamily: font.extraBold, fontSize: 15, lineHeight: 20, letterSpacing: -.3 }, description: { marginTop: 3, fontFamily: font.regular, fontSize: 8, lineHeight: 13 }, metrics: { marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 6 }, metric: { flexDirection: 'row', alignItems: 'center', gap: 4 }, metricText: { fontFamily: font.medium, fontSize: 7 }, metricDot: { width: 3, height: 3, borderRadius: 2 }, metricStrong: { fontFamily: font.bold, fontSize: 7 }, action: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: .8, transform: [{ scale: .99 }] },
});
