import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpRight, ChevronRight, CircleDollarSign, PackageCheck, ReceiptText, Search, ShoppingBag, TrendingUp } from 'lucide-react-native';

import { AdminShell } from '@/components/admin-shell';
import { font, radius, spacing } from '@/constants/theme';
import { adminOrders, formatInr } from '@/lib/demo-admin';
import { useAppTheme } from '@/providers/app-providers';

const courses = ['All', 'JEE', 'CA', 'NEET'] as const;
const periods = ['7D', '30D', 'ALL'] as const;

export default function AdminOrders() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState<(typeof courses)[number]>('All');
  const [period, setPeriod] = useState<(typeof periods)[number]>('30D');
  const paidOrders = adminOrders.filter((order) => order.status === 'Paid');
  const refundedOrders = adminOrders.filter((order) => order.status === 'Refunded');
  const totalValue = paidOrders.reduce((total, order) => total + order.amount, 0);
  const averageValue = Math.round(totalValue / Math.max(paidOrders.length, 1));
  const breakdown = (['JEE', 'CA', 'NEET'] as const).map((name) => {
    const entries = paidOrders.filter((order) => order.course === name);
    return { name, count: entries.length, value: entries.reduce((total, order) => total + order.amount, 0) };
  });
  const maxCategoryValue = Math.max(...breakdown.map((entry) => entry.value), 1);
  const filtered = useMemo(() => adminOrders.filter((order) => {
    const matchesCourse = course === 'All' || order.course === course;
    const needle = query.trim().toLowerCase();
    return matchesCourse && (!needle || `${order.id} ${order.studentName} ${order.email} ${order.item}`.toLowerCase().includes(needle));
  }), [course, query]);

  return <AdminShell eyebrow="COMMERCE" title="Orders" description="Review revenue, course demand and every payment record.">
    <View style={[styles.revenueHero, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={[styles.revenueIcon, { backgroundColor: theme.goldSoft }]}><CircleDollarSign size={22} color={theme.goldStrong} /></View>
      <View style={styles.flex}><Text style={[styles.metricEyebrow, { color: theme.goldStrong }]}>TOTAL PAID VALUE</Text><Text adjustsFontSizeToFit numberOfLines={1} style={[styles.revenueValue, { color: theme.fg }]}>{formatInr(totalValue)}</Text><Text style={[styles.revenueHint, { color: theme.muted }]}>{paidOrders.length} successful orders · {refundedOrders.length} refunded</Text></View>
      <View style={[styles.growthPill, { backgroundColor: theme.successSoft }]}><TrendingUp size={13} color={theme.success} /><Text style={[styles.growthText, { color: theme.success }]}>+12%</Text></View>
    </View>

    <View style={styles.metricRow}>
      <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.metricIcon, { backgroundColor: theme.primarySoft }]}><ReceiptText size={17} color={theme.primaryStrong} /></View><Text style={[styles.metricValue, { color: theme.fg }]}>{paidOrders.length}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>Paid orders</Text></View>
      <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.metricIcon, { backgroundColor: theme.successSoft }]}><ShoppingBag size={17} color={theme.success} /></View><Text adjustsFontSizeToFit numberOfLines={1} style={[styles.metricValue, { color: theme.fg }]}>{formatInr(averageValue)}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>Average order</Text></View>
    </View>

    <View style={[styles.breakdownCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.breakdownHeading}><View style={styles.flex}><Text style={[styles.cardEyebrow, { color: theme.primary }]}>COURSE ANALYTICS</Text><Text style={[styles.cardTitle, { color: theme.fg }]}>Revenue by course</Text><Text style={[styles.cardHint, { color: theme.muted }]}>Successful orders grouped by the learner&apos;s course</Text></View><View style={[styles.periodPicker, { backgroundColor: theme.sunken }]}>{periods.map((item) => <Pressable key={item} onPress={() => setPeriod(item)} style={[styles.periodOption, period === item && { backgroundColor: theme.primarySoft }]}><Text style={[styles.periodText, { color: period === item ? theme.primaryStrong : theme.muted }]}>{item}</Text></Pressable>)}</View></View>
      <View style={[styles.distributionTrack, { backgroundColor: theme.sunken }]}>{breakdown.map((entry) => <View key={entry.name} style={{ width: `${(entry.value / Math.max(totalValue, 1)) * 100}%`, backgroundColor: entry.name === 'JEE' ? theme.primary : entry.name === 'CA' ? theme.gold : theme.success }} />)}</View>
      <View style={styles.breakdownList}>{breakdown.map((entry) => { const color = entry.name === 'JEE' ? theme.primary : entry.name === 'CA' ? theme.gold : theme.success; return <View key={entry.name} style={styles.breakdownRow}><View style={styles.breakdownTop}><View style={[styles.courseDot, { backgroundColor: color }]} /><View style={styles.flex}><Text style={[styles.courseName, { color: theme.fg }]}>{entry.name}</Text><Text style={[styles.breakdownMeta, { color: theme.muted }]}>{entry.count} successful orders</Text></View><Text style={[styles.breakdownValue, { color: theme.fg }]}>{formatInr(entry.value)}</Text></View><View style={[styles.track, { backgroundColor: theme.sunken }]}><View style={[styles.fill, { width: `${(entry.value / maxCategoryValue) * 100}%`, backgroundColor: color }]} /></View></View>; })}</View>
    </View>

    <View style={[styles.searchPanel, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={styles.searchRow}><Search size={18} color={theme.faint} /><TextInput value={query} onChangeText={setQuery} placeholder="Search receipt, student or item" placeholderTextColor={theme.faint} style={[styles.searchInput, { color: theme.fg }]} />{query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')}><Text style={[styles.clearText, { color: theme.primaryStrong }]}>Clear</Text></Pressable> : null}</View><View style={[styles.searchRule, { backgroundColor: theme.line }]} /><View style={styles.filters}>{courses.map((item) => <Pressable key={item} onPress={() => setCourse(item)} style={[styles.filter, { backgroundColor: course === item ? theme.primarySoft : theme.sunken, borderColor: course === item ? theme.primary : 'transparent' }]}><Text style={[styles.filterText, { color: course === item ? theme.primaryStrong : theme.muted }]}>{item}</Text></Pressable>)}</View></View>

    <View style={styles.sectionHeading}><View><Text style={[styles.cardEyebrow, { color: theme.primary }]}>TRANSACTIONS</Text><Text style={[styles.sectionTitle, { color: theme.fg }]}>All orders</Text></View><Text style={[styles.sectionCount, { color: theme.muted }]}>{filtered.length} receipts</Text></View>
    <View style={styles.list}>{filtered.map((order) => { const paid = order.status === 'Paid'; return <Pressable key={order.id} onPress={() => router.push({ pathname: '/admin/orders/[id]' as never, params: { id: order.id } })} style={({ pressed }) => [styles.order, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}>
      <View style={[styles.orderIcon, { backgroundColor: order.itemType === 'Package' ? theme.goldSoft : theme.primarySoft }]}>{order.itemType === 'Package' ? <PackageCheck size={18} color={theme.goldStrong} /> : <ReceiptText size={18} color={theme.primaryStrong} />}</View>
      <View style={styles.orderCopy}><View style={styles.titleRow}><Text numberOfLines={1} style={[styles.orderTitle, { color: theme.fg }]}>{order.item}</Text><View style={[styles.courseTag, { backgroundColor: theme.sunken }]}><Text style={[styles.courseTagText, { color: theme.primaryStrong }]}>{order.course}</Text></View></View><Text numberOfLines={1} style={[styles.orderStudent, { color: theme.muted }]}>{order.studentName} · {order.category}</Text><Text numberOfLines={1} style={[styles.orderMeta, { color: theme.faint }]}>{order.id} · {order.date}</Text></View>
      <View style={styles.amountColumn}><Text style={[styles.amount, { color: theme.fg }]}>{formatInr(order.amount)}</Text><View style={[styles.statusPill, { backgroundColor: paid ? theme.successSoft : theme.dangerSoft }]}><Text style={[styles.statusText, { color: paid ? theme.success : theme.danger }]}>{order.status}</Text></View></View><ChevronRight size={16} color={theme.faint} />
    </Pressable>; })}</View>
    {!filtered.length ? <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.line }]}><ReceiptText size={22} color={theme.faint} /><Text style={[styles.emptyTitle, { color: theme.fg }]}>No matching orders</Text><Text style={[styles.emptyCopy, { color: theme.muted }]}>Change the search or course filter.</Text></View> : null}

    <View style={[styles.exportNotice, { backgroundColor: theme.primarySoft, borderColor: theme.line }]}><View style={styles.flex}><Text style={[styles.exportTitle, { color: theme.primaryStrong }]}>Read-only mobile records</Text><Text style={[styles.exportCopy, { color: theme.muted }]}>Detailed exports remain available in the website workspace.</Text></View><ArrowUpRight size={17} color={theme.primaryStrong} /></View>
  </AdminShell>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 }, revenueHero: { minHeight: 116, borderWidth: 1, borderRadius: 19, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11 }, revenueIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, metricEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.05 }, revenueValue: { marginTop: 2, fontFamily: font.extraBold, fontSize: 25, lineHeight: 31, letterSpacing: -.7 }, revenueHint: { fontFamily: font.regular, fontSize: 8 }, growthPill: { minHeight: 29, borderRadius: radius.pill, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }, growthText: { fontFamily: font.bold, fontSize: 8 },
  metricRow: { flexDirection: 'row', gap: spacing.sm }, metric: { flex: 1, minWidth: 0, minHeight: 89, borderWidth: 1, borderRadius: 16, padding: 11 }, metricIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, metricValue: { marginTop: 7, fontFamily: font.extraBold, fontSize: 16, letterSpacing: -.35 }, metricLabel: { marginTop: 2, fontFamily: font.medium, fontSize: 8 },
  breakdownCard: { borderWidth: 1, borderRadius: 19, padding: 14 }, breakdownHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, cardEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.1 }, cardTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 17, letterSpacing: -.3 }, cardHint: { marginTop: 3, fontFamily: font.regular, fontSize: 8 }, periodPicker: { flexDirection: 'row', borderRadius: 10, padding: 3 }, periodOption: { minWidth: 29, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, periodText: { fontFamily: font.bold, fontSize: 7 }, distributionTrack: { height: 9, marginTop: 16, borderRadius: 5, overflow: 'hidden', flexDirection: 'row' },
  breakdownList: { marginTop: 14, gap: 13 }, breakdownRow: { gap: 6 }, breakdownTop: { flexDirection: 'row', alignItems: 'center', gap: 8 }, courseDot: { width: 8, height: 8, borderRadius: 4 }, courseName: { fontFamily: font.bold, fontSize: 10 }, breakdownMeta: { marginTop: 2, fontFamily: font.regular, fontSize: 7 }, breakdownValue: { fontFamily: font.bold, fontSize: 10 }, track: { height: 6, borderRadius: 3, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 3 },
  searchPanel: { borderWidth: 1, borderRadius: 17, padding: 11 }, searchRow: { minHeight: 35, flexDirection: 'row', alignItems: 'center', gap: 9 }, searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, fontFamily: font.regular, fontSize: 12 }, clearText: { fontFamily: font.bold, fontSize: 9 }, searchRule: { height: 1, marginVertical: 9 }, filters: { flexDirection: 'row', gap: 6 }, filter: { flex: 1, minHeight: 31, borderWidth: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }, filterText: { fontFamily: font.bold, fontSize: 8 },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, sectionTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 17 }, sectionCount: { fontFamily: font.semibold, fontSize: 8 }, list: { gap: spacing.sm }, order: { minHeight: 91, borderWidth: 1, borderRadius: 17, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }, orderIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, orderCopy: { flex: 1, minWidth: 0 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 }, orderTitle: { flex: 1, fontFamily: font.bold, fontSize: 10 }, courseTag: { borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 3 }, courseTagText: { fontFamily: font.bold, fontSize: 7 }, orderStudent: { marginTop: 3, fontFamily: font.regular, fontSize: 8 }, orderMeta: { marginTop: 4, fontFamily: font.regular, fontSize: 7 }, amountColumn: { alignItems: 'flex-end' }, amount: { fontFamily: font.bold, fontSize: 10 }, statusPill: { minHeight: 21, marginTop: 4, borderRadius: radius.pill, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }, statusText: { fontFamily: font.bold, fontSize: 6, letterSpacing: .45 },
  empty: { minHeight: 150, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { marginTop: 8, fontFamily: font.bold, fontSize: 12 }, emptyCopy: { marginTop: 3, fontFamily: font.regular, fontSize: 8 }, exportNotice: { minHeight: 65, borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, exportTitle: { fontFamily: font.bold, fontSize: 10 }, exportCopy: { marginTop: 3, fontFamily: font.regular, fontSize: 8 }, pressed: { opacity: .74, transform: [{ scale: .99 }] },
});
