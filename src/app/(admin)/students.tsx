import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock3, Flame, Search, ShoppingBag, Sparkles, UsersRound } from 'lucide-react-native';

import { AdminShell } from '@/components/admin-shell';
import { font, radius, spacing } from '@/constants/theme';
import { adminOrders, adminStudents, formatInr, ordersForStudent } from '@/lib/demo-admin';
import { useAppTheme } from '@/providers/app-providers';

const courses = ['All', 'JEE', 'CA', 'NEET'] as const;

export default function AdminStudents() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState<(typeof courses)[number]>('All');
  const filtered = useMemo(() => adminStudents.filter((student) => {
    const matchesCourse = course === 'All' || student.course === course;
    const needle = query.trim().toLowerCase();
    return matchesCourse && (!needle || `${student.name} ${student.email} ${student.course} ${student.category}`.toLowerCase().includes(needle));
  }), [course, query]);
  const totalHours = adminStudents.reduce((total, student) => total + student.hoursStudied, 0);
  const paidRevenue = adminOrders.filter((order) => order.status === 'Paid').reduce((total, order) => total + order.amount, 0);
  const activeToday = adminStudents.filter((student) => student.lastActive.startsWith('Today')).length;

  return <AdminShell eyebrow="LEARNERS" title="Students" description="Understand every learner's study rhythm and account activity.">
    <View style={[styles.summaryHero, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={[styles.summaryIcon, { backgroundColor: theme.primarySoft }]}><UsersRound size={22} color={theme.primaryStrong} /></View>
      <View style={styles.summaryCopy}><Text style={[styles.summaryEyebrow, { color: theme.primary }]}>ENROLLED LEARNERS</Text><Text style={[styles.summaryValue, { color: theme.fg }]}>{adminStudents.length}</Text><Text style={[styles.summaryHint, { color: theme.muted }]}>{activeToday} active today across 3 courses</Text></View>
      <View style={[styles.activeBadge, { backgroundColor: theme.successSoft }]}><Sparkles size={13} color={theme.success} /><Text style={[styles.activeText, { color: theme.success }]}>ACTIVE</Text></View>
    </View>

    <View style={styles.secondarySummary}>
      <View style={[styles.summaryMini, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.miniIcon, { backgroundColor: theme.goldSoft }]}><Clock3 size={17} color={theme.goldStrong} /></View><View style={styles.miniCopy}><Text style={[styles.miniValue, { color: theme.fg }]}>{Math.round(totalHours)}h</Text><Text style={[styles.miniLabel, { color: theme.muted }]}>Combined focus</Text></View></View>
      <View style={[styles.summaryMini, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.miniIcon, { backgroundColor: theme.successSoft }]}><ShoppingBag size={17} color={theme.success} /></View><View style={styles.miniCopy}><Text adjustsFontSizeToFit numberOfLines={1} style={[styles.miniValue, { color: theme.fg }]}>{formatInr(paidRevenue)}</Text><Text style={[styles.miniLabel, { color: theme.muted }]}>Paid order value</Text></View></View>
    </View>

    <View style={[styles.searchPanel, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.searchRow}><Search size={18} color={theme.faint} /><TextInput value={query} onChangeText={setQuery} placeholder="Search name, email or course" placeholderTextColor={theme.faint} style={[styles.searchInput, { color: theme.fg }]} />{query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')}><Text style={[styles.clearText, { color: theme.primaryStrong }]}>Clear</Text></Pressable> : null}</View>
      <View style={[styles.searchRule, { backgroundColor: theme.line }]} />
      <View style={styles.filters}>{courses.map((item) => <Pressable key={item} onPress={() => setCourse(item)} style={[styles.filter, { backgroundColor: course === item ? theme.primarySoft : theme.sunken, borderColor: course === item ? theme.primary : 'transparent' }]}><Text style={[styles.filterText, { color: course === item ? theme.primaryStrong : theme.muted }]}>{item}</Text></Pressable>)}</View>
    </View>

    <View style={styles.sectionHeading}><View><Text style={[styles.sectionEyebrow, { color: theme.primary }]}>DIRECTORY</Text><Text style={[styles.sectionTitle, { color: theme.fg }]}>Learner accounts</Text></View><Text style={[styles.resultCount, { color: theme.muted }]}>{filtered.length} shown</Text></View>
    <View style={styles.list}>{filtered.map((student) => {
      const orders = ordersForStudent(student.id);
      const spent = orders.filter((order) => order.status === 'Paid').reduce((total, order) => total + order.amount, 0);
      const initials = student.name.split(' ').map((part) => part[0]).slice(0, 2).join('');
      const active = student.lastActive.startsWith('Today');
      return <Pressable key={student.id} onPress={() => router.push({ pathname: '/admin/students/[id]' as never, params: { id: student.id } })} style={({ pressed }) => [styles.studentCard, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}>
        <View style={styles.avatarWrap}><View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}><Text style={[styles.avatarText, { color: theme.primaryStrong }]}>{initials}</Text></View>{active ? <View style={[styles.onlineDot, { backgroundColor: theme.success, borderColor: theme.surface }]} /> : null}</View>
        <View style={styles.studentCopy}>
          <View style={styles.nameRow}><Text numberOfLines={1} style={[styles.studentName, { color: theme.fg }]}>{student.name}</Text><View style={[styles.coursePill, { backgroundColor: theme.sunken }]}><Text numberOfLines={1} style={[styles.courseText, { color: theme.primaryStrong }]}>{student.course} · {student.category}</Text></View></View>
          <Text numberOfLines={1} style={[styles.studentMeta, { color: theme.muted }]}>{student.email}</Text>
          <View style={[styles.studentMetrics, { borderTopColor: theme.line }]}><View style={styles.metricItem}><Clock3 size={12} color={theme.primaryStrong} /><Text style={[styles.metricText, { color: theme.muted }]}><Text style={[styles.metricStrong, { color: theme.fg }]}>{student.hoursStudied}h</Text> focus</Text></View><View style={styles.metricItem}><ShoppingBag size={12} color={theme.goldStrong} /><Text style={[styles.metricText, { color: theme.muted }]}>{orders.length} orders</Text></View><View style={styles.metricItem}><Flame size={12} color={theme.goldStrong} fill={theme.goldStrong} /><Text style={[styles.metricText, { color: theme.muted }]}>{student.streakDays}d</Text></View><Text style={[styles.spent, { color: theme.success }]}>{formatInr(spent)}</Text></View>
        </View>
        <ChevronRight size={17} color={theme.faint} />
      </Pressable>;
    })}</View>
    {!filtered.length ? <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.emptyIcon, { backgroundColor: theme.sunken }]}><UsersRound size={22} color={theme.faint} /></View><Text style={[styles.emptyTitle, { color: theme.fg }]}>No students found</Text><Text style={[styles.emptyCopy, { color: theme.muted }]}>Try another name, email, or course filter.</Text></View> : null}
  </AdminShell>;
}

const styles = StyleSheet.create({
  summaryHero: { minHeight: 118, borderWidth: 1, borderRadius: 19, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden' },
  summaryIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, summaryCopy: { flex: 1, minWidth: 0 }, summaryEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.1 }, summaryValue: { marginTop: 2, fontFamily: font.extraBold, fontSize: 28, lineHeight: 34, letterSpacing: -.8 }, summaryHint: { fontFamily: font.regular, fontSize: 9 },
  activeBadge: { minHeight: 28, borderRadius: radius.pill, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }, activeText: { fontFamily: font.bold, fontSize: 7, letterSpacing: .7 },
  secondarySummary: { flexDirection: 'row', gap: spacing.sm }, summaryMini: { flex: 1, minWidth: 0, minHeight: 72, borderWidth: 1, borderRadius: 16, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 9 }, miniIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, miniCopy: { flex: 1, minWidth: 0 }, miniValue: { fontFamily: font.extraBold, fontSize: 14 }, miniLabel: { marginTop: 2, fontFamily: font.regular, fontSize: 7 },
  searchPanel: { borderWidth: 1, borderRadius: 17, padding: 11 }, searchRow: { minHeight: 35, flexDirection: 'row', alignItems: 'center', gap: 9 }, searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, fontFamily: font.regular, fontSize: 12 }, clearText: { fontFamily: font.bold, fontSize: 9 }, searchRule: { height: 1, marginVertical: 9 },
  filters: { flexDirection: 'row', gap: 6 }, filter: { flex: 1, minHeight: 31, borderWidth: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }, filterText: { fontFamily: font.bold, fontSize: 8 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }, sectionEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.1 }, sectionTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 17, letterSpacing: -.3 }, resultCount: { fontFamily: font.semibold, fontSize: 9 }, list: { gap: spacing.sm },
  studentCard: { minHeight: 112, borderWidth: 1, borderRadius: 17, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, avatarWrap: { position: 'relative' }, avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: font.extraBold, fontSize: 12 }, onlineDot: { position: 'absolute', right: -2, bottom: -1, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  studentCopy: { flex: 1, minWidth: 0 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 }, studentName: { flex: 1, fontFamily: font.bold, fontSize: 12 }, coursePill: { maxWidth: '48%', borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3 }, courseText: { fontFamily: font.bold, fontSize: 7 }, studentMeta: { marginTop: 3, fontFamily: font.regular, fontSize: 8 },
  studentMetrics: { minHeight: 33, marginTop: 8, paddingTop: 8, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }, metricItem: { flexDirection: 'row', alignItems: 'center', gap: 3 }, metricText: { fontFamily: font.regular, fontSize: 7 }, metricStrong: { fontFamily: font.bold, fontSize: 8 }, spent: { marginLeft: 'auto', fontFamily: font.bold, fontSize: 8 },
  empty: { minHeight: 170, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }, emptyIcon: { width: 45, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { marginTop: 9, fontFamily: font.bold, fontSize: 13 }, emptyCopy: { marginTop: 4, fontFamily: font.regular, fontSize: 9 }, pressed: { opacity: .74, transform: [{ scale: .99 }] },
});
