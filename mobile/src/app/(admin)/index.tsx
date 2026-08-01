import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, BookOpen, CheckCircle2, PackageCheck, ShieldCheck, Tag } from 'lucide-react-native';

import { AdminShell, AdminStat } from '@/components/admin-shell';
import { font, radius, spacing, themes } from '@/constants/theme';
import { adminCoupons, adminOrders, adminStudents, formatInr, paidNotes, paidPackages } from '@/lib/demo-admin';
import { useAppTheme } from '@/providers/app-providers';

export default function AdminOverview() {
  const { theme } = useAppTheme();
  const dark = theme.canvas === themes.dark.canvas;
  const router = useRouter();
  const totalOrderValue = adminOrders.filter((order) => order.status === 'Paid').reduce((total, order) => total + order.amount, 0);
  const activeCoupons = adminCoupons.filter((coupon) => coupon.status === 'Active').length;
  const trendDates = ['25 Jul 2026', '26 Jul 2026', '27 Jul 2026', '28 Jul 2026', '29 Jul 2026', '30 Jul 2026', '31 Jul 2026'];
  const orderTrend = trendDates.map((date) => adminOrders.filter((order) => order.date === date).length);
  const maxOrders = Math.max(...orderTrend, 1);

  return <AdminShell eyebrow="OPERATIONS" title="Overview" description="Monitor the available catalogue and manage mobile coupon activity.">
    <LinearGradient colors={dark ? ['#1B2543', '#111725', '#111316'] : ['#35458F', '#4C5CB0']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={styles.heroOrbit} />
      <View style={styles.heroTop}><View style={styles.heroIcon}><ShieldCheck size={21} color="#C7D2FF" /></View><View style={styles.accessPill}><View style={styles.accessDot} /><Text style={styles.accessText}>MOBILE ACCESS</Text></View></View>
      <Text style={styles.heroEyebrow}>COMMAND CENTRE</Text>
      <Text style={styles.heroTitle}>Your catalogue,{`\n`}clearly in view.</Text>
      <Text style={styles.heroCopy}>Review what learners can access. Coupon creation is the only publishing action available on mobile.</Text>
      <Pressable onPress={() => router.push('/admin/coupons' as never)} style={({ pressed }) => [styles.heroAction, pressed && styles.pressed]}><Tag size={17} color="#0A1021" /><Text style={styles.heroActionText}>Create coupon</Text><ArrowUpRight size={16} color="#0A1021" /></Pressable>
    </LinearGradient>

    <View style={styles.stats}><AdminStat label="TOTAL ORDER VALUE" value={formatInr(totalOrderValue)} detail={`${adminOrders.length} paid orders`} tone="gold" /><AdminStat label="TOTAL STUDENTS" value={String(adminStudents.length)} detail="Across 3 courses" /><AdminStat label="PUBLISHED NOTES" value={String(paidNotes.length)} detail="Website managed" tone="success" /></View>

    <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.sectionHeading}><View><Text style={[styles.sectionEyebrow, { color: theme.primary }]}>7-DAY SALES</Text><Text style={[styles.sectionTitle, { color: theme.fg }]}>Order volume</Text><Text style={[styles.chartHint, { color: theme.muted }]}>Number of paid orders received each day</Text></View><View style={[styles.chartBadge, { backgroundColor: theme.primarySoft }]}><Text style={[styles.chartBadgeValue, { color: theme.primaryStrong }]}>{orderTrend.reduce((total, count) => total + count, 0)}</Text><Text style={[styles.chartBadgeLabel, { color: theme.muted }]}>ORDERS</Text></View></View>
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

    <View style={[styles.healthCard, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.healthIcon, { backgroundColor: theme.successSoft }]}><CheckCircle2 size={19} color={theme.success} /></View><View style={styles.rowCopy}><Text style={[styles.rowTitle, { color: theme.fg }]}>Commerce is active</Text><Text style={[styles.rowDetail, { color: theme.muted }]}>{activeCoupons} active coupon · {adminOrders.length} receipts available</Text></View></View>
  </AdminShell>;
}

const styles = StyleSheet.create({
  hero: { minHeight: 300, overflow: 'hidden', borderRadius: 24, padding: spacing.xl },
  heroOrbit: { position: 'absolute', width: 210, height: 210, borderRadius: 105, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', right: -88, top: -92 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: { width: 41, height: 41, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  accessPill: { minHeight: 28, borderRadius: radius.pill, backgroundColor: 'rgba(5,8,16,0.25)', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  accessDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#AFC0FF' },
  accessText: { color: '#DCE3FF', fontFamily: font.bold, fontSize: 8, letterSpacing: 1 },
  heroEyebrow: { marginTop: spacing.xl, color: '#9FB3FF', fontFamily: font.bold, fontSize: 9, letterSpacing: 1.4 },
  heroTitle: { marginTop: 5, color: '#FFFFFF', fontFamily: font.extraBold, fontSize: 27, lineHeight: 33, letterSpacing: -0.8 },
  heroCopy: { marginTop: 9, maxWidth: 390, color: 'rgba(255,255,255,0.68)', fontFamily: font.regular, fontSize: 11, lineHeight: 17 },
  heroAction: { alignSelf: 'flex-start', minHeight: 43, marginTop: spacing.lg, borderRadius: 13, paddingHorizontal: 14, backgroundColor: '#9FB3FF', flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroActionText: { color: '#0A1021', fontFamily: font.bold, fontSize: 11 },
  stats: { flexDirection: 'row', gap: spacing.sm },
  chartCard: { borderWidth: 1, borderRadius: 19, padding: 14 },
  chartHint: { marginTop: 3, fontFamily: font.regular, fontSize: 9 },
  chartBadge: { minWidth: 55, height: 49, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  chartBadgeValue: { fontFamily: font.extraBold, fontSize: 17 }, chartBadgeLabel: { marginTop: 1, fontFamily: font.bold, fontSize: 7, letterSpacing: 0.8 },
  chart: { height: 152, marginTop: spacing.lg, flexDirection: 'row', alignItems: 'flex-end', gap: 7 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end' },
  barValue: { marginBottom: 5, fontFamily: font.bold, fontSize: 8 },
  barTrack: { width: '72%', maxWidth: 30, height: 105, overflow: 'hidden', justifyContent: 'flex-end', borderRadius: 9 },
  barFill: { width: '100%', borderRadius: 9 },
  barDay: { marginTop: 5, fontFamily: font.bold, fontSize: 8 }, barDate: { marginTop: 1, fontFamily: font.regular, fontSize: 7 },
  chartLink: { minHeight: 39, marginTop: 12, borderTopWidth: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end', gap: 5 }, chartLinkText: { fontFamily: font.bold, fontSize: 10 },
  permissionCard: { borderWidth: 1, borderRadius: 19, padding: 14 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  sectionEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.25 },
  sectionTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 17, letterSpacing: -0.3 },
  readOnlyPill: { minHeight: 27, borderRadius: radius.pill, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  readOnlyText: { fontFamily: font.bold, fontSize: 8, letterSpacing: 0.8 },
  permissionRow: { minHeight: 67, marginTop: 12, paddingTop: 12, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rowIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0 }, rowTitle: { fontFamily: font.bold, fontSize: 12 }, rowDetail: { marginTop: 3, fontFamily: font.regular, fontSize: 9, lineHeight: 14 }, permissionState: { fontFamily: font.bold, fontSize: 9 },
  catalogueSection: { gap: spacing.sm },
  catalogueCard: { minHeight: 76, borderWidth: 1, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  catalogueIcon: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  catalogueValue: { fontFamily: font.bold, fontSize: 13 },
  healthCard: { minHeight: 72, borderWidth: 1, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  healthIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
});
