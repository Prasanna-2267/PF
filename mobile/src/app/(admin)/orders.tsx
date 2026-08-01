import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, ReceiptText, Search, ShoppingBag, TrendingUp } from 'lucide-react-native';

import { AdminShell } from '@/components/admin-shell';
import { font, radius, spacing } from '@/constants/theme';
import { adminOrders, formatInr } from '@/lib/demo-admin';
import { useAppTheme } from '@/providers/app-providers';

const courses = ['All', 'JEE', 'CA', 'NEET'] as const;

export default function AdminOrders() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState<(typeof courses)[number]>('All');
  const totalValue = adminOrders.reduce((total, order) => total + order.amount, 0);
  const averageValue = Math.round(totalValue / Math.max(adminOrders.length, 1));
  const breakdown = (['JEE', 'CA', 'NEET'] as const).map((name) => {
    const entries = adminOrders.filter((order) => order.course === name);
    return { name, count: entries.length, value: entries.reduce((total, order) => total + order.amount, 0) };
  });
  const maxCategoryValue = Math.max(...breakdown.map((entry) => entry.value), 1);
  const filtered = useMemo(() => adminOrders.filter((order) => {
    const matchesCourse = course === 'All' || order.course === course;
    const needle = query.trim().toLowerCase();
    return matchesCourse && (!needle || `${order.id} ${order.studentName} ${order.email} ${order.item}`.toLowerCase().includes(needle));
  }), [course, query]);

  return <AdminShell eyebrow="COMMERCE" title="Orders" description="All transactions, course performance, and receipt records.">
    <View style={styles.metrics}>
      <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}><ShoppingBag size={18} color={theme.goldStrong} /><Text style={[styles.metricValue, { color: theme.fg }]}>{formatInr(totalValue)}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>Order value</Text></View>
      <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}><ReceiptText size={18} color={theme.primary} /><Text style={[styles.metricValue, { color: theme.fg }]}>{adminOrders.length}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>Paid orders</Text></View>
      <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}><TrendingUp size={18} color={theme.success} /><Text style={[styles.metricValue, { color: theme.fg }]}>{formatInr(averageValue)}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>Average value</Text></View>
    </View>

    <View style={[styles.breakdownCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.cardEyebrow, { color: theme.primary }]}>COURSE-WISE ORDERS</Text><Text style={[styles.cardTitle, { color: theme.fg }]}>Revenue distribution</Text><Text style={[styles.cardHint, { color: theme.muted }]}>Paid orders grouped by the learner’s selected course</Text>
      <View style={styles.breakdownList}>{breakdown.map((entry) => <View key={entry.name} style={styles.breakdownRow}><View style={styles.breakdownTop}><View style={[styles.courseBadge, { backgroundColor: theme.primarySoft }]}><Text style={[styles.courseBadgeText, { color: theme.primaryStrong }]}>{entry.name}</Text></View><Text style={[styles.breakdownMeta, { color: theme.muted }]}>{entry.count} orders</Text><Text style={[styles.breakdownValue, { color: theme.fg }]}>{formatInr(entry.value)}</Text></View><View style={[styles.track, { backgroundColor: theme.sunken }]}><View style={[styles.fill, { width: `${(entry.value / maxCategoryValue) * 100}%`, backgroundColor: entry.name === 'JEE' ? theme.primary : entry.name === 'CA' ? theme.gold : theme.success }]} /></View></View>)}</View>
    </View>

    <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.line }]}><Search size={18} color={theme.faint} /><TextInput value={query} onChangeText={setQuery} placeholder="Search order, student, or item" placeholderTextColor={theme.faint} style={[styles.searchInput, { color: theme.fg }]} /></View>
    <View style={styles.filters}>{courses.map((item) => <Pressable key={item} onPress={() => setCourse(item)} style={[styles.filter, { backgroundColor: course === item ? theme.primarySoft : theme.surface, borderColor: course === item ? theme.primary : theme.line }]}><Text style={[styles.filterText, { color: course === item ? theme.primaryStrong : theme.muted }]}>{item}</Text></Pressable>)}</View>

    <View><Text style={[styles.sectionTitle, { color: theme.fg }]}>All orders</Text><Text style={[styles.sectionHint, { color: theme.muted }]}>{filtered.length} receipts available</Text></View>
    <View style={styles.list}>{filtered.map((order) => <Pressable key={order.id} onPress={() => router.push({ pathname: '/admin/orders/[id]' as never, params: { id: order.id } })} style={({ pressed }) => [styles.order, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}>
      <View style={[styles.orderIcon, { backgroundColor: order.itemType === 'Package' ? theme.goldSoft : theme.primarySoft }]}><ReceiptText size={19} color={order.itemType === 'Package' ? theme.goldStrong : theme.primaryStrong} /></View>
      <View style={styles.orderCopy}><View style={styles.titleRow}><Text numberOfLines={1} style={[styles.orderTitle, { color: theme.fg }]}>{order.item}</Text><View style={[styles.courseTag, { backgroundColor: theme.sunken }]}><Text style={[styles.courseTagText, { color: theme.primaryStrong }]}>{order.course}</Text></View></View><Text numberOfLines={1} style={[styles.orderStudent, { color: theme.muted }]}>{order.studentName} · {order.category}</Text><Text style={[styles.orderMeta, { color: theme.faint }]}>{order.id} · {order.date}</Text></View>
      <View style={styles.amountColumn}><Text style={[styles.amount, { color: theme.fg }]}>{formatInr(order.amount)}</Text><Text style={[styles.paid, { color: theme.success }]}>{order.status}</Text></View><ChevronRight size={17} color={theme.faint} />
    </Pressable>)}</View>
  </AdminShell>;
}

const styles = StyleSheet.create({
  metrics: { flexDirection: 'row', gap: spacing.sm }, metric: { flex: 1, minWidth: 0, minHeight: 106, borderWidth: 1, borderRadius: 17, padding: 12 }, metricValue: { marginTop: 8, fontFamily: font.extraBold, fontSize: 17, letterSpacing: -0.45 }, metricLabel: { marginTop: 2, fontFamily: font.medium, fontSize: 8 },
  breakdownCard: { borderWidth: 1, borderRadius: 19, padding: 14 }, cardEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, cardTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 18, letterSpacing: -0.35 }, cardHint: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, breakdownList: { marginTop: spacing.lg, gap: 15 }, breakdownRow: { gap: 7 }, breakdownTop: { flexDirection: 'row', alignItems: 'center', gap: 8 }, courseBadge: { minWidth: 46, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' }, courseBadgeText: { fontFamily: font.bold, fontSize: 8 }, breakdownMeta: { flex: 1, fontFamily: font.regular, fontSize: 9 }, breakdownValue: { fontFamily: font.bold, fontSize: 11 }, track: { height: 8, borderRadius: radius.pill, overflow: 'hidden' }, fill: { height: '100%', borderRadius: radius.pill },
  search: { minHeight: 48, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 }, searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, fontFamily: font.regular, fontSize: 13 }, filters: { flexDirection: 'row', gap: 7 }, filter: { flex: 1, minHeight: 34, borderWidth: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }, filterText: { fontFamily: font.bold, fontSize: 9 },
  sectionTitle: { fontFamily: font.extraBold, fontSize: 17 }, sectionHint: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, list: { gap: spacing.sm }, order: { minHeight: 91, borderWidth: 1, borderRadius: 17, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, orderIcon: { width: 41, height: 41, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, orderCopy: { flex: 1, minWidth: 0 }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, orderTitle: { flex: 1, fontFamily: font.bold, fontSize: 11 }, courseTag: { borderRadius: radius.pill, paddingHorizontal: 6, paddingVertical: 3 }, courseTagText: { fontFamily: font.bold, fontSize: 7 }, orderStudent: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, orderMeta: { marginTop: 4, fontFamily: font.regular, fontSize: 8 }, amountColumn: { alignItems: 'flex-end' }, amount: { fontFamily: font.bold, fontSize: 11 }, paid: { marginTop: 3, fontFamily: font.bold, fontSize: 8 }, pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
});
