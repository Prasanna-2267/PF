import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, CheckCircle2, CreditCard, FileText, GraduationCap, Mail, PackageCheck, ReceiptText, RefreshCcw, ShieldCheck, UserRound } from 'lucide-react-native';

import { AdminShell } from '@/components/admin-shell';
import { font, radius } from '@/constants/theme';
import { adminOrders, formatInr } from '@/lib/demo-admin';
import { useAppTheme } from '@/providers/app-providers';

export default function AdminOrderReceipt() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const order = adminOrders.find((item) => item.id === params.id) ?? adminOrders[0];
  const paid = order.status === 'Paid';
  const statusColor = paid ? theme.success : theme.danger;
  const statusSoft = paid ? theme.successSoft : theme.dangerSoft;
  const back = <Pressable accessibilityRole="button" accessibilityLabel="Back to orders" onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft size={18} color={theme.fg} /></Pressable>;

  return <AdminShell eyebrow="PAYMENT RECEIPT" title="Receipt details" description={`${order.id} · ${order.date}`} action={back}>
    <LinearGradient colors={paid ? ['#17382F', '#111E1A', '#111416'] : ['#402027', '#21161A', '#111416']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.statusHero}>
      <View style={styles.heroOrbit} /><View style={styles.statusTop}><View style={styles.statusIcon}>{paid ? <CheckCircle2 size={24} color="#79DFB6" /> : <RefreshCcw size={23} color="#FF9AA4" />}</View><View style={styles.statusCopy}><Text style={[styles.statusEyebrow, { color: paid ? '#79DFB6' : '#FF9AA4' }]}>{paid ? 'PAYMENT SUCCESSFUL' : 'PAYMENT REFUNDED'}</Text><Text style={styles.statusAmount}>{formatInr(order.amount)}</Text><Text style={styles.statusDate}>{order.date} · {order.paymentMethod}</Text></View><View style={[styles.statusPill, { borderColor: paid ? 'rgba(121,223,182,.35)' : 'rgba(255,154,164,.35)' }]}><Text style={[styles.statusPillText, { color: paid ? '#79DFB6' : '#FF9AA4' }]}>{order.status.toUpperCase()}</Text></View></View>
      <View style={styles.referenceRow}><ShieldCheck size={13} color="#AEB8C7" /><Text style={styles.referenceText}>Verified transaction · {order.paymentId}</Text></View>
    </LinearGradient>

    <View style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.itemIcon, { backgroundColor: order.itemType === 'Package' ? theme.goldSoft : theme.primarySoft }]}>{order.itemType === 'Package' ? <PackageCheck size={20} color={theme.goldStrong} /> : <FileText size={20} color={theme.primaryStrong} />}</View><View style={styles.flex}><Text style={[styles.cardEyebrow, { color: theme.primary }]}>PURCHASED {order.itemType.toUpperCase()}</Text><Text numberOfLines={2} style={[styles.itemTitle, { color: theme.fg }]}>{order.item}</Text><Text style={[styles.itemMeta, { color: theme.muted }]}>{order.course} · {order.category}</Text></View></View>

    <View style={[styles.receipt, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.receiptHeading}><View><Text style={[styles.cardEyebrow, { color: theme.primary }]}>RECEIPT INFORMATION</Text><Text style={[styles.receiptTitle, { color: theme.fg }]}>Payment record</Text></View><View style={[styles.receiptMark, { backgroundColor: statusSoft }]}><ReceiptText size={18} color={statusColor} /></View></View>
      <View style={[styles.divider, { borderColor: theme.line }]}><View style={[styles.cutoutLeft, { backgroundColor: theme.canvas }]} /><View style={[styles.cutoutRight, { backgroundColor: theme.canvas }]} /></View>
      <ReceiptField icon={UserRound} label="Student" value={order.studentName} />
      <ReceiptField icon={Mail} label="Email address" value={order.email} />
      <ReceiptField icon={GraduationCap} label="Course and category" value={`${order.course} · ${order.category}`} />
      <ReceiptField icon={CreditCard} label="Payment method" value={order.paymentMethod} />
      <ReceiptField icon={ReceiptText} label="Payment ID" value={order.paymentId} mono />
      <View style={[styles.totalRow, { borderTopColor: theme.line }]}><View><Text style={[styles.totalLabel, { color: theme.muted }]}>{paid ? 'Total paid' : 'Amount refunded'}</Text><Text style={[styles.taxNote, { color: theme.faint }]}>Recorded in the mobile workspace</Text></View><Text style={[styles.totalValue, { color: statusColor }]}>{formatInr(order.amount)}</Text></View>
    </View>

    <View style={[styles.notice, { backgroundColor: theme.primarySoft, borderColor: theme.line }]}><View style={[styles.noticeIcon, { backgroundColor: theme.surface }]}><ShieldCheck size={17} color={theme.primaryStrong} /></View><View style={styles.noticeCopy}><Text style={[styles.noticeTitle, { color: theme.primaryStrong }]}>Protected read-only receipt</Text><Text style={[styles.noticeText, { color: theme.muted }]}>Printing, downloading and payment changes remain outside the mobile Admin experience.</Text></View></View>
  </AdminShell>;
}

function ReceiptField({ icon: Icon, label, value, mono = false }: { icon: typeof FileText; label: string; value: string; mono?: boolean }) {
  const { theme } = useAppTheme();
  return <View style={[styles.field, { borderTopColor: theme.line }]}><View style={[styles.fieldIcon, { backgroundColor: theme.sunken }]}><Icon size={15} color={theme.faint} /></View><View style={styles.fieldCopy}><Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text><Text selectable numberOfLines={2} style={[styles.fieldValue, mono && styles.monoValue, { color: theme.fg }]}>{value}</Text></View></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 }, back: { width: 38, height: 38, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusHero: { minHeight: 155, borderRadius: 20, padding: 14, overflow: 'hidden', justifyContent: 'space-between' }, heroOrbit: { position: 'absolute', width: 170, height: 170, borderRadius: 85, borderWidth: 1, borderColor: 'rgba(255,255,255,.07)', right: -62, top: -78 }, statusTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, statusIcon: { width: 47, height: 47, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,.10)', backgroundColor: 'rgba(255,255,255,.06)', alignItems: 'center', justifyContent: 'center' }, statusCopy: { flex: 1, minWidth: 0 }, statusEyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 }, statusAmount: { marginTop: 2, color: '#FFF', fontFamily: font.extraBold, fontSize: 25, letterSpacing: -.7 }, statusDate: { marginTop: 2, color: '#AEB8C7', fontFamily: font.regular, fontSize: 8 }, statusPill: { minHeight: 27, borderRadius: radius.pill, paddingHorizontal: 8, borderWidth: 1, backgroundColor: 'rgba(0,0,0,.16)', alignItems: 'center', justifyContent: 'center' }, statusPillText: { fontFamily: font.bold, fontSize: 7, letterSpacing: .65 }, referenceRow: { minHeight: 29, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,.08)', paddingTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }, referenceText: { color: '#AEB8C7', fontFamily: font.medium, fontSize: 8 },
  itemCard: { minHeight: 86, borderWidth: 1, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, itemIcon: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, cardEyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 }, itemTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 13, lineHeight: 18 }, itemMeta: { marginTop: 3, fontFamily: font.regular, fontSize: 8 },
  receipt: { overflow: 'hidden', borderWidth: 1, borderRadius: 20, padding: 14 }, receiptHeading: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, receiptTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 16 }, receiptMark: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, divider: { position: 'relative', marginTop: 9, marginBottom: 3, borderTopWidth: 1, borderStyle: 'dashed' }, cutoutLeft: { position: 'absolute', width: 20, height: 20, borderRadius: 10, left: -25, top: -10 }, cutoutRight: { position: 'absolute', width: 20, height: 20, borderRadius: 10, right: -25, top: -10 },
  field: { minHeight: 57, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9 }, fieldIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, fieldCopy: { flex: 1, minWidth: 0 }, fieldLabel: { fontFamily: font.regular, fontSize: 7 }, fieldValue: { marginTop: 3, fontFamily: font.bold, fontSize: 10, lineHeight: 14 }, monoValue: { fontFamily: font.semibold, letterSpacing: .2 }, totalRow: { minHeight: 67, marginTop: 5, paddingTop: 14, borderTopWidth: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }, totalLabel: { fontFamily: font.bold, fontSize: 10 }, taxNote: { marginTop: 3, fontFamily: font.regular, fontSize: 7 }, totalValue: { fontFamily: font.extraBold, fontSize: 18 },
  notice: { minHeight: 72, borderWidth: 1, borderRadius: 17, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, noticeIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, noticeCopy: { flex: 1, minWidth: 0 }, noticeTitle: { fontFamily: font.bold, fontSize: 10 }, noticeText: { marginTop: 3, fontFamily: font.regular, fontSize: 8, lineHeight: 13 },
});
