import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, ArrowUpRight, BookOpen, CheckCircle2, GraduationCap, PackageCheck, ReceiptText, ShieldCheck, Tag, UsersRound } from 'lucide-react-native';

import { AdminShell, AdminStat } from '@/components/admin-shell';
import { font, radius, spacing, themes } from '@/constants/theme';
import { adminCoupons, adminOrders, adminStudents, formatInr, paidNotes, paidPackages } from '@/lib/demo-admin';
import { useAppTheme } from '@/providers/app-providers';

export default function AdminOverview() {
  const { theme } = useAppTheme();
  const dark = theme.canvas === themes.dark.canvas;
  const router = useRouter();
  const paidOrders = adminOrders.filter((order) => order.status === 'Paid');
  const totalOrderValue = paidOrders.reduce((total, order) => total + order.amount, 0);
  const activeCoupons = adminCoupons.filter((coupon) => coupon.status === 'Active').length;
  const trendDates = ['25 Jul 2026', '26 Jul 2026', '27 Jul 2026', '28 Jul 2026', '29 Jul 2026', '30 Jul 2026', '31 Jul 2026'];
  const orderTrend = trendDates.map((date) => paidOrders.filter((order) => order.date === date).length);
  const maxOrders = Math.max(...orderTrend, 1);
  const quickActions = [
    { label: 'Students', detail: 'View learner activity', path: '/admin/students', icon: UsersRound, tone: theme.primaryStrong, soft: theme.primarySoft },
    { label: 'Orders', detail: 'Review transactions', path: '/admin/orders', icon: ReceiptText, tone: theme.goldStrong, soft: theme.goldSoft },
    { label: 'Courses', detail: 'Manage structure', path: '/admin/content', icon: GraduationCap, tone: theme.success, soft: theme.successSoft },
    { label: 'Coupons', detail: 'Create an offer', path: '/admin/coupons', icon: Tag, tone: theme.primaryStrong, soft: theme.primarySoft },
  ] as const;

  return <AdminShell eyebrow="OPERATIONS" title="Overview" description="A clear view of learners, orders and published study material.">
    <LinearGradient colors={dark ? ['#1B2543', '#111725', '#111316'] : ['#35458F', '#4C5CB0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={styles.heroOrbit} /><View style={styles.heroOrbitSmall} />
      <View style={styles.heroTop}>
        <View style={styles.heroIdentity}><View style={styles.heroIcon}><ShieldCheck size={19} color="#C7D2FF" /></View><View style={styles.heroCopyGroup}><Text style={styles.heroEyebrow}>COMMAND CENTRE</Text><Text style={styles.heroTitle}>Everything important,{`\n`}at a glance.</Text></View></View>
        <View style={styles.accessPill}><View style={styles.accessDot} /><Text style={styles.accessText}>LIVE</Text></View>
      </View>
      <View style={styles.heroBottom}><Text style={styles.heroCopy}>Monitor today&apos;s activity and move quickly to the task that needs attention.</Text><Pressable accessibilityRole="button" accessibilityLabel="Create coupon" onPress={() => router.push('/admin/coupons' as never)} style={({ pressed }) => [styles.heroAction, pressed && styles.pressed]}><Tag size={15} color="#0A1021" /><Text style={styles.heroActionText}>New coupon</Text><ArrowUpRight size={14} color="#0A1021" /></Pressable></View>
    </LinearGradient>

    <View style={styles.stats}>
      <View style={styles.primaryStat}><AdminStat label="TOTAL ORDER VALUE" value={formatInr(totalOrderValue)} detail={`${paidOrders.length} successful orders`} tone="gold" /></View>
      <View style={styles.secondaryStats}><AdminStat label="STUDENTS" value={String(adminStudents.length)} detail="Across 3 courses" /><AdminStat label="PUBLISHED" value={String(paidNotes.length)} detail="Notes live" tone="success" /></View>
    </View>

    <View>
      <View style={styles.sectionHeading}><View><Text style={[styles.sectionEyebrow, { color: theme.primary }]}>QUICK ACCESS</Text><Text style={[styles.sectionTitle, { color: theme.fg }]}>What would you like to manage?</Text></View></View>
      <View style={styles.actionGrid}>{quickActions.map((item) => { const Icon = item.icon; return <Pressable key={item.path} accessibilityRole="button" onPress={() => router.push(item.path as never)} style={({ pressed }) => [styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.actionIcon, { backgroundColor: item.soft }]}><Icon size={18} color={item.tone} /></View><View style={styles.rowCopy}><Text style={[styles.actionTitle, { color: theme.fg }]}>{item.label}</Text><Text numberOfLines={1} style={[styles.actionDetail, { color: theme.muted }]}>{item.detail}</Text></View><ArrowRight size={15} color={theme.faint} /></Pressable>; })}</View>
    </View>

    <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.sectionHeading}><View style={styles.rowCopy}><Text style={[styles.sectionEyebrow, { color: theme.primary }]}>LAST 7 DAYS</Text><Text style={[styles.sectionTitle, { color: theme.fg }]}>Order volume</Text><Text style={[styles.chartHint, { color: theme.muted }]}>Successful orders received each day</Text></View><View style={[styles.chartBadge, { backgroundColor: theme.primarySoft }]}><Text style={[styles.chartBadgeValue, { color: theme.primaryStrong }]}>{orderTrend.reduce((total, count) => total + count, 0)}</Text><Text style={[styles.chartBadgeLabel, { color: theme.muted }]}>ORDERS</Text></View></View>
      <View style={styles.chart}>{orderTrend.map((count, index) => <View key={trendDates[index]} style={styles.barColumn}><Text style={[styles.barValue, { color: count ? theme.primaryStrong : theme.faint }]}>{count}</Text><View style={[styles.barTrack, { backgroundColor: theme.sunken }]}><View style={[styles.barFill, { height: `${Math.max(count ? 24 : 5, (count / maxOrders) * 100)}%`, backgroundColor: count ? theme.primary : theme.lineStrong }]} /></View><Text style={[styles.barDay, { color: theme.muted }]}>{['F', 'S', 'S', 'M', 'T', 'W', 'T'][index]}</Text><Text style={[styles.barDate, { color: theme.faint }]}>{25 + index}</Text></View>)}</View>
      <Pressable onPress={() => router.push('/admin/orders' as never)} style={({ pressed }) => [styles.chartLink, { borderTopColor: theme.line }, pressed && styles.pressed]}><Text style={[styles.chartLinkText, { color: theme.primaryStrong }]}>View all orders</Text><ArrowUpRight size={16} color={theme.primaryStrong} /></Pressable>
    </View>

    <View style={[styles.permissionCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.sectionHeading}><View><Text style={[styles.sectionEyebrow, { color: theme.primary }]}>MOBILE PERMISSIONS</Text><Text style={[styles.sectionTitle, { color: theme.fg }]}>Focused admin controls</Text></View><View style={[styles.readOnlyPill, { backgroundColor: theme.primarySoft }]}><Text style={[styles.readOnlyText, { color: theme.primaryStrong }]}>SAFE MODE</Text></View></View>
      <View style={[styles.permissionRow, { borderTopColor: theme.line }]}><View style={[styles.rowIcon, { backgroundColor: theme.primarySoft }]}><BookOpen size={18} color={theme.primaryStrong} /></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: theme.fg }]}>Notes and packages</Text><Text style={[styles.rowDetail, { color: theme.muted }]}>View only · publishing stays on the website</Text></View><Text style={[styles.permissionState, { color: theme.muted }]}>Read-only</Text></View>
      <View style={[styles.permissionRow, { borderTopColor: theme.line }]}><View style={[styles.rowIcon, { backgroundColor: theme.goldSoft }]}><Tag size={18} color={theme.goldStrong} /></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: theme.fg }]}>Coupons</Text><Text style={[styles.rowDetail, { color: theme.muted }]}>Create and review mobile coupon offers</Text></View><Text style={[styles.permissionState, { color: theme.success }]}>Create</Text></View>
    </View>

    <View style={styles.catalogueSection}>
      <View style={styles.sectionHeading}><View><Text style={[styles.sectionEyebrow, { color: theme.primary }]}>AVAILABLE NOW</Text><Text style={[styles.sectionTitle, { color: theme.fg }]}>Catalogue snapshot</Text></View></View>
      <Pressable onPress={() => router.push('/admin/content?view=paid&kind=notes' as never)} style={({ pressed }) => [styles.catalogueCard, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.catalogueIcon, { backgroundColor: theme.primarySoft }]}><BookOpen size={21} color={theme.primaryStrong} /></View><View style={styles.rowCopy}><Text style={[styles.catalogueValue, { color: theme.fg }]}>{paidNotes.length} paid notes available</Text><Text style={[styles.rowDetail, { color: theme.muted }]}>JEE, CA and NEET · all published</Text></View><ArrowUpRight size={18} color={theme.primary} /></Pressable>
      <Pressable onPress={() => router.push('/admin/content?view=paid&kind=packages' as never)} style={({ pressed }) => [styles.catalogueCard, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.catalogueIcon, { backgroundColor: theme.goldSoft }]}><PackageCheck size={21} color={theme.goldStrong} /></View><View style={styles.rowCopy}><Text style={[styles.catalogueValue, { color: theme.fg }]}>{paidPackages.length} packages live</Text><Text style={[styles.rowDetail, { color: theme.muted }]}>{paidPackages.reduce((total, item) => total + item.lessonCount, 0)} packaged lessons available</Text></View><ArrowUpRight size={18} color={theme.goldStrong} /></Pressable>
    </View>

    <View style={[styles.healthCard, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.healthIcon, { backgroundColor: theme.successSoft }]}><CheckCircle2 size={19} color={theme.success} /></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: theme.fg }]}>Workspace is ready</Text><Text style={[styles.rowDetail, { color: theme.muted }]}>{activeCoupons} active coupon · {adminOrders.length} receipts available</Text></View><View style={[styles.healthyPill, { backgroundColor: theme.successSoft }]}><Text style={[styles.healthyText, { color: theme.success }]}>HEALTHY</Text></View></View>
  </AdminShell>;
}

const styles = StyleSheet.create({
  hero: { minHeight: 205, overflow: 'hidden', borderRadius: 22, padding: spacing.lg, justifyContent: 'space-between' },
  heroOrbit: { position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', right: -68, top: -88 },
  heroOrbitSmall: { position: 'absolute', width: 88, height: 88, borderRadius: 44, borderWidth: 1, borderColor: 'rgba(199,210,255,0.12)', right: 36, top: 19 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  heroIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  heroCopyGroup: { flex: 1, minWidth: 0 },
  heroIcon: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  accessPill: { minHeight: 26, borderRadius: radius.pill, backgroundColor: 'rgba(5,8,16,0.25)', paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  accessDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#78DDB4' },
  accessText: { color: '#DCE3FF', fontFamily: font.bold, fontSize: 7, letterSpacing: .9 },
  heroEyebrow: { color: '#9FB3FF', fontFamily: font.bold, fontSize: 8, letterSpacing: 1.25 },
  heroTitle: { marginTop: 4, color: '#FFFFFF', fontFamily: font.extraBold, fontSize: 22, lineHeight: 27, letterSpacing: -.65 },
  heroBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  heroCopy: { flex: 1, maxWidth: 340, color: 'rgba(255,255,255,0.68)', fontFamily: font.regular, fontSize: 10, lineHeight: 15 },
  heroAction: { minHeight: 39, borderRadius: 12, paddingHorizontal: 12, backgroundColor: '#9FB3FF', flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroActionText: { color: '#0A1021', fontFamily: font.bold, fontSize: 10 },
  stats: { gap: spacing.sm }, primaryStat: { width: '100%' }, secondaryStats: { flexDirection: 'row', gap: spacing.sm },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.25 },
  sectionTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 16, letterSpacing: -.3 },
  actionGrid: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  actionCard: { width: '48.7%', minHeight: 68, borderWidth: 1, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionTitle: { fontFamily: font.bold, fontSize: 11 }, actionDetail: { marginTop: 2, fontFamily: font.regular, fontSize: 8 },
  chartCard: { borderWidth: 1, borderRadius: 19, padding: 14 },
  chartHint: { marginTop: 3, fontFamily: font.regular, fontSize: 9 },
  chartBadge: { minWidth: 55, height: 49, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chartBadgeValue: { fontFamily: font.extraBold, fontSize: 17 }, chartBadgeLabel: { marginTop: 1, fontFamily: font.bold, fontSize: 7, letterSpacing: .8 },
  chart: { height: 142, marginTop: spacing.md, flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { marginBottom: 5, fontFamily: font.bold, fontSize: 8 },
  barTrack: { width: '68%', maxWidth: 27, height: 96, overflow: 'hidden', justifyContent: 'flex-end', borderRadius: 9 },
  barFill: { width: '100%', borderRadius: 9 },
  barDay: { marginTop: 5, fontFamily: font.bold, fontSize: 8 }, barDate: { marginTop: 1, fontFamily: font.regular, fontSize: 7 },
  chartLink: { minHeight: 38, marginTop: 11, borderTopWidth: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 5 }, chartLinkText: { fontFamily: font.bold, fontSize: 10 },
  permissionCard: { borderWidth: 1, borderRadius: 19, padding: 14 },
  readOnlyPill: { minHeight: 27, borderRadius: radius.pill, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' }, readOnlyText: { fontFamily: font.bold, fontSize: 8, letterSpacing: .8 },
  permissionRow: { minHeight: 64, marginTop: 11, paddingTop: 11, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0 }, rowTitle: { fontFamily: font.bold, fontSize: 11 }, rowDetail: { marginTop: 3, fontFamily: font.regular, fontSize: 8, lineHeight: 13 }, permissionState: { fontFamily: font.bold, fontSize: 8 },
  catalogueSection: { gap: spacing.sm }, catalogueCard: { minHeight: 72, borderWidth: 1, borderRadius: 17, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  catalogueIcon: { width: 41, height: 41, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, catalogueValue: { fontFamily: font.bold, fontSize: 12 },
  healthCard: { minHeight: 67, borderWidth: 1, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 }, healthIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  healthyPill: { minHeight: 25, borderRadius: radius.pill, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' }, healthyText: { fontFamily: font.bold, fontSize: 7, letterSpacing: .7 },
  pressed: { opacity: .74, transform: [{ scale: .99 }] },
});
