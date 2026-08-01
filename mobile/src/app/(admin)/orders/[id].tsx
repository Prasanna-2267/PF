import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, CreditCard, FileText, GraduationCap, Mail, ReceiptText, UserRound } from 'lucide-react-native';

import { AdminShell } from '@/components/admin-shell';
import { font, spacing } from '@/constants/theme';
import { adminOrders, formatInr } from '@/lib/demo-admin';
import { useAppTheme } from '@/providers/app-providers';

export default function AdminOrderReceipt() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const order = adminOrders.find((item) => item.id === params.id) ?? adminOrders[0];
  const back = <Pressable accessibilityRole="button" accessibilityLabel="Back to orders" onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft size={19} color={theme.fg} /></Pressable>;

  return <AdminShell eyebrow="PAYMENT RECEIPT" title={order.id} description={`${order.date} · ${order.status}`} action={back}>
    <View style={[styles.receipt, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.receiptTop}><View style={[styles.receiptIcon, { backgroundColor: theme.successSoft }]}><CheckCircle2 size={25} color={theme.success} /></View><View style={styles.receiptTopCopy}><Text style={[styles.statusLabel, { color: theme.success }]}>PAYMENT SUCCESSFUL</Text><Text style={[styles.amount, { color: theme.fg }]}>{formatInr(order.amount)}</Text></View></View>
      <View style={[styles.divider, { borderColor: theme.line }]} />
      <ReceiptField icon={FileText} label="Purchased item" value={order.item} />
      <ReceiptField icon={UserRound} label="Student" value={order.studentName} />
      <ReceiptField icon={Mail} label="Email" value={order.email} />
      <ReceiptField icon={GraduationCap} label="Course and category" value={`${order.course} · ${order.category}`} />
      <ReceiptField icon={CreditCard} label="Payment method" value={order.paymentMethod} />
      <ReceiptField icon={ReceiptText} label="Payment ID" value={order.paymentId} />
      <View style={[styles.totalRow, { borderTopColor: theme.line }]}><Text style={[styles.totalLabel, { color: theme.muted }]}>Total paid</Text><Text style={[styles.totalValue, { color: theme.fg }]}>{formatInr(order.amount)}</Text></View>
    </View>
    <View style={[styles.notice, { backgroundColor: theme.primarySoft, borderColor: theme.line }]}><ReceiptText size={18} color={theme.primaryStrong} /><View style={styles.noticeCopy}><Text style={[styles.noticeTitle, { color: theme.primaryStrong }]}>Receipt available in-app</Text><Text style={[styles.noticeText, { color: theme.muted }]}>This is a read-only payment record. Printing and downloading are not exposed in the mobile admin.</Text></View></View>
  </AdminShell>;
}

function ReceiptField({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) {
  const { theme } = useAppTheme();
  return <View style={styles.field}><View style={[styles.fieldIcon, { backgroundColor: theme.sunken }]}><Icon size={16} color={theme.faint} /></View><View style={styles.fieldCopy}><Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text><Text selectable style={[styles.fieldValue, { color: theme.fg }]}>{value}</Text></View></View>;
}

const styles = StyleSheet.create({
  back: { width: 39, height: 39, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, receipt: { borderWidth: 1, borderRadius: 21, padding: spacing.lg }, receiptTop: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12 }, receiptIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, receiptTopCopy: { flex: 1 }, statusLabel: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.1 }, amount: { marginTop: 4, fontFamily: font.extraBold, fontSize: 27, letterSpacing: -0.7 }, divider: { marginVertical: 12, borderTopWidth: 1, borderStyle: 'dashed' }, field: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 10 }, fieldIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, fieldCopy: { flex: 1, minWidth: 0 }, fieldLabel: { fontFamily: font.regular, fontSize: 8 }, fieldValue: { marginTop: 3, fontFamily: font.bold, fontSize: 11 }, totalRow: { minHeight: 62, marginTop: 9, paddingTop: 15, borderTopWidth: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, totalLabel: { fontFamily: font.medium, fontSize: 11 }, totalValue: { fontFamily: font.extraBold, fontSize: 18 }, notice: { borderWidth: 1, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }, noticeCopy: { flex: 1 }, noticeTitle: { fontFamily: font.bold, fontSize: 11 }, noticeText: { marginTop: 3, fontFamily: font.regular, fontSize: 9, lineHeight: 14 },
});
