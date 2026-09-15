import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowUpRight, CalendarRange, Crown, LockKeyhole } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { font, radius } from '@/constants/theme';
import { listMonthlyReports } from '@/lib/monthly-report-api';
import { useAppTheme } from '@/providers/app-providers';

const nativeDriver = Platform.OS !== 'web';

export function MonthlyReportShortcut() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const reportAccess = useQuery({ queryKey: ['student', 'monthly-reports'], queryFn: listMonthlyReports, staleTime: 30_000 });
  const paid = reportAccess.data?.access.owned === true;
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [.92, 1.08] });

  return <Pressable onPress={() => router.push('/monthly-reports' as never)} style={({ pressed }) => [styles.card, { backgroundColor: theme.surface, borderColor: paid ? theme.gold : theme.line }, pressed && styles.pressed]}>
    <View style={[styles.icon, { backgroundColor: paid ? theme.goldSoft : theme.sunken }]}><Animated.View style={{ transform: [{ scale }] }}>{paid ? <CalendarRange size={23} color={theme.goldStrong} /> : <LockKeyhole size={21} color={theme.muted} />}</Animated.View></View>
    <View style={styles.copy}><View style={styles.labelRow}><Text style={[styles.label, { color: paid ? theme.goldStrong : theme.primary }]}>MONTHLY INTELLIGENCE</Text><View style={[styles.badge, { backgroundColor: theme.goldSoft }]}><Crown size={9} color={theme.goldStrong} /><Text style={[styles.badgeText, { color: theme.goldStrong }]}>PAID</Text></View></View><Text style={[styles.title, { color: theme.fg }]}>{reportAccess.isLoading ? 'Checking report access' : paid ? 'Your report archive' : 'Unlock monthly reports'}</Text><Text style={[styles.description, { color: theme.muted }]}>{paid ? 'Review every generated month and performance signal.' : 'Purchase on the website and open reports securely here.'}</Text></View>
    <ArrowUpRight size={17} color={paid ? theme.goldStrong : theme.primaryStrong} />
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { minHeight: 92, borderWidth: 1, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden' }, icon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, minWidth: 0 }, labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, label: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 }, badge: { minHeight: 20, borderRadius: radius.pill, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }, badgeText: { fontFamily: font.bold, fontSize: 6, letterSpacing: .6 }, title: { marginTop: 4, fontFamily: font.extraBold, fontSize: 15 }, description: { marginTop: 3, fontFamily: font.regular, fontSize: 8, lineHeight: 13 }, pressed: { opacity: .76, transform: [{ scale: .99 }] },
});
