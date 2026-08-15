import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, Flame, Sparkles } from 'lucide-react-native';

import { Card } from '@/components/ui';
import { font } from '@/constants/theme';
import { useRewardStore } from '@/lib/reward-store';
import { useAppTheme } from '@/providers/app-providers';

const nativeDriver = Platform.OS !== 'web';
const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export function TrackerStreakCalendar() {
  const { theme } = useAppTheme();
  const streak = useRewardStore((state) => state.streak);
  const currentDate = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
  const [flameMotion] = useState(() => new Animated.Value(0));
  const [entrance] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }).start();
    const flameLoop = Animated.loop(Animated.sequence([Animated.timing(flameMotion, { toValue: 1, duration: 780, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }), Animated.timing(flameMotion, { toValue: 0, duration: 920, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver })]));
    flameLoop.start();
    return () => flameLoop.stop();
  }, [entrance, flameMotion]);

  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const mondayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const sameMonth = year === currentDate.getFullYear() && month === currentDate.getMonth();
  const cells = Array.from({ length: mondayOffset + dayCount }, (_, index) => {
    if (index < mondayOffset) return null;
    const day = index - mondayOffset + 1;
    const difference = sameMonth ? currentDate.getDate() - day : -1;
    const active = sameMonth ? difference >= 0 && difference < streak : year < currentDate.getFullYear() || month < currentDate.getMonth() ? day % 6 === 2 || day % 9 === 0 : false;
    const missed = !active && (sameMonth ? day < currentDate.getDate() : true) && (day + month) % 7 === 3;
    return { day, active, missed, today: sameMonth && day === currentDate.getDate(), future: sameMonth && day > currentDate.getDate() };
  });
  const missed = cells.filter((cell) => cell?.missed).length;
  const flameScale = flameMotion.interpolate({ inputRange: [0, 1], outputRange: [.95, 1.08] });
  const flameSway = flameMotion.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] });
  const rise = entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const monthLabel = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return <Animated.View style={{ opacity: entrance, transform: [{ translateY: rise }] }}><Card style={styles.card}>
    <View style={styles.heading}><View style={styles.identity}><View style={styles.flameWrap}><Animated.View style={{ transform: [{ scale: flameScale }, { rotate: flameSway }] }}><Flame size={35} fill="#FF8614" color="#FF8614" /></Animated.View><Sparkles style={styles.sparkle} size={10} color={theme.goldStrong} /></View><View style={styles.headingCopy}><Text style={[styles.eyebrow, { color: theme.goldStrong }]}>STREAK CALENDAR</Text><Text style={[styles.title, { color: theme.fg }]}>{streak} days in motion</Text><Text style={[styles.subtitle, { color: theme.muted }]}>Every focused day leaves a visible flame.</Text></View></View></View>
    <View style={[styles.calendar, { backgroundColor: theme.sunken, borderColor: theme.lineStrong }]}>
      <View style={styles.calendarHeader}><View><Text style={[styles.month, { color: theme.fg }]}>{monthLabel}</Text><Text style={[styles.monthHint, { color: theme.muted }]}>Learning activity by day</Text></View><View style={styles.monthActions}><Pressable accessibilityLabel="Previous month" onPress={() => setVisibleMonth(new Date(year, month - 1, 1))} style={[styles.monthButton, { backgroundColor: theme.surface }]}><ChevronLeft size={17} color={theme.muted} /></Pressable><Pressable accessibilityLabel="Next month" onPress={() => setVisibleMonth(new Date(year, month + 1, 1))} style={[styles.monthButton, { backgroundColor: theme.surface }]}><ChevronRight size={17} color={theme.muted} /></Pressable></View></View>
      <View style={styles.weekRow}>{weekDays.map((day, index) => <Text key={day} style={[styles.weekDay, { color: index > 4 ? theme.goldStrong : theme.faint }]}>{day}</Text>)}</View>
      <View style={styles.grid}>{cells.map((cell, index) => <View key={`${year}-${month}-${index}`} style={styles.dayCell}>{cell ? <View style={styles.dayBadge}>{cell.active ? <Flame size={cell.today ? 35 : 31} fill={cell.today ? '#FF8614' : '#F0C878'} color={cell.today ? '#FF8614' : '#F0C878'} strokeWidth={1} /> : null}<View style={styles.dayNumberLayer}><Text style={[styles.dayNumber, { color: cell.active ? '#170D05' : cell.missed ? theme.danger : cell.future ? theme.faint : theme.muted }, cell.active && styles.activeDayNumber]}>{cell.day}</Text>{cell.missed ? <View style={[styles.missedDot, { backgroundColor: theme.danger }]} /> : null}</View></View> : null}</View>)}</View>
      <View style={[styles.footer, { borderTopColor: theme.line }]}><View style={styles.legend}><Flame size={14} fill={theme.goldStrong} color={theme.goldStrong} /><Text style={[styles.legendStrong, { color: theme.goldStrong }]}>{streak} active</Text></View><View style={styles.legend}><View style={[styles.missedLegend, { backgroundColor: theme.danger }]} /><Text style={[styles.legendText, { color: theme.muted }]}>{missed} missed</Text></View><Text style={[styles.best, { color: theme.faint }]}>Best · 12 days</Text></View>
    </View>
  </Card></Animated.View>;
}

const styles = StyleSheet.create({
  card: { padding: 14 }, heading: { minHeight: 68, justifyContent: 'center' }, identity: { flexDirection: 'row', alignItems: 'center', gap: 11 }, flameWrap: { width: 48, height: 52, alignItems: 'center', justifyContent: 'flex-end' }, sparkle: { position: 'absolute', top: 1, right: 2 }, headingCopy: { flex: 1, minWidth: 0 }, eyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.1 }, title: { marginTop: 3, fontFamily: font.extraBold, fontSize: 17, letterSpacing: -.35 }, subtitle: { marginTop: 2, fontFamily: font.regular, fontSize: 8 }, calendar: { marginTop: 11, borderWidth: 1, borderRadius: 18, padding: 12 }, calendarHeader: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, month: { fontFamily: font.extraBold, fontSize: 15 }, monthHint: { marginTop: 2, fontFamily: font.regular, fontSize: 7 }, monthActions: { flexDirection: 'row', gap: 5 }, monthButton: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, weekRow: { flexDirection: 'row', marginTop: 12, marginBottom: 5 }, weekDay: { width: '14.285%', fontFamily: font.bold, fontSize: 6, letterSpacing: .25, textAlign: 'center' }, grid: { flexDirection: 'row', flexWrap: 'wrap' }, dayCell: { width: '14.285%', height: 39, alignItems: 'center', justifyContent: 'center' }, dayBadge: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }, dayNumberLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' }, dayNumber: { fontFamily: font.bold, fontSize: 8, lineHeight: 10 }, activeDayNumber: { fontFamily: font.extraBold, fontSize: 8 }, missedDot: { position: 'absolute', bottom: 5, width: 3, height: 3, borderRadius: 2 }, footer: { minHeight: 39, marginTop: 8, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }, legend: { flexDirection: 'row', alignItems: 'center', gap: 4 }, legendStrong: { fontFamily: font.bold, fontSize: 8 }, legendText: { fontFamily: font.medium, fontSize: 8 }, missedLegend: { width: 5, height: 5, borderRadius: 3 }, best: { flex: 1, textAlign: 'right', fontFamily: font.medium, fontSize: 7 },
});
