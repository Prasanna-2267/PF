import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { BrainCircuit, Crown, LockKeyhole, Sparkles, Target } from 'lucide-react-native';

import { Card } from '@/components/ui';
import { font, radius } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { practiceSubjects } from '@/lib/demo-practice';
import { usePracticeProgressStore } from '@/lib/practice-progress-store';
import { useAppTheme } from '@/providers/app-providers';

const nativeDriver = Platform.OS !== 'web';

export function ConceptWeakAreas() {
  const { theme } = useAppTheme();
  const paid = useAuthStore((state) => state.user?.plan === 'paid');
  const progress = usePracticeProgressStore((state) => state.byQuestionId);
  const [entrance] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }).start();
  }, [entrance]);

  const concepts = useMemo(() => practiceSubjects.flatMap((subject) => subject.topics.map((topic) => {
    const results = topic.questions.map((question) => progress[question.id]).filter(Boolean);
    const attempts = results.reduce((sum, result) => sum + (result.attempts ?? 0), 0);
    const correct = results.reduce((sum, result) => sum + (result.correctAttempts ?? (result.correct ? 1 : 0)), 0);
    const accuracy = attempts ? Math.round((correct / attempts) * 100) : 0;
    return { id: topic.id, title: topic.title, subject: subject.title, attempts, accuracy };
  })).filter((item) => item.attempts > 0).sort((a, b) => a.accuracy - b.accuracy).slice(0, 3), [progress]);

  const translateY = entrance.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  return <Animated.View style={{ opacity: entrance, transform: [{ translateY }] }}>
    <Card style={styles.card}>
      <View style={styles.heading}>
        <View style={[styles.heroIcon, { backgroundColor: paid ? theme.goldSoft : theme.primarySoft }]}>{paid ? <BrainCircuit size={21} color={theme.goldStrong} /> : <LockKeyhole size={19} color={theme.primaryStrong} />}</View>
        <View style={styles.headingCopy}><Text style={[styles.eyebrow, { color: paid ? theme.goldStrong : theme.primary }]}>CONCEPT INTELLIGENCE</Text><Text style={[styles.title, { color: theme.fg }]}>{paid ? 'Weak areas to strengthen' : 'Unlock concept-wise insights'}</Text><Text style={[styles.description, { color: theme.muted }]}>{paid ? 'Prioritised from accuracy across every attempt.' : 'Paid learners see weak concepts ranked from their practice history.'}</Text></View>
        <View style={[styles.planBadge, { backgroundColor: theme.goldSoft }]}><Crown size={11} color={theme.goldStrong} /><Text style={[styles.planText, { color: theme.goldStrong }]}>PAID</Text></View>
      </View>

      {paid ? <View style={styles.list}>{concepts.map((concept, index) => {
        const strength = Math.max(8, concept.accuracy);
        const priority = concept.accuracy < 50 ? 'Priority' : concept.accuracy < 70 ? 'Review' : 'Watch';
        return <View key={concept.id} style={[styles.row, { backgroundColor: theme.sunken, borderColor: theme.line }]}>
          <View style={[styles.rank, { backgroundColor: index === 0 ? theme.dangerSoft : theme.goldSoft }]}><Text style={[styles.rankText, { color: index === 0 ? theme.danger : theme.goldStrong }]}>{index + 1}</Text></View>
          <View style={styles.copy}><Text numberOfLines={1} style={[styles.concept, { color: theme.fg }]}>{concept.title}</Text><Text numberOfLines={1} style={[styles.meta, { color: theme.muted }]}>{concept.subject} · {concept.attempts} attempts</Text><View style={[styles.track, { backgroundColor: theme.surface }]}><View style={[styles.fill, { width: `${strength}%`, backgroundColor: concept.accuracy < 50 ? theme.danger : theme.gold }]} /></View></View>
          <View style={styles.score}><Text style={[styles.accuracy, { color: concept.accuracy < 50 ? theme.danger : theme.goldStrong }]}>{concept.accuracy}%</Text><Text style={[styles.priority, { color: theme.faint }]}>{priority}</Text></View>
        </View>;
      })}</View> : <View style={[styles.locked, { backgroundColor: theme.sunken, borderColor: theme.line }]}><View style={styles.lockedStars}><Sparkles size={15} color={theme.goldStrong} /><Target size={19} color={theme.primaryStrong} /></View><Text style={[styles.lockedTitle, { color: theme.fg }]}>Know what to practise next</Text><Text style={[styles.lockedText, { color: theme.muted }]}>Concept ranking, accuracy signals and smart priorities are shown here on Paid.</Text></View>}
    </Card>
  </Animated.View>;
}

const styles = StyleSheet.create({
  card: { padding: 14, overflow: 'hidden' }, heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, heroIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, headingCopy: { flex: 1, minWidth: 0 }, eyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1.1 }, title: { marginTop: 3, fontFamily: font.extraBold, fontSize: 16, letterSpacing: -.3 }, description: { marginTop: 3, fontFamily: font.regular, fontSize: 8, lineHeight: 13 }, planBadge: { minHeight: 24, borderRadius: radius.pill, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 4 }, planText: { fontFamily: font.bold, fontSize: 7, letterSpacing: .7 }, list: { marginTop: 14, gap: 8 }, row: { minHeight: 71, borderWidth: 1, borderRadius: 14, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 9 }, rank: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, rankText: { fontFamily: font.extraBold, fontSize: 12 }, copy: { flex: 1, minWidth: 0 }, concept: { fontFamily: font.bold, fontSize: 11 }, meta: { marginTop: 2, fontFamily: font.regular, fontSize: 7 }, track: { height: 5, marginTop: 7, borderRadius: 3, overflow: 'hidden' }, fill: { height: '100%', borderRadius: 3 }, score: { minWidth: 42, alignItems: 'flex-end' }, accuracy: { fontFamily: font.extraBold, fontSize: 13 }, priority: { marginTop: 2, fontFamily: font.bold, fontSize: 7 }, locked: { marginTop: 14, minHeight: 112, borderWidth: 1, borderRadius: 16, padding: 14, justifyContent: 'center' }, lockedStars: { flexDirection: 'row', alignItems: 'center', gap: 7 }, lockedTitle: { marginTop: 10, fontFamily: font.extraBold, fontSize: 14 }, lockedText: { marginTop: 4, maxWidth: 330, fontFamily: font.regular, fontSize: 9, lineHeight: 14 },
});
