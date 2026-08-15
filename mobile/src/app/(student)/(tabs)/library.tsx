import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, ChevronRight, CreditCard, FileCheck2, FileText, Gift, ReceiptText, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/study-ui';
import { PaidResourceValidity } from '@/components/paid-resource-validity';
import { font, radius, spacing, themes } from '@/constants/theme';
import { orders, ownedLessons } from '@/lib/demo-commerce';
import { useAppTheme } from '@/providers/app-providers';

type LibraryView = 'lessons' | 'orders';

export default function LibraryScreen() {
  const { theme } = useAppTheme();
  const dark = theme.canvas === themes.dark.canvas;
  const router = useRouter();
  const [view, setView] = useState<LibraryView>('lessons');
  const averageProgress = Math.round(ownedLessons.reduce((total, lesson) => total + lesson.progress, 0) / Math.max(ownedLessons.length, 1));
  const freePurchases = orders.filter((order) => Number(order.amount.replace(/[^0-9.]/g, '')) === 0).length;
  const paidPurchases = orders.length - freePurchases;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.canvas }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>YOUR COLLECTION</Text>
          <Text style={[styles.title, { color: theme.fg }]}>Library</Text>
          <Text style={[styles.description, { color: theme.muted }]}>Your protected notes, progress and purchase history.</Text>
        </View>

        <LinearGradient colors={dark ? ['#1A2442', '#11172A', '#14171B'] : ['#34438F', '#4654A3', '#26346F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <View style={styles.heroOrbitLarge} />
          <View style={styles.heroOrbitSmall} />
          <View style={styles.heroTop}>
            <View style={styles.heroIcon}><ShieldCheck color={dark ? '#B9C7FF' : '#FFFFFF'} size={22} strokeWidth={2.1} /></View>
            <View style={styles.securePill}><View style={[styles.secureDot, { backgroundColor: dark ? '#7C9CFF' : '#D8E0FF' }]} /><Text style={styles.secureText}>PROTECTED ACCESS</Text></View>
          </View>
          <Text style={styles.heroTitle}>Everything you own,{`\n`}ready when you are.</Text>
          <Text style={styles.heroDescription}>Continue reading across your purchased study notes without losing progress.</Text>
          <View style={styles.heroFooter}>
            <View><Text style={styles.heroNumber}>{ownedLessons.length}</Text><Text style={styles.heroLabel}>OWNED NOTES</Text></View>
            <View style={styles.heroDivider} />
            <View><Text style={styles.heroNumber}>{averageProgress}%</Text><Text style={styles.heroLabel}>AVG. PROGRESS</Text></View>
          </View>
        </LinearGradient>

        <View style={styles.metrics}>
          <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.metricIcon, { backgroundColor: theme.primarySoft }]}><FileCheck2 color={theme.primary} size={18} /></View><Text style={[styles.metricValue, { color: theme.fg }]}>{ownedLessons.length}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>Owned</Text></View>
          <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.metricIcon, { backgroundColor: theme.goldSoft }]}><Gift color={theme.goldStrong} size={18} /></View><Text style={[styles.metricValue, { color: theme.fg }]}>{freePurchases}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricLabel, { color: theme.muted }]}>Free purchases</Text></View>
          <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.metricIcon, { backgroundColor: theme.successSoft }]}><CreditCard color={theme.success} size={18} /></View><Text style={[styles.metricValue, { color: theme.fg }]}>{paidPurchases}</Text><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.metricLabel, { color: theme.muted }]}>Paid purchases</Text></View>
        </View>

        <PaidResourceValidity />

        <View style={[styles.switcher, { backgroundColor: theme.sunken, borderColor: theme.line }]}>
          {(['lessons', 'orders'] as const).map((item) => {
            const selected = view === item;
            return <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setView(item)} style={[styles.switchItem, selected && { backgroundColor: theme.surface, borderColor: theme.lineStrong }]}>{item === 'lessons' ? <BookOpen size={17} color={selected ? theme.primary : theme.faint} /> : <ReceiptText size={17} color={selected ? theme.primary : theme.faint} />}<Text style={[styles.switchLabel, { color: selected ? theme.fg : theme.muted }]}>{item === 'lessons' ? 'Lessons' : 'Orders'}</Text></Pressable>;
          })}
        </View>

        {view === 'lessons' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeading}><View><Text style={[styles.sectionTitle, { color: theme.fg }]}>Owned lessons</Text><Text style={[styles.sectionHint, { color: theme.muted }]}>Tap a lesson to continue reading</Text></View><Text style={[styles.sectionCount, { color: theme.primary }]}>{ownedLessons.length} FILES</Text></View>
            <View style={styles.list}>{ownedLessons.map((lesson, index) => (
              <Pressable key={lesson.id} onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id } })} style={({ pressed }) => [styles.lesson, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}>
                <View style={[styles.lessonIcon, { backgroundColor: index % 2 === 0 ? theme.primarySoft : theme.goldSoft }]}><FileText size={20} color={index % 2 === 0 ? theme.primary : theme.goldStrong} /></View>
                <View style={styles.lessonCopy}><View style={styles.lessonTitleRow}><Text numberOfLines={1} style={[styles.lessonTitle, { color: theme.fg }]}>{lesson.title}</Text><Text style={[styles.progressValue, { color: lesson.progress === 100 ? theme.success : theme.primary }]}>{lesson.progress}%</Text></View><Text numberOfLines={1} style={[styles.lessonDetail, { color: theme.muted }]}>{lesson.subject} · {lesson.pages} pages · {lesson.revised}× revised</Text><View style={styles.progress}><ProgressBar value={lesson.progress} color={lesson.progress === 100 ? theme.success : theme.primary} /></View></View>
                <ChevronRight size={18} color={theme.faint} />
              </Pressable>
            ))}</View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeading}><View><Text style={[styles.sectionTitle, { color: theme.fg }]}>Order history</Text><Text style={[styles.sectionHint, { color: theme.muted }]}>Receipts for your purchases</Text></View><Text style={[styles.sectionCount, { color: theme.primary }]}>{orders.length} ORDERS</Text></View>
            <View style={styles.list}>{orders.map((order) => (
              <Pressable key={order.id} onPress={() => router.push({ pathname: '/receipt/[id]', params: { id: order.id } })} style={({ pressed }) => [styles.order, { backgroundColor: theme.surface, borderColor: theme.line }, pressed && styles.pressed]}>
                <View style={[styles.lessonIcon, { backgroundColor: theme.goldSoft }]}><ReceiptText size={20} color={theme.goldStrong} /></View>
                <View style={styles.lessonCopy}><Text numberOfLines={1} style={[styles.lessonTitle, { color: theme.fg }]}>{order.items}</Text><Text style={[styles.lessonDetail, { color: theme.muted }]}>{order.id} · {order.date}</Text></View>
                <View style={styles.amount}><Text style={[styles.amountValue, { color: theme.fg }]}>{order.amount}</Text><View style={[styles.paidPill, { backgroundColor: theme.successSoft }]}><Text style={[styles.paid, { color: theme.success }]}>{order.status}</Text></View></View>
              </Pressable>
            ))}</View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: 112, gap: spacing.lg },
  heading: { paddingHorizontal: 2 }, eyebrow: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1.5 }, title: { marginTop: 3, fontFamily: font.extraBold, fontSize: 30, letterSpacing: -0.9 }, description: { marginTop: 3, maxWidth: 330, fontFamily: font.regular, fontSize: 13, lineHeight: 19 },
  hero: { minHeight: 236, overflow: 'hidden', borderRadius: 24, padding: spacing.xl, justifyContent: 'space-between' }, heroOrbitLarge: { position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', right: -74, top: -78 }, heroOrbitSmall: { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', right: 20, top: -28 },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, heroIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.09)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }, securePill: { minHeight: 28, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: 'rgba(5,10,9,0.24)', flexDirection: 'row', alignItems: 'center', gap: 6 }, secureDot: { width: 5, height: 5, borderRadius: 3 }, secureText: { color: '#D8E5E1', fontFamily: font.bold, fontSize: 8, letterSpacing: 1 },
  heroTitle: { marginTop: spacing.lg, color: '#FFFFFF', fontFamily: font.extraBold, fontSize: 25, lineHeight: 31, letterSpacing: -0.7 }, heroDescription: { marginTop: spacing.sm, maxWidth: 330, color: 'rgba(255,255,255,0.68)', fontFamily: font.regular, fontSize: 12, lineHeight: 18 }, heroFooter: { marginTop: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.xl }, heroNumber: { color: '#FFFFFF', fontFamily: font.extraBold, fontSize: 21 }, heroLabel: { marginTop: 2, color: 'rgba(255,255,255,0.52)', fontFamily: font.bold, fontSize: 8, letterSpacing: 1 }, heroDivider: { width: 1, height: 33, backgroundColor: 'rgba(255,255,255,0.14)' },
  metrics: { flexDirection: 'row', gap: spacing.sm }, metric: { flex: 1, minWidth: 0, minHeight: 98, borderWidth: 1, borderRadius: radius.card, padding: spacing.md }, metricIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 9 }, metricValue: { fontFamily: font.extraBold, fontSize: 19, lineHeight: 22 }, metricLabel: { marginTop: 2, fontFamily: font.medium, fontSize: 10 },
  switcher: { flexDirection: 'row', borderWidth: 1, borderRadius: 15, padding: 4, gap: 4 }, switchItem: { flex: 1, height: 42, borderWidth: 1, borderColor: 'transparent', borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, switchLabel: { fontFamily: font.bold, fontSize: 12 },
  section: { gap: spacing.md }, sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.md, paddingHorizontal: 2 }, sectionTitle: { fontFamily: font.bold, fontSize: 17 }, sectionHint: { marginTop: 2, fontFamily: font.regular, fontSize: 10 }, sectionCount: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1 }, list: { gap: spacing.sm },
  lesson: { minHeight: 84, borderWidth: 1, borderRadius: 17, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, order: { minHeight: 76, borderWidth: 1, borderRadius: 17, padding: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, lessonIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, lessonCopy: { flex: 1, minWidth: 0 }, lessonTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, lessonTitle: { flex: 1, fontFamily: font.bold, fontSize: 13 }, progressValue: { fontFamily: font.bold, fontSize: 10 }, lessonDetail: { marginTop: 3, fontFamily: font.regular, fontSize: 10 }, progress: { marginTop: 8 },
  amount: { alignItems: 'flex-end', gap: 5 }, amountValue: { fontFamily: font.bold, fontSize: 13 }, paidPill: { borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3 }, paid: { fontFamily: font.bold, fontSize: 8, letterSpacing: 0.5 }, pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
});
