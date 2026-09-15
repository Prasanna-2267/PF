import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ReceiptText } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '@/components/ui';
import { font, spacing } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { orders } from '@/lib/demo-commerce';
import { getReceipt, type Money, type Receipt } from '@/lib/student-content-api';
import { isDemoSession } from '@/lib/student-session';
import { useAppTheme } from '@/providers/app-providers';

export default function ReceiptScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const demo = useAuthStore((state) => isDemoSession(state.accessToken, state.user?.id));
  return demo ? <DemoReceipt id={id} /> : <RemoteReceipt id={id} />;
}

function RemoteReceipt({ id }: { id: string }) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const query = useQuery({ queryKey: ['student', 'receipt', id], queryFn: () => getReceipt(id) });
  if (query.isLoading) return <SafeAreaView style={[styles.safe, styles.center, { backgroundColor: theme.canvas }]}><ActivityIndicator color={theme.primary} /></SafeAreaView>;
  if (!query.data) return <SafeAreaView style={[styles.safe, styles.center, { backgroundColor: theme.canvas }]}><Text style={[styles.sub, { color: theme.muted }]}>Receipt unavailable.</Text><AppButton label="Try again" onPress={() => query.refetch()} /></SafeAreaView>;
  return <ReceiptView receipt={query.data} onBack={() => router.back()} />;
}

function ReceiptView({ receipt, onBack }: { receipt: Receipt; onBack: () => void }) {
  const { theme } = useAppTheme();
  const discount = receipt.totals.discount?.amount ?? 0;
  const payment = receipt.payments[0];
  const refunds = receipt.payments.flatMap((entry) => entry.refunds);
  const refundedTotal = refunds.reduce((sum, refund) => sum + (refund.amount?.amount ?? 0), 0);
  const netPaid = Math.max(0, (receipt.totals.total?.amount ?? 0) - refundedTotal);
  const statusLabel = orderStatus(receipt.status, receipt.refundStatus);
  const isFullyRefunded = receipt.refundStatus === 'FULL' || receipt.status === 'REFUNDED';
  const isPartiallyRefunded = receipt.refundStatus === 'PARTIAL';
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft size={20} color={theme.fg} /></Pressable>
        <View style={styles.heading}><View style={[styles.receiptIcon, { backgroundColor: theme.primarySoft }]}><ReceiptText size={25} color={theme.primary} /></View><Text style={[styles.pageTitle, { color: theme.fg }]}>Receipt</Text><Text style={[styles.sub, { color: theme.muted }]}>{receipt.purchaseType === 'FREE_PURCHASE' ? 'Complimentary purchase' : `Paid purchase · ${receipt.course.name}`}</Text></View>
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={styles.paidRow}><View style={styles.flex}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.receiptNumber, { color: theme.fg }]}>{receipt.receiptNumber ?? receipt.orderNumber}</Text><Text style={[styles.date, { color: theme.muted }]}>{dateTime(receipt.paidAt ?? receipt.createdAt)}</Text></View><View style={[styles.status, { backgroundColor: isFullyRefunded ? theme.dangerSoft : isPartiallyRefunded ? theme.goldSoft : receipt.status === 'PAID' ? theme.successSoft : theme.primarySoft }]}><CheckCircle2 color={isFullyRefunded ? theme.danger : isPartiallyRefunded ? theme.goldStrong : receipt.status === 'PAID' ? theme.success : theme.primary} size={15} /><Text style={[styles.statusText, { color: isFullyRefunded ? theme.danger : isPartiallyRefunded ? theme.goldStrong : receipt.status === 'PAID' ? theme.success : theme.primary }]}>{statusLabel}</Text></View></View>
          <View style={[styles.rule, { backgroundColor: theme.line }]} />
          <Text style={[styles.sectionLabel, { color: theme.primary }]}>BILLED TO</Text>
          <Text style={[styles.customer, { color: theme.fg }]}>{receipt.customer.fullName}</Text>
          <Text style={[styles.metaValue, { color: theme.muted }]}>{receipt.customer.email}</Text>
          {receipt.customer.phone ? <Text style={[styles.metaValue, { color: theme.muted }]}>{receipt.customer.phone}</Text> : null}
          <View style={[styles.metaGrid, { borderTopColor: theme.line }]}>
            <Meta label="ORDER NUMBER" value={receipt.orderNumber} />
            <Meta label="COURSE" value={`${receipt.course.code} · ${receipt.course.name}`} />
            <Meta label="PAYMENT METHOD" value={friendly(receipt.paymentMethod ?? payment?.paymentMethod ?? null)} />
            <Meta label="ACCESS" value={receipt.accessStatus} />
            <Meta label="TRANSACTION REF" value={payment?.providerPaymentId ?? receipt.receiptNumber ?? 'Pending'} />
            <Meta label="REFUND STATUS" value={receipt.refundStatus} />
          </View>
          <Text style={[styles.sectionLabel, styles.itemLabel, { color: theme.primary }]}>ITEMS</Text>
          {receipt.items.map((item) => <View key={item.id} style={[styles.item, { borderTopColor: theme.line }]}><View style={styles.flex}><Text style={[styles.itemTitle, { color: theme.fg }]}>{item.titleSnapshot}</Text><Text style={[styles.itemMeta, { color: theme.muted }]}>{resourceLabel(item.resourceType)} · Qty {item.quantity} × {money(item.unitPrice)}</Text></View><Text style={[styles.itemAmount, { color: theme.fg }]}>{money(item.totalPrice)}</Text></View>)}
          <View style={[styles.totals, { borderTopColor: theme.line }]}><TotalRow label="Actual amount" value={money(receipt.totals.subtotal)} /><TotalRow label={`Coupon discount${receipt.coupons[0] ? ` (${receipt.coupons[0].code})` : ''}`} value={discount ? `−${money(receipt.totals.discount)}` : money(receipt.totals.discount)} success={discount > 0} /><View style={[styles.grandTotal, { borderTopColor: theme.line }]}><Text style={[styles.totalLabel, { color: theme.fg }]}>Total paid</Text><Text style={[styles.totalAmount, { color: theme.fg }]}>{money(receipt.totals.total)}</Text></View>{refundedTotal > 0 ? <TotalRow label="Total refunded" value={`−${money({ amount: refundedTotal, amountMinor: Math.round(refundedTotal * 100), currency: 'INR' })}`} /> : null}{refundedTotal > 0 ? <TotalRow label="Net amount after refund" value={money({ amount: netPaid, amountMinor: Math.round(netPaid * 100), currency: 'INR' })} /> : null}</View>
          {refunds.length ? <View style={[styles.refunds, { backgroundColor: theme.dangerSoft, borderColor: theme.line }]}><Text style={[styles.refundHeading, { color: theme.danger }]}>REFUND DETAILS</Text>{refunds.map((refund) => <View key={refund.id} style={styles.refundRow}><View style={styles.flex}><Text style={[styles.refundAmount, { color: theme.danger }]}>{money(refund.amount)} refunded</Text><Text style={[styles.reference, { color: theme.muted }]}>{refund.reason} · {dateTime(refund.createdAt)}</Text></View><Text style={[styles.refundReference, { color: theme.muted }]}>{refund.providerRefundId}</Text></View>)}</View> : null}
          <View style={[styles.footer, { backgroundColor: theme.sunken, borderTopColor: theme.line }]}><Text style={[styles.reference, { color: theme.muted }]}>Order placed {dateTime(receipt.createdAt)}</Text>{receipt.paidAt ? <Text style={[styles.reference, { color: theme.muted }]}>Paid {dateTime(receipt.paidAt)}</Text> : null}{receipt.refundStatus !== 'NONE' ? <Text style={[styles.refund, { color: theme.danger }]}>Refund: {receipt.refundStatus}</Text> : null}</View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  function Meta({ label, value }: { label: string; value: string }) { return <View style={styles.meta}><Text style={[styles.metaLabel, { color: theme.muted }]}>{label}</Text><Text style={[styles.metaText, { color: theme.fg }]}>{value}</Text></View>; }
  function TotalRow({ label, value, success = false }: { label: string; value: string; success?: boolean }) { return <View style={styles.totalRow}><Text style={[styles.totalLabel, { color: success ? theme.success : theme.muted }]}>{label}</Text><Text style={[styles.totalValue, { color: success ? theme.success : theme.fg }]}>{value}</Text></View>; }
}

function DemoReceipt({ id }: { id: string }) {
  const router = useRouter();
  const { theme } = useAppTheme();
  const order = orders.find((entry) => entry.id === id) ?? orders[0];
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]}><ScrollView contentContainerStyle={styles.content}><Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft size={20} color={theme.fg} /></Pressable><View style={styles.heading}><View style={[styles.receiptIcon, { backgroundColor: theme.primarySoft }]}><ReceiptText size={25} color={theme.primary} /></View><Text style={[styles.pageTitle, { color: theme.fg }]}>Receipt</Text></View><View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}><Text style={[styles.receiptNumber, { color: theme.fg }]}>{order.id}</Text><Text style={[styles.date, { color: theme.muted }]}>{order.date}</Text><View style={[styles.rule, { backgroundColor: theme.line }]} /><Text style={[styles.itemTitle, { color: theme.fg }]}>{order.items}</Text><View style={[styles.grandTotal, { borderTopColor: theme.line }]}><Text style={[styles.totalLabel, { color: theme.muted }]}>Total paid</Text><Text style={[styles.totalAmount, { color: theme.fg }]}>{order.amount}</Text></View></View></ScrollView></SafeAreaView>;
}

function money(value: Money) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: value?.currency ?? 'INR', maximumFractionDigits: 2 }).format(value?.amount ?? 0); }
function dateTime(value: string) { return new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }); }
function friendly(value: string | null) { return value ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : 'Not recorded'; }
function resourceLabel(value: string) { return ({ PACKAGE: 'Study package', PREMIUM_NOTES: 'Premium note', QUESTION_BANK: 'Question Bank', MONTHLY_REPORT: 'Monthly report' }[value] ?? friendly(value)); }
function orderStatus(status: string, refundStatus?: string) { if (refundStatus === 'FULL' || status === 'REFUNDED') return 'Refunded'; if (refundStatus === 'PARTIAL') return 'Partially Refunded'; return friendly(status); }

const styles = StyleSheet.create({
  safe: { flex: 1 }, center: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 12 }, content: { padding: spacing.lg, paddingBottom: 48, gap: spacing.lg, maxWidth: 680, width: '100%', alignSelf: 'center' }, flex: { flex: 1, minWidth: 0 },
  back: { width: 42, height: 42, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, heading: { alignItems: 'center', gap: 5 }, receiptIcon: { width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, pageTitle: { fontFamily: font.extraBold, fontSize: 29 }, sub: { fontFamily: font.regular, fontSize: 12, textAlign: 'center' },
  card: { overflow: 'hidden', borderWidth: 1, borderRadius: 20 }, paidRow: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }, receiptNumber: { fontFamily: font.bold, fontSize: 15 }, date: { fontFamily: font.regular, fontSize: 11, marginTop: 4 }, status: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 }, statusText: { fontFamily: font.bold, fontSize: 10 }, rule: { height: 1, marginHorizontal: 16 },
  sectionLabel: { marginTop: 16, marginHorizontal: 16, fontFamily: font.extraBold, fontSize: 9, letterSpacing: 1.1 }, customer: { marginTop: 8, marginHorizontal: 16, fontFamily: font.bold, fontSize: 15 }, metaValue: { marginTop: 3, marginHorizontal: 16, fontFamily: font.regular, fontSize: 11 }, metaGrid: { marginTop: 16, padding: 16, borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', rowGap: 16 }, meta: { width: '50%', paddingRight: 10, gap: 4 }, metaLabel: { fontFamily: font.bold, fontSize: 8, letterSpacing: .7 }, metaText: { fontFamily: font.semibold, fontSize: 11, lineHeight: 16 }, itemLabel: { marginTop: 3, marginBottom: 6 }, item: { minHeight: 67, marginHorizontal: 16, paddingVertical: 13, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }, itemTitle: { fontFamily: font.bold, fontSize: 13, lineHeight: 18 }, itemMeta: { marginTop: 4, fontFamily: font.regular, fontSize: 9 }, itemAmount: { fontFamily: font.bold, fontSize: 12 },
  totals: { margin: 4, marginTop: 10, padding: 14, borderTopWidth: 1, gap: 10 }, totalRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 }, totalLabel: { fontFamily: font.regular, fontSize: 12 }, totalValue: { fontFamily: font.bold, fontSize: 12 }, grandTotal: { marginTop: 4, paddingTop: 14, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, totalAmount: { fontFamily: font.extraBold, fontSize: 22 }, refunds: { marginHorizontal: 14, marginBottom: 14, padding: 13, borderWidth: 1, borderRadius: 13, gap: 10 }, refundHeading: { fontFamily: font.extraBold, fontSize: 9, letterSpacing: .8 }, refundRow: { gap: 7 }, refundAmount: { fontFamily: font.bold, fontSize: 12 }, refundReference: { fontFamily: font.regular, fontSize: 8 }, footer: { padding: 14, borderTopWidth: 1, gap: 4 }, reference: { fontFamily: font.regular, fontSize: 9 }, refund: { fontFamily: font.bold, fontSize: 9 },
});
