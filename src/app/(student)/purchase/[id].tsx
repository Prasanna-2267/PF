import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { ArrowLeft, CheckCircle2, LockKeyhole, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton, Card } from '@/components/ui';
import { font, spacing } from '@/constants/theme';
import { STORE_BASE_URL } from '@/lib/env';
import { useAuthStore } from '@/lib/auth-store';
import { findLesson } from '@/lib/demo-catalog';
import { getNote } from '@/lib/student-content-api';
import { isDemoSession } from '@/lib/student-session';
import { useAppTheme } from '@/providers/app-providers';

export default function PurchaseScreen() { const { id, returnTo } = useLocalSearchParams<{ id: string; returnTo?: string }>(); const demo = useAuthStore((state) => isDemoSession(state.accessToken, state.user?.id)); return demo ? <DemoPurchase id={id} returnTo={returnTo} /> : <RemoteStorePurchase id={id} returnTo={returnTo} />; }
function noteBack(router: ReturnType<typeof useRouter>, returnTo?: string) { if (returnTo?.startsWith('/notes')) { if (router.canGoBack()) router.back(); else router.replace(returnTo as never); } else router.replace('/notes'); }
function RemoteStorePurchase({ id, returnTo }: { id: string; returnTo?: string }) {
  const { theme } = useAppTheme();
  const router = useRouter();
  const note = useQuery({ queryKey: ['student', 'note', id], queryFn: () => getNote(id) });
  if (note.isLoading) return <SafeAreaView style={[styles.safe, styles.center, { backgroundColor: theme.canvas }]}><ActivityIndicator color={theme.primary} /></SafeAreaView>;
  if (!note.data) return <SafeAreaView style={[styles.safe, styles.center, { backgroundColor: theme.canvas }]}><Text style={[styles.copy, { color: theme.muted }]}>This note is unavailable.</Text><AppButton label="Go back" onPress={() => noteBack(router, returnTo)} /></SafeAreaView>;
  const data = note.data;
  const expired = data.access.reason === 'RESOURCE_EXPIRED';
  const examRequired = data.access.reason === 'EXAM_DATE_REQUIRED';
  const validityDate = data.access.expiresAt ? new Date(data.access.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const openExactStoreItem = async () => {
    const path = data.purchaseTarget?.storePath ?? `/store/product/${encodeURIComponent(data.id)}?type=notes`;
    await WebBrowser.openBrowserAsync(`${STORE_BASE_URL}${path}`);
  };
  return <PurchaseLayout title={data.title} detail={`${data.breadcrumb.map((part) => part.name).join(' · ') || 'Course note'} · Premium`} onBack={() => noteBack(router, returnTo)} actionLabel={expired || examRequired ? 'Back to notes' : 'Get the Notes'} onAction={expired || examRequired ? () => noteBack(router, returnTo) : openExactStoreItem} disclaimer={expired ? `The publisher’s access window ended${validityDate ? ` on ${validityDate}` : ''}. Existing reading history, favourite and revision records are preserved.` : examRequired ? 'Add your exam month and year in Account so the server can calculate this resource’s validity window.' : 'Purchase this exact note securely in the Parallax Flow website Store. Your entitlement is synced automatically after payment.'} />;
}
function DemoPurchase({ id, returnTo }: { id: string; returnTo?: string }) { const router = useRouter(); const { lesson, subject } = findLesson(id); return <PurchaseLayout title={lesson.title} detail={`${subject.title} · ${lesson.pages} pages`} onBack={() => noteBack(router, returnTo)} actionLabel="Continue to checkout" onAction={() => router.replace('/library')} disclaimer="Demo purchase flow—no payment is processed." />; }
function PurchaseLayout({ title, detail, onBack, actionLabel, onAction, disclaimer }: { title: string; detail: string; onBack: () => void; actionLabel: string; onAction: () => void; disclaimer: string }) { const { theme } = useAppTheme(); return <SafeAreaView style={[styles.safe, { backgroundColor: theme.canvas }]}><View style={styles.content}><Pressable onPress={onBack} style={[styles.back, { borderColor: theme.line, backgroundColor: theme.surface }]}><ArrowLeft color={theme.fg} size={20} /></Pressable><View style={[styles.hero, { backgroundColor: theme.primary }]}><View style={styles.lock}><LockKeyhole color="#F0C96B" size={26} /></View><Text style={styles.eyebrow}>PREMIUM STUDY NOTE</Text><Text style={styles.title}>{title}</Text><Text style={styles.detail}>{detail}</Text></View><Card><Text style={[styles.cardTitle, { color: theme.fg }]}>Included with access</Text><View style={styles.points}>{['Protected PDF reader', 'Completion, favourite and revision tracking', 'Progress synced to your account'].map((point) => <View key={point} style={styles.point}><CheckCircle2 color={theme.success} size={18} /><Text style={[styles.pointText, { color: theme.muted }]}>{point}</Text></View>)}</View><AppButton label={actionLabel} variant="gold" onPress={onAction} /><Text style={[styles.disclaimer, { color: theme.muted }]}>{disclaimer}</Text></Card><View style={styles.notice}><ShieldCheck color={theme.primary} size={17} /><Text style={[styles.noticeText, { color: theme.muted }]}>Access is controlled by server entitlements.</Text></View></View></SafeAreaView>; }
const styles = StyleSheet.create({ safe: { flex: 1 }, center: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 12 }, content: { padding: spacing.lg, gap: spacing.lg, maxWidth: 680, alignSelf: 'center', width: '100%' }, copy: { fontFamily: font.regular, fontSize: 12 }, back: { height: 42, width: 42, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, hero: { borderRadius: 20, padding: 22, minHeight: 192 }, lock: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }, eyebrow: { color: '#F0C96B', fontFamily: font.bold, fontSize: 9, letterSpacing: 1.3, marginTop: 17 }, title: { color: '#FFFFFF', fontFamily: font.extraBold, fontSize: 24, lineHeight: 30, marginTop: 5 }, detail: { color: '#D5DCFD', fontFamily: font.regular, fontSize: 12, marginTop: 7 }, cardTitle: { fontFamily: font.bold, fontSize: 17 }, points: { gap: 13, marginTop: 12, marginBottom: 17 }, point: { flexDirection: 'row', gap: 10, alignItems: 'center' }, pointText: { flex: 1, fontFamily: font.regular, fontSize: 12 }, disclaimer: { marginTop: 10, textAlign: 'center', fontFamily: font.regular, fontSize: 9, lineHeight: 14 }, notice: { flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center' }, noticeText: { fontFamily: font.regular, fontSize: 10 } });
