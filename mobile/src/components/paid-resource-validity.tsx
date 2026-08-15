import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { BookImage, Clock3, Crown, DatabaseZap, LockKeyhole, ShieldCheck } from 'lucide-react-native';

import { Card } from '@/components/ui';
import { font, radius } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { useLearnerProfileStore } from '@/lib/learner-profile-store';
import { useAppTheme } from '@/providers/app-providers';

const nativeDriver = Platform.OS !== 'web';
const resources = [
  { id: 'infographic-polity', title: 'Polity visual revision', type: 'Infographic notes', subject: 'Indian Polity', offsetDays: 30, Icon: BookImage },
  { id: 'qb-mains', title: 'Mains practice vault', type: 'Question bank', subject: 'Full syllabus', offsetDays: 7, Icon: DatabaseZap },
];

function parseExamDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date('2026-09-14T12:00:00') : parsed;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function shortDate(date: Date) {
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function PaidResourceValidity() {
  const { theme } = useAppTheme();
  const paid = useAuthStore((state) => state.user?.plan === 'paid');
  const examDate = useLearnerProfileStore((state) => state.profile.examDate);
  const [entrance] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }).start();
  }, [entrance]);
  const items = useMemo(() => {
    const exam = parseExamDate(examDate);
    return resources.map((resource) => ({ ...resource, expiresAt: addDays(exam, resource.offsetDays) }));
  }, [examDate]);
  const rise = entrance.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return <Animated.View style={{ opacity: entrance, transform: [{ translateY: rise }] }}><Card style={styles.card}>
    <View style={styles.heading}><View style={[styles.headingIcon, { backgroundColor: paid ? theme.goldSoft : theme.sunken }]}>{paid ? <Crown size={20} color={theme.goldStrong} /> : <LockKeyhole size={19} color={theme.muted} />}</View><View style={styles.headingCopy}><Text style={[styles.eyebrow, { color: paid ? theme.goldStrong : theme.primary }]}>EXAM-LINKED ACCESS</Text><Text style={[styles.title, { color: theme.fg }]}>{paid ? 'Premium resource validity' : 'Paid learning resources'}</Text><Text style={[styles.description, { color: theme.muted }]}>{paid ? `Validity is previewed from your ${examDate} exam date.` : 'Infographic notes and question banks are available with Paid access.'}</Text></View><View style={[styles.plan, { backgroundColor: theme.goldSoft }]}><Text style={[styles.planText, { color: theme.goldStrong }]}>PAID</Text></View></View>

    {paid ? <View style={styles.list}>{items.map(({ id, title, type, subject, offsetDays, expiresAt, Icon }, index) => <View key={id} style={[styles.resource, { backgroundColor: theme.sunken, borderColor: theme.line }]}><View style={[styles.resourceIcon, { backgroundColor: index === 0 ? theme.primarySoft : theme.goldSoft }]}><Icon size={19} color={index === 0 ? theme.primaryStrong : theme.goldStrong} /></View><View style={styles.resourceCopy}><Text style={[styles.type, { color: index === 0 ? theme.primaryStrong : theme.goldStrong }]}>{type.toUpperCase()}</Text><Text numberOfLines={1} style={[styles.resourceTitle, { color: theme.fg }]}>{title}</Text><Text numberOfLines={1} style={[styles.resourceMeta, { color: theme.muted }]}>{subject} · Admin window +{offsetDays} days</Text></View><View style={styles.expiry}><Clock3 size={12} color={theme.success} /><Text style={[styles.expiresLabel, { color: theme.faint }]}>VALID UNTIL</Text><Text style={[styles.expiresDate, { color: theme.success }]}>{shortDate(expiresAt)}</Text></View></View>)}</View> : <View style={[styles.locked, { backgroundColor: theme.sunken, borderColor: theme.line }]}><ShieldCheck size={20} color={theme.primaryStrong} /><View style={styles.lockedCopy}><Text style={[styles.lockedTitle, { color: theme.fg }]}>Access follows your exam timeline</Text><Text style={[styles.lockedText, { color: theme.muted }]}>Paid materials show a clear validity date set from the Admin resource window.</Text></View></View>}
  </Card></Animated.View>;
}

const styles = StyleSheet.create({
  card: { padding: 14 }, heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, headingIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, headingCopy: { flex: 1, minWidth: 0 }, eyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1.05 }, title: { marginTop: 3, fontFamily: font.extraBold, fontSize: 15 }, description: { marginTop: 3, fontFamily: font.regular, fontSize: 8, lineHeight: 13 }, plan: { minHeight: 23, borderRadius: radius.pill, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' }, planText: { fontFamily: font.bold, fontSize: 7, letterSpacing: .7 }, list: { marginTop: 14, gap: 8 }, resource: { minHeight: 78, borderWidth: 1, borderRadius: 15, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 9 }, resourceIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, resourceCopy: { flex: 1, minWidth: 0 }, type: { fontFamily: font.bold, fontSize: 6, letterSpacing: .8 }, resourceTitle: { marginTop: 3, fontFamily: font.bold, fontSize: 10 }, resourceMeta: { marginTop: 2, fontFamily: font.regular, fontSize: 7 }, expiry: { minWidth: 74, alignItems: 'flex-end' }, expiresLabel: { marginTop: 3, fontFamily: font.bold, fontSize: 6, letterSpacing: .65 }, expiresDate: { marginTop: 2, fontFamily: font.bold, fontSize: 8 }, locked: { minHeight: 76, marginTop: 14, borderWidth: 1, borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, lockedCopy: { flex: 1, minWidth: 0 }, lockedTitle: { fontFamily: font.bold, fontSize: 10 }, lockedText: { marginTop: 3, fontFamily: font.regular, fontSize: 8, lineHeight: 13 },
});
