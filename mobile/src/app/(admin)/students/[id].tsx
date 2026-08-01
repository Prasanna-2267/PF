import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Clock3, GraduationCap, Mail, Phone, ReceiptText, ShoppingBag } from 'lucide-react-native';

import { AdminShell } from '@/components/admin-shell';
import { font, radius, spacing } from '@/constants/theme';
import { adminStudents, formatInr, ordersForStudent } from '@/lib/demo-admin';
import { useAppTheme } from '@/providers/app-providers';

export default function AdminStudentDetail() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const student = adminStudents.find((item) => item.id === params.id) ?? adminStudents[0];
  const orders = ordersForStudent(student.id);
  const totalSpent = orders.reduce((total, order) => total + order.amount, 0);
  const initials = student.name.split(' ').map((part) => part[0]).slice(0, 2).join('');

  const back = <Pressable accessibilityRole="button" accessibilityLabel="Back to students" onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft size={19} color={theme.fg} /></Pressable>;

  return <AdminShell eyebrow="STUDENT PROFILE" title={student.name} description={`${student.course} · ${student.category} · joined ${student.joinedOn}`} action={back}>
    <View style={[styles.profileCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}><Text style={[styles.avatarText, { color: theme.primaryStrong }]}>{initials}</Text></View>
      <View style={styles.profileCopy}><Text style={[styles.profileName, { color: theme.fg }]}>{student.name}</Text><Text style={[styles.profileId, { color: theme.muted }]}>{student.id} · Active {student.lastActive}</Text></View>
      <View style={[styles.coursePill, { backgroundColor: theme.primarySoft }]}><Text style={[styles.courseText, { color: theme.primaryStrong }]}>{student.course}</Text></View>
      <View style={[styles.contactRow, { borderTopColor: theme.line }]}><Mail size={16} color={theme.faint} /><Text numberOfLines={1} style={[styles.contactText, { color: theme.muted }]}>{student.email}</Text></View>
      <View style={styles.contactRow}><Phone size={16} color={theme.faint} /><Text style={[styles.contactText, { color: theme.muted }]}>{student.phone}</Text></View>
    </View>

    <View style={styles.metrics}>
      <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}><Clock3 size={18} color={theme.primary} /><Text style={[styles.metricValue, { color: theme.fg }]}>{student.hoursStudied}h</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>Hours studied</Text></View>
      <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}><ShoppingBag size={18} color={theme.goldStrong} /><Text style={[styles.metricValue, { color: theme.fg }]}>{orders.length}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>Orders placed</Text></View>
      <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}><ReceiptText size={18} color={theme.success} /><Text style={[styles.metricValue, { color: theme.fg }]}>{formatInr(totalSpent)}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>Total spent</Text></View>
    </View>

    <View style={[styles.courseCard, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.courseIcon, { backgroundColor: theme.goldSoft }]}><GraduationCap size={20} color={theme.goldStrong} /></View><View style={styles.profileCopy}><Text style={[styles.cardEyebrow, { color: theme.goldStrong }]}>LEARNING TRACK</Text><Text style={[styles.cardTitle, { color: theme.fg }]}>{student.course} · {student.category}</Text><Text style={[styles.cardDetail, { color: theme.muted }]}>{student.hoursStudied} focused hours recorded</Text></View></View>

    <View><Text style={[styles.sectionTitle, { color: theme.fg }]}>Order history</Text><Text style={[styles.sectionHint, { color: theme.muted }]}>{orders.length ? `${orders.length} receipts available` : 'No orders placed'}</Text></View>
    <View style={styles.list}>{orders.map((order) => <Pressable key={order.id} onPress={() => router.push({ pathname: '/admin/orders/[id]' as never, params: { id: order.id } })} style={({ pressed }) => [styles.orderRow, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.orderIcon, { backgroundColor: theme.primarySoft }]}><ReceiptText size={18} color={theme.primaryStrong} /></View><View style={styles.orderCopy}><Text numberOfLines={1} style={[styles.orderTitle, { color: theme.fg }]}>{order.item}</Text><Text style={[styles.orderMeta, { color: theme.muted }]}>{order.id} · {order.date}</Text></View><View style={styles.orderAmount}><Text style={[styles.amount, { color: theme.fg }]}>{formatInr(order.amount)}</Text><Text style={[styles.paid, { color: theme.success }]}>{order.status}</Text></View><ChevronRight size={17} color={theme.faint} /></Pressable>)}</View>
  </AdminShell>;
}

const styles = StyleSheet.create({
  back: { width: 39, height: 39, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  profileCard: { borderWidth: 1, borderRadius: 19, padding: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }, avatar: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: font.extraBold, fontSize: 15 }, profileCopy: { flex: 1, minWidth: 0 }, profileName: { fontFamily: font.extraBold, fontSize: 16 }, profileId: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, coursePill: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 }, courseText: { fontFamily: font.bold, fontSize: 9 }, contactRow: { width: '100%', minHeight: 31, flexDirection: 'row', alignItems: 'center', gap: 8 }, contactText: { flex: 1, fontFamily: font.regular, fontSize: 10 },
  metrics: { flexDirection: 'row', gap: spacing.sm }, metric: { flex: 1, minWidth: 0, minHeight: 105, borderWidth: 1, borderRadius: 17, padding: 12 }, metricValue: { marginTop: 8, fontFamily: font.extraBold, fontSize: 17, letterSpacing: -0.4 }, metricLabel: { marginTop: 2, fontFamily: font.medium, fontSize: 8 },
  courseCard: { minHeight: 82, borderWidth: 1, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }, courseIcon: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, cardEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1 }, cardTitle: { marginTop: 3, fontFamily: font.bold, fontSize: 13 }, cardDetail: { marginTop: 3, fontFamily: font.regular, fontSize: 9 },
  sectionTitle: { fontFamily: font.extraBold, fontSize: 17 }, sectionHint: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, list: { gap: spacing.sm }, orderRow: { minHeight: 76, borderWidth: 1, borderRadius: 16, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, orderIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, orderCopy: { flex: 1, minWidth: 0 }, orderTitle: { fontFamily: font.bold, fontSize: 11 }, orderMeta: { marginTop: 3, fontFamily: font.regular, fontSize: 8 }, orderAmount: { alignItems: 'flex-end' }, amount: { fontFamily: font.bold, fontSize: 11 }, paid: { marginTop: 3, fontFamily: font.bold, fontSize: 8 }, pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
});
