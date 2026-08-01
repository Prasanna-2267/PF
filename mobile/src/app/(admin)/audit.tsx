import { StyleSheet, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { AdminShell } from '@/components/admin-shell';
import { Card } from '@/components/ui';
import { font } from '@/constants/theme';
import { useAppTheme } from '@/providers/app-providers';
export default function AdminAudit() { const { theme } = useAppTheme(); const rows = [['Aditi Sharma', 'Published lesson', 'Constitutional Framework'], ['Admin', 'Updated coupon', 'PRELIMS10'], ['Admin', 'Created package', 'Polity Essentials']]; return <AdminShell eyebrow="READ-ONLY" title="Audit log"><Card>{rows.map(([actor, action, resource]) => <View key={action} style={[styles.row, { borderBottomColor: theme.line }]}><ShieldCheck size={18} color={theme.primary} /><View style={{ flex: 1 }}><Text style={[styles.action, { color: theme.fg }]}>{action}</Text><Text style={[styles.detail, { color: theme.muted }]}>{actor} · {resource}</Text></View><Text style={[styles.time, { color: theme.faint }]}>Today</Text></View>)}</Card></AdminShell>; }
const styles = StyleSheet.create({ row: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1 }, action: { fontFamily: font.bold, fontSize: 12 }, detail: { fontFamily: font.regular, fontSize: 10, marginTop: 3 }, time: { fontFamily: font.regular, fontSize: 10 } });
