import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookOpen, Gift, GraduationCap, ScrollText, ShieldCheck, Tag } from 'lucide-react-native';

import { AdminShell } from '@/components/admin-shell';
import { font, radius } from '@/constants/theme';
import { useAppTheme } from '@/providers/app-providers';

type AuditKind = 'Content' | 'Commerce' | 'Access';
const auditRows = [
  { id: 'AUD-105', actor: 'Mock Admin', action: 'Created coupon', resource: 'JEEBOOST20', time: '10:42 AM', kind: 'Commerce' as const, icon: Tag },
  { id: 'AUD-104', actor: 'Mock Admin', action: 'Granted complimentary note', resource: 'Aditi Sharma · National Movement', time: '9:18 AM', kind: 'Access' as const, icon: Gift },
  { id: 'AUD-103', actor: 'Website Admin', action: 'Published study note', resource: 'Organic Chemistry Reactions', time: '8:55 AM', kind: 'Content' as const, icon: BookOpen },
  { id: 'AUD-102', actor: 'Mock Admin', action: 'Added course category', resource: 'JEE · Advanced', time: 'Yesterday', kind: 'Content' as const, icon: GraduationCap },
  { id: 'AUD-101', actor: 'Website Admin', action: 'Published package', resource: 'NEET Biology Master Pack', time: 'Yesterday', kind: 'Content' as const, icon: BookOpen },
];

export default function AdminAudit() {
  const { theme } = useAppTheme();
  const [filter, setFilter] = useState<'All' | AuditKind>('All');
  const rows = auditRows.filter((row) => filter === 'All' || row.kind === filter);

  return <AdminShell eyebrow="READ-ONLY" title="Audit log" description="A clear timeline of recent mobile and website workspace activity.">
    <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.heroIcon, { backgroundColor: theme.primarySoft }]}><ScrollText size={23} color={theme.primaryStrong} /></View><View style={styles.flex}><Text style={[styles.heroEyebrow, { color: theme.primary }]}>WORKSPACE ACTIVITY</Text><Text style={[styles.heroValue, { color: theme.fg }]}>{auditRows.length} recent events</Text><Text style={[styles.heroHint, { color: theme.muted }]}>Mobile actions and website publishing history</Text></View><View style={[styles.safePill, { backgroundColor: theme.successSoft }]}><ShieldCheck size={12} color={theme.success} /><Text style={[styles.safeText, { color: theme.success }]}>SECURE</Text></View></View>

    <View style={[styles.filters, { backgroundColor: theme.surface, borderColor: theme.line }]}>{(['All', 'Content', 'Commerce', 'Access'] as const).map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, { backgroundColor: filter === item ? theme.primarySoft : theme.sunken, borderColor: filter === item ? theme.primary : 'transparent' }]}><Text style={[styles.filterText, { color: filter === item ? theme.primaryStrong : theme.muted }]}>{item}</Text></Pressable>)}</View>

    <View style={styles.sectionHeading}><View><Text style={[styles.sectionEyebrow, { color: theme.primary }]}>TIMELINE</Text><Text style={[styles.sectionTitle, { color: theme.fg }]}>Recent changes</Text></View><Text style={[styles.resultCount, { color: theme.muted }]}>{rows.length} shown</Text></View>
    <View style={[styles.timeline, { backgroundColor: theme.surface, borderColor: theme.line }]}>{rows.map((row, index) => { const Icon = row.icon; const color = row.kind === 'Commerce' ? theme.goldStrong : row.kind === 'Access' ? theme.success : theme.primaryStrong; const soft = row.kind === 'Commerce' ? theme.goldSoft : row.kind === 'Access' ? theme.successSoft : theme.primarySoft; return <View key={row.id} style={styles.timelineRow}><View style={styles.timelineRail}><View style={[styles.eventIcon, { backgroundColor: soft }]}><Icon size={16} color={color} /></View>{index < rows.length - 1 ? <View style={[styles.railLine, { backgroundColor: theme.line }]} /> : null}</View><View style={[styles.eventCopy, index < rows.length - 1 && { borderBottomColor: theme.line, borderBottomWidth: 1 }]}><View style={styles.eventTop}><Text style={[styles.eventKind, { color }]}>{row.kind.toUpperCase()}</Text><Text style={[styles.eventTime, { color: theme.faint }]}>{row.time}</Text></View><Text style={[styles.eventAction, { color: theme.fg }]}>{row.action}</Text><Text numberOfLines={2} style={[styles.eventResource, { color: theme.muted }]}>{row.actor} · {row.resource}</Text><Text style={[styles.eventId, { color: theme.faint }]}>{row.id}</Text></View></View>; })}</View>

    <View style={[styles.notice, { backgroundColor: theme.primarySoft, borderColor: theme.line }]}><ShieldCheck size={17} color={theme.primaryStrong} /><View style={styles.flex}><Text style={[styles.noticeTitle, { color: theme.primaryStrong }]}>Immutable activity view</Text><Text style={[styles.noticeCopy, { color: theme.muted }]}>Audit events can be reviewed on mobile but cannot be edited or removed.</Text></View></View>
  </AdminShell>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 }, hero: { minHeight: 116, borderWidth: 1, borderRadius: 19, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, heroIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, heroEyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1.05 }, heroValue: { marginTop: 3, fontFamily: font.extraBold, fontSize: 19 }, heroHint: { marginTop: 2, fontFamily: font.regular, fontSize: 8 }, safePill: { minHeight: 26, borderRadius: radius.pill, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 4 }, safeText: { fontFamily: font.bold, fontSize: 6, letterSpacing: .5 },
  filters: { borderWidth: 1, borderRadius: 16, padding: 7, flexDirection: 'row', gap: 5 }, filter: { flex: 1, minHeight: 31, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, filterText: { fontFamily: font.bold, fontSize: 7 }, sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, sectionEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.05 }, sectionTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 17 }, resultCount: { fontFamily: font.semibold, fontSize: 8 },
  timeline: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 11, paddingTop: 11 }, timelineRow: { minHeight: 94, flexDirection: 'row', gap: 9 }, timelineRail: { width: 37, alignItems: 'center' }, eventIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, railLine: { flex: 1, width: 1, marginVertical: 5 }, eventCopy: { flex: 1, minWidth: 0, paddingBottom: 11 }, eventTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, eventKind: { fontFamily: font.bold, fontSize: 6, letterSpacing: .8 }, eventTime: { fontFamily: font.regular, fontSize: 7 }, eventAction: { marginTop: 4, fontFamily: font.bold, fontSize: 10 }, eventResource: { marginTop: 3, fontFamily: font.regular, fontSize: 8, lineHeight: 12 }, eventId: { marginTop: 4, fontFamily: font.semibold, fontSize: 6, letterSpacing: .4 }, notice: { minHeight: 69, borderWidth: 1, borderRadius: 16, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, noticeTitle: { fontFamily: font.bold, fontSize: 10 }, noticeCopy: { marginTop: 3, fontFamily: font.regular, fontSize: 8, lineHeight: 13 },
});
