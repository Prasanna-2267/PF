import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Square } from 'lucide-react-native';
import { font, radius, spacing } from '@/constants/theme';
import { formatDuration } from '@/lib/demo-study';
import { useAppTheme } from '@/providers/app-providers';

const nativeDriver = Platform.OS !== 'web';

export function ProgressBar({ value, color }: { value: number; color?: string }) { const { theme } = useAppTheme(); return <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: value }} style={[styles.progressTrack, { backgroundColor: theme.sunken }]}><View style={[styles.progressFill, { width: `${Math.max(0, Math.min(value, 100))}%`, backgroundColor: color ?? theme.primary }]} /></View>; }
export function MetricTile({ label, value, detail, tone = 'primary' }: { label: string; value: string | number; detail: string; tone?: 'primary' | 'gold' | 'success' }) { const { theme } = useAppTheme(); const color = tone === 'gold' ? theme.gold : tone === 'success' ? theme.success : theme.primary; return <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}><Text style={[styles.metricLabel, { color }]}>{label}</Text><Text style={[styles.metricValue, { color: theme.fg }]}>{value}</Text><Text style={[styles.metricDetail, { color: theme.muted }]}>{detail}</Text></View>; }
export function SessionButton({ active, seconds, onPress, size = 'compact' }: { active: boolean; seconds: number; onPress: () => void; size?: 'compact' | 'large' }) { const { theme } = useAppTheme(); const large = size === 'large'; return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.sessionButton, large ? styles.sessionLarge : styles.sessionCompact, { borderColor: active ? theme.gold : theme.primary, backgroundColor: active ? theme.goldSoft : theme.primarySoft }, pressed && { opacity: 0.84 }]}><Text style={[styles.sessionTop, { color: active ? theme.goldStrong : theme.primary }]}>{active ? 'SESSION LIVE' : 'CHECK IN'}</Text><Text style={[styles.sessionTime, { color: theme.fg }]}>{active ? formatDuration(seconds) : 'START'}</Text><Text style={[styles.sessionBottom, { color: theme.muted }]}>{active ? 'Tap to check out' : 'Focus with intent'}</Text></Pressable>; }

export function GrandSessionControl({ active, seconds, onPress }: { active: boolean; seconds: number; onPress: () => void }) {
  const { theme } = useAppTheme();
  const [pulse] = useState(() => new Animated.Value(0));
  const [orbit] = useState(() => new Animated.Value(0));
  const [pressScale] = useState(() => new Animated.Value(1));
  const [burst] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: active ? 900 : 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      Animated.timing(pulse, { toValue: 0, duration: active ? 900 : 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [active, pulse]);

  useEffect(() => {
    orbit.setValue(0);
    if (!active) return;
    const loop = Animated.loop(Animated.timing(orbit, { toValue: 1, duration: 5200, easing: Easing.linear, useNativeDriver: nativeDriver }));
    loop.start();
    return () => loop.stop();
  }, [active, orbit]);

  const handlePress = () => {
    pressScale.setValue(1);
    burst.setValue(0);
    Animated.parallel([
      Animated.sequence([Animated.timing(pressScale, { toValue: .94, duration: 110, useNativeDriver: nativeDriver }), Animated.spring(pressScale, { toValue: 1, speed: 19, bounciness: 8, useNativeDriver: nativeDriver })]),
      Animated.timing(burst, { toValue: 1, duration: 720, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }),
    ]).start();
    onPress();
  };

  const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [.3, .08] });
  const burstScale = burst.interpolate({ inputRange: [0, 1], outputRange: [.84, 1.38] });
  const burstOpacity = burst.interpolate({ inputRange: [0, .2, 1], outputRange: [0, .5, 0] });
  const orbitRotation = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const accent = active ? theme.goldStrong : theme.primary;

  return <View style={styles.grandSessionStage}>
    <Animated.View pointerEvents="none" style={[styles.grandSessionHalo, { borderColor: accent, opacity: haloOpacity, transform: [{ scale: haloScale }] }]} />
    <Animated.View pointerEvents="none" style={[styles.grandSessionBurst, { borderColor: accent, opacity: burstOpacity, transform: [{ scale: burstScale }] }]} />
    <Animated.View pointerEvents="none" style={[styles.grandSessionOrbit, { borderColor: active ? 'rgba(240,200,120,.42)' : 'rgba(185,199,255,.32)', transform: [{ rotate: orbitRotation }] }]}><View style={[styles.grandOrbitDot, { backgroundColor: accent, shadowColor: accent }]} /></Animated.View>
    <Animated.View style={{ transform: [{ scale: pressScale }] }}><Pressable accessibilityRole="button" accessibilityLabel={active ? 'Check out of focus session' : 'Check in to focus session'} onPress={handlePress}>
      <LinearGradient colors={active ? ['#5B411C', '#241A0D', '#111316'] : ['#25376A', '#17213D', '#10141C']} start={{ x: .15, y: 0 }} end={{ x: .85, y: 1 }} style={[styles.grandSessionCore, { borderColor: accent }]}>
        <Text style={[styles.grandSessionEyebrow, { color: accent }]}>{active ? 'SESSION LIVE' : 'FOCUS SESSION'}</Text>
        <View style={[styles.grandSessionActionIcon, { backgroundColor: active ? theme.gold : theme.primary }]}>{active ? <Square size={18} color={theme.primaryFg} fill={theme.primaryFg} /> : <Play size={20} color={theme.primaryFg} fill={theme.primaryFg} />}</View>
        <Text style={styles.grandSessionValue}>{active ? formatDuration(seconds) : 'CHECK IN'}</Text>
        <Text style={[styles.grandSessionHint, { color: theme.muted }]}>{active ? 'Tap to finish with intent' : 'Tap to begin your focus'}</Text>
      </LinearGradient>
    </Pressable></Animated.View>
  </View>;
}

const styles = StyleSheet.create({
  progressTrack: { height: 8, borderRadius: radius.pill, overflow: 'hidden' }, progressFill: { height: '100%', borderRadius: radius.pill }, metric: { flex: 1, minWidth: 108, borderWidth: 1, borderRadius: radius.card, padding: spacing.md, gap: 3 }, metricLabel: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1 }, metricValue: { fontFamily: font.extraBold, fontSize: 24, letterSpacing: -0.5 }, metricDetail: { fontFamily: font.regular, fontSize: 11, lineHeight: 16 }, sessionButton: { alignItems: 'center', justifyContent: 'center', borderWidth: 9, borderRadius: 999 }, sessionCompact: { width: 116, height: 116 }, sessionLarge: { width: 174, height: 174, alignSelf: 'center' }, sessionTop: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1 }, sessionTime: { marginTop: 4, fontFamily: font.extraBold, fontSize: 18 }, sessionBottom: { marginTop: 3, fontFamily: font.medium, fontSize: 10 },
  grandSessionStage: { width: 238, height: 238, alignItems: 'center', justifyContent: 'center' }, grandSessionHalo: { position: 'absolute', width: 224, height: 224, borderRadius: 112, borderWidth: 14 }, grandSessionBurst: { position: 'absolute', width: 196, height: 196, borderRadius: 98, borderWidth: 3 }, grandSessionOrbit: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderStyle: 'dashed' }, grandOrbitDot: { position: 'absolute', width: 11, height: 11, borderRadius: 6, top: -6, left: 104, shadowOpacity: .8, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 5 }, grandSessionCore: { width: 184, height: 184, borderRadius: 92, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, grandSessionEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.25 }, grandSessionActionIcon: { width: 49, height: 49, marginTop: 9, borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: .28, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 }, grandSessionValue: { color: '#FFFFFF', marginTop: 8, fontFamily: font.extraBold, fontSize: 19, letterSpacing: -.35 }, grandSessionHint: { marginTop: 3, fontFamily: font.medium, fontSize: 8 },
});
