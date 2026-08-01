import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { Layers3, LayoutDashboard, ReceiptText, ShieldCheck, Tag, UsersRound } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { font, radius, spacing, themes } from '@/constants/theme';
import { useAppTheme } from '@/providers/app-providers';

const navigation = [
  { label: 'Overview', path: '/admin', icon: LayoutDashboard },
  { label: 'Students', path: '/admin/students', icon: UsersRound },
  { label: 'Orders', path: '/admin/orders', icon: ReceiptText },
  { label: 'Courses', path: '/admin/content', icon: Layers3 },
  { label: 'Coupons', path: '/admin/coupons', icon: Tag },
] as const;

const webBlur = Platform.OS === 'web' ? ({ backdropFilter: 'blur(28px) saturate(180%)' } as ViewStyle) : undefined;

export function AdminShell({ eyebrow, title, description, children, action }: { eyebrow: string; title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  const { theme } = useAppTheme();
  const dark = theme.canvas === themes.dark.canvas;
  const router = useRouter();
  const pathname = usePathname();

  return <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.safe, { backgroundColor: theme.canvas }]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.identityRow}>
        <View style={[styles.adminMark, { backgroundColor: theme.primarySoft, borderColor: dark ? 'rgba(124,156,255,0.34)' : theme.line }]}><ShieldCheck size={19} color={theme.primaryStrong} /></View>
        <View style={styles.identityCopy}><Text style={[styles.brand, { color: theme.fg }]}>Parallax Flow</Text><Text style={[styles.adminLabel, { color: theme.muted }]}>MOBILE ADMIN</Text></View>
        <View style={[styles.statusPill, { backgroundColor: theme.successSoft }]}><View style={[styles.statusDot, { backgroundColor: theme.success }]} /><Text style={[styles.statusText, { color: theme.success }]}>ONLINE</Text></View>
      </View>

      <View style={styles.pageHeading}>
        <View style={styles.headingCopy}><Text style={[styles.eyebrow, { color: theme.primary }]}>{eyebrow}</Text><Text style={[styles.title, { color: theme.fg }]}>{title}</Text>{description ? <Text style={[styles.description, { color: theme.muted }]}>{description}</Text> : null}</View>
        {action}
      </View>
      {children}
    </ScrollView>

    <View pointerEvents="box-none" style={styles.navPositioner}>
      <View style={[styles.navShell, { borderColor: dark ? 'rgba(185,199,255,0.28)' : 'rgba(255,255,255,0.92)' }, webBlur]}>
        <GlassView glassEffectStyle="regular" tintColor={dark ? 'rgba(12,15,21,0.72)' : 'rgba(246,249,255,0.68)'} colorScheme={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <LinearGradient pointerEvents="none" colors={dark ? ['rgba(255,255,255,0.10)', 'rgba(19,23,31,0.76)', 'rgba(8,10,14,0.94)'] : ['rgba(255,255,255,0.94)', 'rgba(235,240,252,0.74)']} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={[styles.navSheen, { backgroundColor: dark ? 'rgba(207,216,255,0.42)' : '#FFFFFF' }]} />
        <View style={styles.navItems}>{navigation.map((item) => {
          const active = item.path === '/admin' ? pathname === item.path : pathname.startsWith(item.path);
          const Icon = item.icon;
          return <Pressable key={item.path} accessibilityRole="button" accessibilityState={active ? { selected: true } : {}} accessibilityLabel={item.label} onPress={() => router.replace(item.path as never)} style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}>
            <View style={[styles.iconWell, active && { backgroundColor: theme.primarySoft, borderColor: dark ? 'rgba(124,156,255,0.62)' : theme.lineStrong }]}><Icon size={19} color={active ? theme.primaryStrong : theme.muted} strokeWidth={active ? 2.5 : 2} /></View>
            <Text numberOfLines={1} style={[styles.navText, { color: active ? theme.primaryStrong : theme.muted }]}>{item.label}</Text>
          </Pressable>;
        })}</View>
      </View>
    </View>
  </SafeAreaView>;
}

export function AdminStat({ label, value, detail, tone = 'primary' }: { label: string; value: string; detail: string; tone?: 'primary' | 'gold' | 'success' }) {
  const { theme } = useAppTheme();
  const accent = tone === 'gold' ? theme.goldStrong : tone === 'success' ? theme.success : theme.primary;
  return <View style={[styles.stat, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.statAccent, { backgroundColor: accent }]} /><Text style={[styles.statLabel, { color: accent }]}>{label}</Text><Text style={[styles.statValue, { color: theme.fg }]}>{value}</Text><Text numberOfLines={1} style={[styles.statDetail, { color: theme.muted }]}>{detail}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 850, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: 112, gap: spacing.lg },
  identityRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  adminMark: { width: 38, height: 38, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1 },
  brand: { fontFamily: font.extraBold, fontSize: 15, letterSpacing: -0.3 },
  adminLabel: { marginTop: 1, fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 },
  statusPill: { minHeight: 28, borderRadius: radius.pill, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontFamily: font.bold, fontSize: 8, letterSpacing: 0.8 },
  pageHeading: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  headingCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.4 },
  title: { marginTop: 3, fontFamily: font.extraBold, fontSize: 28, letterSpacing: -0.8 },
  description: { marginTop: 4, maxWidth: 430, fontFamily: font.regular, fontSize: 12, lineHeight: 18 },
  navPositioner: { position: 'absolute', left: 12, right: 12, bottom: 9, height: 74 },
  navShell: { flex: 1, overflow: 'hidden', borderWidth: 1, borderRadius: 27, backgroundColor: 'rgba(12,15,20,0.72)' },
  navSheen: { position: 'absolute', top: 0, left: 18, right: 18, height: 1 },
  navItems: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 7, paddingTop: 5, paddingBottom: 4 },
  navItem: { flex: 1, height: 61, alignItems: 'center', justifyContent: 'center' },
  iconWell: { width: 43, height: 31, borderRadius: 16, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  navText: { marginTop: 3, fontFamily: font.semibold, fontSize: 9, lineHeight: 12, textAlign: 'center' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  stat: { position: 'relative', flex: 1, minWidth: 96, minHeight: 112, overflow: 'hidden', borderWidth: 1, borderRadius: 17, padding: 13 },
  statAccent: { position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  statLabel: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1 },
  statValue: { marginTop: 7, fontFamily: font.extraBold, fontSize: 23, letterSpacing: -0.5 },
  statDetail: { marginTop: 3, fontFamily: font.regular, fontSize: 9 },
});
