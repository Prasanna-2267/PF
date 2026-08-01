import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, ChevronRight, Clock3, FileText, Gift, GraduationCap, Mail, Phone, Plus, ReceiptText, ShoppingBag, X } from 'lucide-react-native';

import { AdminShell } from '@/components/admin-shell';
import { font, radius, spacing } from '@/constants/theme';
import { useAdminAccessStore } from '@/lib/admin-access-store';
import { adminStudents, formatInr, ordersForStudent, paidNotes } from '@/lib/demo-admin';
import { useAppTheme } from '@/providers/app-providers';

export default function AdminStudentDetail() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const student = adminStudents.find((item) => item.id === params.id) ?? adminStudents[0];
  const orders = ordersForStudent(student.id);
  const totalSpent = orders.reduce((total, order) => total + order.amount, 0);
  const initials = student.name.split(' ').map((part) => part[0]).slice(0, 2).join('');
  const [showGrantSheet, setShowGrantSheet] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const grants = useAdminAccessStore((state) => state.grants);
  const grantNote = useAdminAccessStore((state) => state.grantNote);
  const revokeNote = useAdminAccessStore((state) => state.revokeNote);
  const studentGrants = grants.filter((grant) => grant.studentId === student.id);
  const grantedIds = new Set(studentGrants.map((grant) => grant.noteId));
  const purchasedTitles = new Set(orders.filter((order) => order.itemType === 'Note' && order.status === 'Paid').map((order) => order.item));
  const eligibleNotes = paidNotes.filter((note) => note.course === student.course && note.category === student.category && !purchasedTitles.has(note.title));
  const grantableNotes = eligibleNotes.filter((note) => !grantedIds.has(note.id));

  const openGrantSheet = () => {
    setSelectedNoteId(grantableNotes[0]?.id ?? null);
    setShowGrantSheet(true);
  };
  const confirmGrant = () => {
    if (!selectedNoteId) return;
    grantNote(student.id, selectedNoteId);
    setSelectedNoteId(null);
    setShowGrantSheet(false);
  };

  const back = <Pressable accessibilityRole="button" accessibilityLabel="Back to students" onPress={() => router.back()} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft size={19} color={theme.fg} /></Pressable>;

  return <>
    <AdminShell eyebrow="STUDENT PROFILE" title={student.name} description={`${student.course} · ${student.category} · joined ${student.joinedOn}`} action={back}>
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

      <View style={styles.sectionHeading}><View style={styles.sectionCopy}><Text style={[styles.sectionTitle, { color: theme.fg }]}>Complimentary access</Text><Text style={[styles.sectionHint, { color: theme.muted }]}>{studentGrants.length ? `${studentGrants.length} notes granted free` : 'Give selected paid notes to this student for free'}</Text></View><Pressable disabled={!grantableNotes.length} accessibilityRole="button" accessibilityLabel="Grant free note access" onPress={openGrantSheet} style={({ pressed }) => [styles.grantButton, { backgroundColor: theme.primary }, !grantableNotes.length && styles.disabled, pressed && styles.pressed]}>{grantableNotes.length ? <Plus size={15} color={theme.primaryFg} /> : <Check size={15} color={theme.primaryFg} />}<Text style={[styles.grantButtonText, { color: theme.primaryFg }]}>{grantableNotes.length ? 'Grant note' : 'Assigned'}</Text></Pressable></View>
      {studentGrants.length ? <View style={styles.list}>{studentGrants.map((grant) => { const note = paidNotes.find((item) => item.id === grant.noteId); if (!note) return null; return <View key={grant.id} style={[styles.accessRow, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.accessIcon, { backgroundColor: theme.successSoft }]}><Gift size={18} color={theme.success} /></View><View style={styles.orderCopy}><Text numberOfLines={1} style={[styles.orderTitle, { color: theme.fg }]}>{note.title}</Text><Text numberOfLines={1} style={[styles.orderMeta, { color: theme.muted }]}>{note.subject} · {note.pages} pages · Granted {grant.grantedAt}</Text></View><View style={[styles.freePill, { backgroundColor: theme.successSoft }]}><Text style={[styles.freeText, { color: theme.success }]}>FREE</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Revoke free access to ${note.title}`} onPress={() => revokeNote(student.id, note.id)} style={[styles.revoke, { backgroundColor: theme.sunken }]}><X size={15} color={theme.muted} /></Pressable></View>; })}</View> : <View style={[styles.emptyAccess, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.emptyAccessIcon, { backgroundColor: theme.primarySoft }]}><Gift size={20} color={theme.primaryStrong} /></View><View style={styles.sectionCopy}><Text style={[styles.emptyAccessTitle, { color: theme.fg }]}>No complimentary notes yet</Text><Text style={[styles.emptyAccessCopy, { color: theme.muted }]}>Grant a course-relevant note without creating an order or payment receipt.</Text></View></View>}

      <View><Text style={[styles.sectionTitle, { color: theme.fg }]}>Order history</Text><Text style={[styles.sectionHint, { color: theme.muted }]}>{orders.length ? `${orders.length} receipts available` : 'No orders placed'}</Text></View>
      <View style={styles.list}>{orders.map((order) => <Pressable key={order.id} onPress={() => router.push({ pathname: '/admin/orders/[id]' as never, params: { id: order.id } })} style={({ pressed }) => [styles.orderRow, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}><View style={[styles.orderIcon, { backgroundColor: theme.primarySoft }]}><ReceiptText size={18} color={theme.primaryStrong} /></View><View style={styles.orderCopy}><Text numberOfLines={1} style={[styles.orderTitle, { color: theme.fg }]}>{order.item}</Text><Text style={[styles.orderMeta, { color: theme.muted }]}>{order.id} · {order.date}</Text></View><View style={styles.orderAmount}><Text style={[styles.amount, { color: theme.fg }]}>{formatInr(order.amount)}</Text><Text style={[styles.paid, { color: theme.success }]}>{order.status}</Text></View><ChevronRight size={17} color={theme.faint} /></Pressable>)}</View>
    </AdminShell>

    <Modal visible={showGrantSheet} transparent animationType="none" onRequestClose={() => setShowGrantSheet(false)}>
      <View style={styles.modalRoot}><Pressable accessibilityRole="button" accessibilityLabel="Close free access picker" style={styles.backdrop} onPress={() => setShowGrantSheet(false)} /><View style={[styles.sheet, { backgroundColor: theme.elevated, borderColor: theme.lineStrong }]}>
        <View style={[styles.sheetHandle, { backgroundColor: theme.lineStrong }]} />
        <View style={styles.sheetHeader}><View style={styles.sectionCopy}><Text style={[styles.sheetEyebrow, { color: theme.primary }]}>COMPLIMENTARY ACCESS</Text><Text style={[styles.sheetTitle, { color: theme.fg }]}>Choose a note for {student.name}</Text><Text style={[styles.sheetCopy, { color: theme.muted }]}>Only available {student.course} · {student.category} notes are shown. Purchased notes are excluded.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => setShowGrantSheet(false)} style={[styles.sheetClose, { backgroundColor: theme.sunken }]}><X size={18} color={theme.muted} /></Pressable></View>
        <View style={styles.notePicker}>{eligibleNotes.map((note) => { const granted = grantedIds.has(note.id); const selected = selectedNoteId === note.id; return <Pressable key={note.id} disabled={granted} accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: granted }} onPress={() => setSelectedNoteId(note.id)} style={[styles.noteOption, { backgroundColor: selected ? theme.primarySoft : theme.surface, borderColor: selected ? theme.primary : theme.line }, granted && styles.grantedOption]}><View style={[styles.noteOptionIcon, { backgroundColor: granted ? theme.successSoft : theme.sunken }]}>{granted ? <Check size={17} color={theme.success} strokeWidth={3} /> : <FileText size={17} color={selected ? theme.primaryStrong : theme.muted} />}</View><View style={styles.orderCopy}><Text numberOfLines={1} style={[styles.noteTitle, { color: theme.fg }]}>{note.title}</Text><Text style={[styles.noteMeta, { color: theme.muted }]}>{note.subject} · {note.pages} pages · {formatInr(note.price)}</Text></View>{granted ? <Text style={[styles.grantedText, { color: theme.success }]}>GRANTED</Text> : <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.faint, backgroundColor: selected ? theme.primary : 'transparent' }]}>{selected ? <Check size={12} color={theme.primaryFg} strokeWidth={3} /> : null}</View>}</Pressable>; })}</View>
        {!eligibleNotes.length ? <View style={[styles.noNotes, { backgroundColor: theme.surface }]}><Text style={[styles.emptyAccessTitle, { color: theme.fg }]}>No eligible notes</Text><Text style={[styles.emptyAccessCopy, { color: theme.muted }]}>This student has already purchased the available notes for their course and category.</Text></View> : null}
        <Pressable disabled={!selectedNoteId} accessibilityRole="button" onPress={confirmGrant} style={({ pressed }) => [styles.confirmButton, { backgroundColor: theme.primary }, !selectedNoteId && styles.disabled, pressed && styles.pressed]}><Gift size={17} color={theme.primaryFg} /><Text style={[styles.confirmText, { color: theme.primaryFg }]}>Grant free access</Text></Pressable>
      </View></View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  back: { width: 39, height: 39, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  profileCard: { borderWidth: 1, borderRadius: 19, padding: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }, avatar: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, avatarText: { fontFamily: font.extraBold, fontSize: 15 }, profileCopy: { flex: 1, minWidth: 0 }, profileName: { fontFamily: font.extraBold, fontSize: 16 }, profileId: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, coursePill: { borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 }, courseText: { fontFamily: font.bold, fontSize: 9 }, contactRow: { width: '100%', minHeight: 31, flexDirection: 'row', alignItems: 'center', gap: 8 }, contactText: { flex: 1, fontFamily: font.regular, fontSize: 10 },
  metrics: { flexDirection: 'row', gap: spacing.sm }, metric: { flex: 1, minWidth: 0, minHeight: 105, borderWidth: 1, borderRadius: 17, padding: 12 }, metricValue: { marginTop: 8, fontFamily: font.extraBold, fontSize: 17, letterSpacing: -0.4 }, metricLabel: { marginTop: 2, fontFamily: font.medium, fontSize: 8 },
  courseCard: { minHeight: 82, borderWidth: 1, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }, courseIcon: { width: 43, height: 43, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, cardEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1 }, cardTitle: { marginTop: 3, fontFamily: font.bold, fontSize: 13 }, cardDetail: { marginTop: 3, fontFamily: font.regular, fontSize: 9 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, sectionCopy: { flex: 1, minWidth: 0 }, sectionTitle: { fontFamily: font.extraBold, fontSize: 17 }, sectionHint: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, grantButton: { minHeight: 37, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 5 }, grantButtonText: { fontFamily: font.bold, fontSize: 9 }, list: { gap: spacing.sm },
  accessRow: { minHeight: 78, borderWidth: 1, borderRadius: 16, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, accessIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, freePill: { minHeight: 24, borderRadius: radius.pill, paddingHorizontal: 7, alignItems: 'center', justifyContent: 'center' }, freeText: { fontFamily: font.bold, fontSize: 7, letterSpacing: .7 }, revoke: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyAccess: { minHeight: 86, borderWidth: 1, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 11 }, emptyAccessIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, emptyAccessTitle: { fontFamily: font.bold, fontSize: 12 }, emptyAccessCopy: { marginTop: 3, fontFamily: font.regular, fontSize: 9, lineHeight: 14 },
  orderRow: { minHeight: 76, borderWidth: 1, borderRadius: 16, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, orderIcon: { width: 39, height: 39, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, orderCopy: { flex: 1, minWidth: 0 }, orderTitle: { fontFamily: font.bold, fontSize: 11 }, orderMeta: { marginTop: 3, fontFamily: font.regular, fontSize: 8 }, orderAmount: { alignItems: 'flex-end' }, amount: { fontFamily: font.bold, fontSize: 11 }, paid: { marginTop: 3, fontFamily: font.bold, fontSize: 8 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' }, backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,.72)' }, sheet: { width: '100%', maxWidth: 680, alignSelf: 'center', borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: spacing.lg, paddingBottom: 29 }, sheetHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 }, sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, sheetEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, sheetTitle: { marginTop: 4, fontFamily: font.extraBold, fontSize: 18, lineHeight: 24 }, sheetCopy: { marginTop: 4, fontFamily: font.regular, fontSize: 9, lineHeight: 14 }, sheetClose: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, notePicker: { marginTop: 16, gap: 8 }, noteOption: { minHeight: 68, borderWidth: 1, borderRadius: 15, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 9 }, grantedOption: { opacity: .68 }, noteOptionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, noteTitle: { fontFamily: font.bold, fontSize: 11 }, noteMeta: { marginTop: 3, fontFamily: font.regular, fontSize: 8 }, radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }, grantedText: { fontFamily: font.bold, fontSize: 7, letterSpacing: .7 }, noNotes: { minHeight: 86, marginTop: 16, borderRadius: 15, padding: 14, justifyContent: 'center' }, confirmButton: { minHeight: 47, marginTop: 16, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, confirmText: { fontFamily: font.bold, fontSize: 11 }, disabled: { opacity: .42 }, pressed: { opacity: .74, transform: [{ scale: .99 }] },
});
