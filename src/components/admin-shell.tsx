import { useState, type ReactNode } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { GlassView } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, CircleHelp, Layers3, LayoutDashboard, ReceiptText, ScrollText, ShieldCheck, Tag, UsersRound, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { font, spacing, themes } from '@/constants/theme';
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
  const [toolsOpen, setToolsOpen] = useState(false);
  const openTool = (path: '/admin/questions' | '/admin/audit') => { setToolsOpen(false); router.push(path as never); };

  return <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.safe, { backgroundColor: theme.canvas }]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.identityRow}>
        <View style={[styles.adminMark, { backgroundColor: theme.primarySoft, borderColor: dark ? 'rgba(124,156,255,0.34)' : theme.line }]}><ShieldCheck size={19} color={theme.primaryStrong} /></View>
        <View style={styles.identityCopy}><Text style={[styles.brand, { color: theme.fg }]}>Parallax Flow</Text><Text style={[styles.adminLabel, { color: theme.muted }]}>ADMIN WORKSPACE</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open Admin tools" onPress={() => setToolsOpen(true)} style={({ pressed }) => [styles.profileControl, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.statusDot, { backgroundColor: theme.success }]} /><Text style={[styles.profileInitials, { color: theme.primaryStrong }]}>MA</Text></Pressable>
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

    <Modal visible={toolsOpen} transparent animationType="none" onRequestClose={() => setToolsOpen(false)}><View style={styles.toolsModal}><Pressable accessibilityRole="button" accessibilityLabel="Close Admin tools" onPress={() => setToolsOpen(false)} style={styles.toolsBackdrop} /><View style={[styles.toolsSheet, { backgroundColor: theme.elevated, borderColor: theme.lineStrong }]}><View style={[styles.toolsHandle, { backgroundColor: theme.lineStrong }]} /><View style={styles.toolsHeading}><View style={[styles.toolsAvatar, { backgroundColor: theme.primarySoft }]}><ShieldCheck size={19} color={theme.primaryStrong} /></View><View style={styles.headingCopy}><Text style={[styles.toolsEyebrow, { color: theme.primary }]}>MOBILE ADMIN</Text><Text style={[styles.toolsTitle, { color: theme.fg }]}>Admin tools</Text><Text style={[styles.toolsDescription, { color: theme.muted }]}>Read-only operational views and workspace activity.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setToolsOpen(false)} style={[styles.toolsClose, { backgroundColor: theme.sunken }]}><X size={18} color={theme.muted} /></Pressable></View><View style={styles.toolsList}><Pressable onPress={() => openTool('/admin/questions')} style={({ pressed }) => [styles.toolRow, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.toolIcon, { backgroundColor: theme.primarySoft }]}><CircleHelp size={18} color={theme.primaryStrong} /></View><View style={styles.headingCopy}><Text style={[styles.toolTitle, { color: theme.fg }]}>Question bank</Text><Text style={[styles.toolDetail, { color: theme.muted }]}>Review subject and topic coverage</Text></View><ChevronRight size={17} color={theme.faint} /></Pressable><Pressable onPress={() => openTool('/admin/audit')} style={({ pressed }) => [styles.toolRow, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.toolIcon, { backgroundColor: theme.goldSoft }]}><ScrollText size={18} color={theme.goldStrong} /></View><View style={styles.headingCopy}><Text style={[styles.toolTitle, { color: theme.fg }]}>Audit log</Text><Text style={[styles.toolDetail, { color: theme.muted }]}>Review recent workspace activity</Text></View><ChevronRight size={17} color={theme.faint} /></Pressable></View></View></View></Modal>
  </SafeAreaView>;
}

export function AdminStat({ label, value, detail, tone = 'primary' }: { label: string; value: string; detail: string; tone?: 'primary' | 'gold' | 'success' }) {
  const { theme } = useAppTheme();
  const accent = tone === 'gold' ? theme.goldStrong : tone === 'success' ? theme.success : theme.primary;
  return <View style={[styles.stat, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.statAccent, { backgroundColor: accent }]} /><Text style={[styles.statLabel, { color: accent }]}>{label}</Text><Text style={[styles.statValue, { color: theme.fg }]}>{value}</Text><Text numberOfLines={1} style={[styles.statDetail, { color: theme.muted }]}>{detail}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 108, gap: spacing.md },
  identityRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9 },
  adminMark: { width: 36, height: 36, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1 },
  brand: { fontFamily: font.extraBold, fontSize: 15, letterSpacing: -0.3 },
  adminLabel: { marginTop: 1, fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 },
  profileControl: { position: 'relative', width: 38, height: 38, borderRadius: 19, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  profileInitials: { fontFamily: font.extraBold, fontSize: 10 },
  statusDot: { position: 'absolute', right: 1, bottom: 2, width: 7, height: 7, borderRadius: 4, borderWidth: 1, borderColor: '#0C0E11' },
  pageHeading: { minHeight: 64, flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md },
  headingCopy: { flex: 1, minWidth: 0 },
  eyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.4 },
  title: { marginTop: 2, fontFamily: font.extraBold, fontSize: 26, lineHeight: 32, letterSpacing: -0.8 },
  description: { marginTop: 3, maxWidth: 430, fontFamily: font.regular, fontSize: 11, lineHeight: 16 },
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
  toolsModal: { flex: 1, justifyContent: 'flex-end' }, toolsBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,.68)' }, toolsSheet: { width: '100%', maxWidth: 680, alignSelf: 'center', borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 28 }, toolsHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 }, toolsHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, toolsAvatar: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, toolsEyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 }, toolsTitle: { marginTop: 2, fontFamily: font.extraBold, fontSize: 17 }, toolsDescription: { marginTop: 3, fontFamily: font.regular, fontSize: 8 }, toolsClose: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, toolsList: { marginTop: 15, gap: 8 }, toolRow: { minHeight: 69, borderWidth: 1, borderRadius: 15, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 9 }, toolIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, toolTitle: { fontFamily: font.bold, fontSize: 11 }, toolDetail: { marginTop: 3, fontFamily: font.regular, fontSize: 8 },
});
