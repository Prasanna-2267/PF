import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, Clock3, Search, ShoppingBag, UsersRound } from 'lucide-react-native';

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
  const totalRevenue = adminOrders.reduce((total, order) => total + order.amount, 0);

  return <AdminShell eyebrow="LEARNERS" title="Students" description="Study activity and purchase history for every enrolled learner.">
    <View style={styles.summaryRow}>
      <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.line }]}><UsersRound size={18} color={theme.primary} /><Text style={[styles.summaryValue, { color: theme.fg }]}>{adminStudents.length}</Text><Text style={[styles.summaryLabel, { color: theme.muted }]}>Students</Text></View>
      <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.line }]}><Clock3 size={18} color={theme.goldStrong} /><Text style={[styles.summaryValue, { color: theme.fg }]}>{Math.round(totalHours)}h</Text><Text style={[styles.summaryLabel, { color: theme.muted }]}>Study time</Text></View>
      <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.line }]}><ShoppingBag size={18} color={theme.success} /><Text style={[styles.summaryValue, { color: theme.fg }]}>{formatInr(totalRevenue)}</Text><Text style={[styles.summaryLabel, { color: theme.muted }]}>Order value</Text></View>
    </View>

    <View style={[styles.search, { backgroundColor: theme.surface, borderColor: theme.line }]}><Search size={18} color={theme.faint} /><TextInput value={query} onChangeText={setQuery} placeholder="Search students" placeholderTextColor={theme.faint} style={[styles.searchInput, { color: theme.fg }]} /></View>
    <View style={styles.filters}>{courses.map((item) => <Pressable key={item} onPress={() => setCourse(item)} style={[styles.filter, { backgroundColor: course === item ? theme.primarySoft : theme.surface, borderColor: course === item ? theme.primary : theme.line }]}><Text style={[styles.filterText, { color: course === item ? theme.primaryStrong : theme.muted }]}>{item}</Text></Pressable>)}</View>

    <View style={styles.sectionHeading}><View><Text style={[styles.sectionTitle, { color: theme.fg }]}>Learner directory</Text><Text style={[styles.sectionHint, { color: theme.muted }]}>{filtered.length} matching students</Text></View></View>
    <View style={styles.list}>{filtered.map((student) => {
      const orders = ordersForStudent(student.id);
      const spent = orders.reduce((total, order) => total + order.amount, 0);
      const initials = student.name.split(' ').map((part) => part[0]).slice(0, 2).join('');
      return <Pressable key={student.id} onPress={() => router.push({ pathname: '/admin/students/[id]' as never, params: { id: student.id } })} style={({ pressed }) => [styles.studentCard, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}>
        <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}><Text style={[styles.avatarText, { color: theme.primaryStrong }]}>{initials}</Text></View>
        <View style={styles.studentCopy}><View style={styles.nameRow}><Text numberOfLines={1} style={[styles.studentName, { color: theme.fg }]}>{student.name}</Text><View style={[styles.coursePill, { backgroundColor: theme.sunken }]}><Text style={[styles.courseText, { color: theme.primaryStrong }]}>{student.course}</Text></View></View><Text numberOfLines={1} style={[styles.studentMeta, { color: theme.muted }]}>{student.category} · {student.email}</Text><View style={styles.studentMetrics}><Text style={[styles.metricText, { color: theme.muted }]}><Text style={[styles.metricStrong, { color: theme.fg }]}>{student.hoursStudied}h</Text> studied</Text><Text style={[styles.metricText, { color: theme.muted }]}><Text style={[styles.metricStrong, { color: theme.fg }]}>{orders.length}</Text> orders</Text><Text style={[styles.metricStrong, { color: theme.success }]}>{formatInr(spent)}</Text></View></View>
        <ChevronRight size={18} color={theme.faint} />
      </Pressable>;
    })}</View>
    {!filtered.length ? <View style={[styles.empty, { backgroundColor: theme.surface, borderColor: theme.line }]}><UsersRound size={23} color={theme.faint} /><Text style={[styles.emptyTitle, { color: theme.fg }]}>No students found</Text><Text style={[styles.emptyCopy, { color: theme.muted }]}>Try another name, email, or course.</Text></View> : null}
  </AdminShell>;
}

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: spacing.sm }, summary: { flex: 1, minWidth: 0, minHeight: 105, borderWidth: 1, borderRadius: 17, padding: 12 }, summaryValue: { marginTop: 8, fontFamily: font.extraBold, fontSize: 18, letterSpacing: -0.4 }, summaryLabel: { marginTop: 2, fontFamily: font.medium, fontSize: 9 },
  search: { minHeight: 48, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 }, searchInput: { flex: 1, minWidth: 0, paddingVertical: 0, fontFamily: font.regular, fontSize: 13 },
  filters: { flexDirection: 'row', gap: 7 }, filter: { flex: 1, minHeight: 34, borderWidth: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' }, filterText: { fontFamily: font.bold, fontSize: 9 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }, sectionTitle: { fontFamily: font.extraBold, fontSize: 17, letterSpacing: -0.3 }, sectionHint: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, list: { gap: spacing.sm },
  studentCard: { minHeight: 99, borderWidth: 1, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, avatar: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: font.extraBold, fontSize: 12 }, studentCopy: { flex: 1, minWidth: 0 }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, studentName: { flex: 1, fontFamily: font.bold, fontSize: 13 }, coursePill: { borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3 }, courseText: { fontFamily: font.bold, fontSize: 8 }, studentMeta: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, studentMetrics: { marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 10 }, metricText: { fontFamily: font.regular, fontSize: 8 }, metricStrong: { fontFamily: font.bold, fontSize: 9 },
  empty: { minHeight: 170, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }, emptyTitle: { marginTop: 9, fontFamily: font.bold, fontSize: 14 }, emptyCopy: { marginTop: 4, fontFamily: font.regular, fontSize: 10 }, pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
});
