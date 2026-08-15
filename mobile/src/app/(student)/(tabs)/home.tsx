import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View, useWindowDimensions, type ViewStyle } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowUpRight, Award, CalendarDays, CheckCircle2, Coins, Eye, Flame, Gift, Heart, ListTodo, Plus, Share2, ShieldCheck, Sparkles, Target, Trash2, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GrandSessionControl, ProgressBar } from '@/components/study-ui';
import { font, layout, radius, spacing, themes } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { demoStudy, formatDuration, formatMinutes, useDemoStudyClock } from '@/lib/demo-study';
import { homeTodoDateKey, useHomeTodoStore } from '@/lib/home-todo-store';
import { useLearnerProfileStore } from '@/lib/learner-profile-store';
import { canRecoverStreak, monthlyHeartLimit, useRewardStore } from '@/lib/reward-store';
import { useAppTheme } from '@/providers/app-providers';

const nativeDriver = Platform.OS !== 'web';
const dayMs = 86_400_000;

function targetMinutesFrom(value: string) {
  const amount = Number(value.match(/[\d.]+/)?.[0] ?? 0);
  if (!amount) return demoStudy.targetMinutes;
  return /hour/i.test(value) ? Math.round(amount * 60) : Math.round(amount);
}

function Surface({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { theme } = useAppTheme();
  return <View style={[styles.surface, { backgroundColor: theme.surface, borderColor: theme.line }, style]}>{children}</View>;
}

export default function HomeScreen() {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const wide = width >= layout.tabletBreakpoint;
  const dark = theme.canvas === themes.dark.canvas;
  const router = useRouter();
  const study = useDemoStudyClock();
  const profile = useLearnerProfileStore((state) => state.profile);
  const userName = useAuthStore((state) => state.user?.name?.split(' ')[0] ?? 'Learner');
  const todos = useHomeTodoStore((state) => state.todos);
  const syncTodos = useHomeTodoStore((state) => state.syncToday);
  const addTodo = useHomeTodoStore((state) => state.addTodo);
  const toggleTodo = useHomeTodoStore((state) => state.toggleTodo);
  const removeTodo = useHomeTodoStore((state) => state.removeTodo);
  const clearCompleted = useHomeTodoStore((state) => state.clearCompleted);
  const [todoText, setTodoText] = useState('');
  const [currentDate] = useState(() => new Date());
  const [showCelebration, setShowCelebration] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [completedSeconds, setCompletedSeconds] = useState(0);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const points = useRewardStore((state) => state.points);
  const hearts = useRewardStore((state) => state.hearts);
  const streak = useRewardStore((state) => state.streak);
  const lastCompletedDate = useRewardStore((state) => state.lastCompletedDate);
  const syncRewardMonth = useRewardStore((state) => state.syncMonth);
  const awardDailyStreak = useRewardStore((state) => state.awardDailyStreak);
  const recoverStreak = useRewardStore((state) => state.recoverStreak);
  const completedTodos = todos.filter((todo) => todo.completed).length;
  const todoPercent = todos.length ? Math.round((completedTodos / todos.length) * 100) : 0;
  const dailyTargetMinutes = targetMinutesFrom(profile.dailyTarget);
  const remaining = Math.max(0, dailyTargetMinutes - study.todayMinutes);
  const planPercent = Math.min(100, Math.round((study.todayMinutes / dailyTargetMinutes) * 100));
  const completedPlanSegments = Math.round((planPercent / 100) * 12);
  const momentumLabel = planPercent >= 100 ? 'Goal complete' : planPercent >= 60 ? 'Strong momentum' : planPercent >= 30 ? 'Building rhythm' : 'Start your focus';
  const examTime = new Date(profile.examDate).getTime();
  const examDays = Number.isNaN(examTime) ? demoStudy.exam.daysLeft : Math.max(0, Math.ceil((examTime - currentDate.getTime()) / dayMs));
  const recoveryAvailable = canRecoverStreak(lastCompletedDate);
  const today = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(currentDate).toUpperCase();
  const submitTodo = () => { if (!todoText.trim()) return; addTodo(todoText); setTodoText(''); };
  const handleSession = () => {
    if (study.checkedIn) {
      setCompletedSeconds(study.sessionSeconds);
      setEarnedPoints(awardDailyStreak(study.todayMinutes, dailyTargetMinutes));
      setShowCelebration(true);
    }
    study.toggleSession();
  };

  useFocusEffect(useCallback(() => { syncRewardMonth(); syncTodos(homeTodoDateKey(currentDate)); }, [currentDate, syncRewardMonth, syncTodos]));

  return <><SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.canvas }]}><ScrollView contentContainerStyle={[styles.content, wide && styles.contentWide]} showsVerticalScrollIndicator={false}>
    <RewardHeader points={points} hearts={hearts} streak={streak} onPress={() => setShowRewards(true)} />
    <View style={[styles.dashboardLead, wide && styles.dashboardLeadWide]}>
    <View style={[styles.heroColumn, wide && styles.heroColumnWide]}>
    <LinearGradient colors={dark ? ['#17213A', '#101522', '#0B0D12'] : ['#263A82', '#424A94', '#5A4D59']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, wide && styles.heroWide, { borderColor: dark ? theme.line : 'transparent' }]}>
      <HeroAmbientMotion />
      <View style={styles.heroGlowOne} /><View style={styles.heroGlowTwo} />
      <View style={styles.heroTop}><Text style={[styles.date, { color: dark ? theme.goldStrong : '#E3C27E' }]}>●  {today}</Text><View style={[styles.liveStatus, { backgroundColor: study.checkedIn ? 'rgba(217,170,87,.15)' : 'rgba(124,156,255,.14)' }]}><View style={[styles.liveStatusDot, { backgroundColor: study.checkedIn ? theme.goldStrong : theme.primary }]} /><Text style={[styles.liveStatusText, { color: study.checkedIn ? theme.goldStrong : theme.primaryStrong }]}>{study.checkedIn ? 'FOCUS LIVE' : 'READY'}</Text></View></View>
      <Text style={styles.heroTitle}>{study.checkedIn ? 'Stay in the zone' : `Good morning, ${userName}`}</Text><Text style={[styles.heroCopy, { color: dark ? theme.muted : '#E1E5F0' }]}>{study.checkedIn ? 'Every focused minute is strengthening your consistency.' : 'Check in, protect your streak, and make today count.'}</Text>
      <View style={styles.sessionWrap}><GrandSessionControl active={study.checkedIn} seconds={study.sessionSeconds} onPress={handleSession} /></View>
    </LinearGradient>
    </View>

    <View style={[styles.supportColumn, wide && styles.supportColumnWide]}>
    <Surface style={styles.todayPlanCard}>
      <View pointerEvents="none" style={[styles.planGlow, { backgroundColor: theme.primarySoft }]} /><View pointerEvents="none" style={[styles.planOrbit, { borderColor: theme.lineStrong }]} />
      <View style={styles.planHeader}><View style={[styles.planIcon, { backgroundColor: theme.primarySoft, borderColor: theme.lineStrong }]}><Target color={theme.primaryStrong} size={19} /></View><View style={styles.planHeadingCopy}><Text style={[styles.cardEyebrow, { color: theme.primary }]}>TODAY’S PLAN</Text><Text style={[styles.planTitle, { color: theme.fg }]}>Daily focus</Text></View><View style={[styles.percentBadge, styles.planPercentBadge, { backgroundColor: theme.primarySoft, borderColor: theme.lineStrong }]}><CheckCircle2 color={theme.primaryStrong} size={15} /><Text style={[styles.percentText, { color: theme.primaryStrong }]}>{planPercent}%</Text></View></View>
      <View style={styles.planMetricRow}><View style={styles.planTimeCopy}><Text style={[styles.targetValue, { color: theme.fg }]}>{formatMinutes(study.todayMinutes)} <Text style={[styles.targetSuffix, { color: theme.muted }]}>/ {formatMinutes(dailyTargetMinutes)}</Text></Text><Text style={[styles.planTimeCaption, { color: theme.muted }]}>Focused learning logged today</Text></View><View style={styles.planDial}><View style={[styles.planDialOuter, { borderColor: theme.lineStrong }]} /><View style={[styles.planDialInner, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.planDialValue, { color: theme.fg }]}>{remaining ? formatMinutes(remaining) : 'Done'}</Text><Text style={[styles.planDialLabel, { color: theme.primaryStrong }]}>{remaining ? 'TO GO' : 'GOAL'}</Text></View><View style={[styles.planDialMarkerTrack, { transform: [{ rotate: `${planPercent * 3.6}deg` }] }]}><View style={[styles.planDialMarker, { backgroundColor: theme.primaryStrong }]} /></View></View></View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: planPercent }} style={styles.planSegments}>{Array.from({ length: 12 }, (_, index) => <View key={index} style={[styles.planSegment, { backgroundColor: index < completedPlanSegments ? theme.primary : theme.sunken, borderColor: index < completedPlanSegments ? theme.primaryStrong : theme.line }]} />)}</View>
      <View style={styles.planFooter}><View style={[styles.momentumChip, { backgroundColor: theme.primarySoft }]}><Sparkles color={theme.primaryStrong} size={13} /><Text style={[styles.momentumText, { color: theme.primaryStrong }]}>{momentumLabel}</Text></View><Pressable accessibilityRole="button" onPress={() => router.push('/tracker')} style={({ pressed }) => [styles.trackerLink, pressed && styles.pressed]}><Text style={[styles.textLink, { color: theme.primaryStrong }]}>Open tracker</Text><ArrowUpRight color={theme.primaryStrong} size={14} /></Pressable></View>
    </Surface>

    <AnimatedExamCard examDays={examDays} examName={profile.examName} category={profile.category} examDate={profile.examDate} pressure={demoStudy.exam.pressure} />

    <Surface style={styles.syllabusCard}><View style={[styles.snapshotIcon, { backgroundColor: theme.primarySoft }]}><Target color={theme.primaryStrong} size={20} /></View><View style={styles.syllabusCopy}><Text style={[styles.cardEyebrow, { color: theme.primary }]}>LEARNING PROGRESS</Text><Text style={[styles.syllabusTitle, { color: theme.fg }]}>Syllabus completion</Text><Text style={[styles.snapshotLabel, { color: theme.muted }]}>Keep completing lessons to move this forward.</Text></View><Text style={[styles.syllabusValue, { color: theme.fg }]}>{demoStudy.syllabusPercent}%</Text><View style={styles.syllabusProgress}><ProgressBar value={demoStudy.syllabusPercent} /></View></Surface>
    </View>
    </View>

    <Surface style={styles.todoSurface}>
      <View style={styles.todoHeader}><View style={[styles.todoIcon, { backgroundColor: theme.primarySoft }]}><ListTodo color={theme.primaryStrong} size={21} /></View><View style={styles.todoHeadingCopy}><Text style={[styles.cardEyebrow, { color: theme.primary }]}>TODAY’S ACTIONS</Text><Text style={[styles.cardTitle, { color: theme.fg }]}>Study to-do list</Text><Text style={[styles.todoIntro, { color: theme.muted }]}>{completedTodos === todos.length && todos.length ? 'Everything planned is complete.' : 'Keep today clear, small and achievable.'}</Text></View><View style={[styles.todoScore, { backgroundColor: todoPercent === 100 && todos.length ? theme.successSoft : theme.sunken, borderColor: todoPercent === 100 && todos.length ? theme.success : theme.line }]}><Text style={[styles.todoScoreValue, { color: todoPercent === 100 && todos.length ? theme.success : theme.fg }]}>{completedTodos}/{todos.length}</Text><Text style={[styles.todoScoreLabel, { color: theme.muted }]}>DONE</Text></View></View>
      <View style={[styles.todoProgressTrack, { backgroundColor: theme.sunken }]}><View style={[styles.todoProgressFill, { width: `${todoPercent}%`, backgroundColor: todoPercent === 100 && todos.length ? theme.success : theme.primary }]} /></View>
      <View style={[styles.todoComposer, { backgroundColor: theme.sunken, borderColor: theme.line }]}><TextInput value={todoText} onChangeText={setTodoText} onSubmitEditing={submitTodo} placeholder="Add a study task…" placeholderTextColor={theme.faint} returnKeyType="done" style={[styles.todoInput, { color: theme.fg }]} /><Pressable disabled={!todoText.trim()} accessibilityRole="button" accessibilityLabel="Add to-do" onPress={submitTodo} style={({ pressed }) => [styles.todoAdd, { backgroundColor: todoText.trim() ? theme.primary : theme.line }, !todoText.trim() && styles.todoDisabled, pressed && styles.pressed]}><Plus color={todoText.trim() ? theme.primaryFg : theme.faint} size={18} strokeWidth={2.8} /></Pressable></View>
      <View style={styles.todoList}>{todos.map((todo) => <View key={todo.id} style={[styles.todoRow, { borderTopColor: theme.line }]}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: todo.completed }} accessibilityLabel={`${todo.completed ? 'Mark incomplete' : 'Complete'} ${todo.title}`} onPress={() => toggleTodo(todo.id)} style={[styles.todoCheck, { backgroundColor: todo.completed ? theme.success : theme.sunken, borderColor: todo.completed ? theme.success : theme.lineStrong }]}>{todo.completed ? <CheckCircle2 color={theme.primaryFg} size={17} strokeWidth={2.8} /> : null}</Pressable><Text numberOfLines={2} style={[styles.todoTitle, { color: todo.completed ? theme.faint : theme.fg }, todo.completed && styles.todoTitleDone]}>{todo.title}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${todo.title}`} onPress={() => removeTodo(todo.id)} hitSlop={7} style={({ pressed }) => [styles.todoDelete, pressed && styles.pressed]}><Trash2 color={theme.faint} size={16} /></Pressable></View>)}</View>
      {todos.length === 0 ? <View style={[styles.todoEmpty, { backgroundColor: theme.sunken }]}><Sparkles color={theme.primaryStrong} size={18} /><Text style={[styles.todoEmptyText, { color: theme.muted }]}>Your list is clear. Add one meaningful task for today.</Text></View> : completedTodos > 0 ? <Pressable accessibilityRole="button" onPress={clearCompleted} style={styles.clearTodos}><Text style={[styles.clearTodosText, { color: theme.muted }]}>Clear completed</Text></Pressable> : null}
    </Surface>
  </ScrollView></SafeAreaView><CheckoutCelebration visible={showCelebration} streak={streak} seconds={completedSeconds} pointsEarned={earnedPoints} onClose={() => setShowCelebration(false)} /><RewardWallet visible={showRewards} points={points} hearts={hearts} streak={streak} canRecover={recoveryAvailable} onRecover={() => recoverStreak()} onClose={() => setShowRewards(false)} /></>;
}

function HeroAmbientMotion() {
  const [orbit] = useState(() => new Animated.Value(0));
  const [counterOrbit] = useState(() => new Animated.Value(0));
  const [drift] = useState(() => new Animated.Value(0));
  const [twinkle] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const orbitLoop = Animated.loop(Animated.timing(orbit, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: nativeDriver }));
    const counterLoop = Animated.loop(Animated.timing(counterOrbit, { toValue: 1, duration: 12500, easing: Easing.linear, useNativeDriver: nativeDriver }));
    const driftLoop = Animated.loop(Animated.sequence([
      Animated.timing(drift, { toValue: 1, duration: 2300, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      Animated.timing(drift, { toValue: 0, duration: 2300, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
    ]));
    const twinkleLoop = Animated.loop(Animated.sequence([
      Animated.timing(twinkle, { toValue: 1, duration: 620, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      Animated.timing(twinkle, { toValue: 0, duration: 760, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
    ]));
    orbitLoop.start(); counterLoop.start(); driftLoop.start(); twinkleLoop.start();
    return () => { orbitLoop.stop(); counterLoop.stop(); driftLoop.stop(); twinkleLoop.stop(); };
  }, [counterOrbit, drift, orbit, twinkle]);

  const orbitRotation = orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const counterRotation = counterOrbit.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const gentleSway = drift.interpolate({ inputRange: [0, 1], outputRange: [-7, 8] });
  const gentleRise = drift.interpolate({ inputRange: [0, 1], outputRange: [7, -9] });
  const sparkleScale = twinkle.interpolate({ inputRange: [0, 1], outputRange: [.35, 1.15] });
  const sparkleOpacity = twinkle.interpolate({ inputRange: [0, 1], outputRange: [.18, .9] });

  return <View pointerEvents="none" accessibilityElementsHidden style={styles.heroAmbient}>
    <Animated.View style={[styles.heroTopLeftOrbit, { transform: [{ rotate: counterRotation }] }]}><View style={styles.heroTopLeftRing} /><View style={styles.heroGoldSatellite} /></Animated.View>

    <View style={styles.heroPlanetSystem}>
      <Animated.View style={[styles.heroPlanetOrbitLayer, { transform: [{ rotate: orbitRotation }] }]}><View style={[styles.heroPlanetRing, styles.heroPlanetRingWide]} /><View style={[styles.heroPlanetRing, styles.heroPlanetRingTall]} /><View style={styles.heroPlanetSatellite} /><View style={styles.heroPlanetMoon} /></Animated.View>
      <View style={styles.heroPlanetEye}><Eye size={28} color="rgba(205,211,239,.2)" strokeWidth={1.2} /><View style={styles.heroPlanetEyeCore} /></View>
    </View>

    <View style={styles.heroEyeSystem}>
      <Animated.View style={[styles.heroEyeOrbitLayer, { transform: [{ rotate: counterRotation }] }]}><View style={styles.heroEyeOuterRing} /><View style={styles.heroEyeDashedRing} /><View style={styles.heroEyeSatellite} /></Animated.View>
      <View style={styles.heroEyeIcon}><Eye size={42} color="rgba(205,211,239,.2)" strokeWidth={1.15} /><View style={styles.heroEyeCore} /></View>
    </View>

    <Animated.View style={[styles.heroDriftingDot, styles.heroDriftingDotOne, { transform: [{ translateX: gentleSway }, { translateY: gentleRise }] }]} />
    <Animated.View style={[styles.heroDriftingDot, styles.heroDriftingDotTwo, { opacity: sparkleOpacity, transform: [{ translateX: gentleRise }, { translateY: gentleSway }] }]} />
    <Animated.View style={[styles.heroAmbientSpark, styles.heroAmbientSparkOne, { opacity: sparkleOpacity, transform: [{ scale: sparkleScale }, { rotate: '45deg' }] }]} />
    <Animated.View style={[styles.heroAmbientSpark, styles.heroAmbientSparkTwo, { opacity: twinkle, transform: [{ rotate: '45deg' }] }]} />
  </View>;
}

function RewardHeader({ points, hearts, streak, onPress }: { points: number; hearts: number; streak: number; onPress: () => void }) {
  const { theme } = useAppTheme();
  return <View style={styles.rewardHeader}><View style={styles.rewardHeaderCopy}><Text style={[styles.rewardHeaderEyebrow, { color: theme.primary }]}>YOUR DAY</Text><Text style={[styles.rewardHeaderTitle, { color: theme.fg }]}>Momentum</Text></View><View style={styles.balanceRow}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${streak} day streak. Open rewards`} onPress={onPress} style={({ pressed }) => [styles.balancePill, { backgroundColor: theme.sunken, borderColor: theme.lineStrong }, pressed && styles.balancePressed]}><Flame size={15} fill="#A8AFB8" color="#A8AFB8" /><Text style={[styles.balanceValue, { color: theme.fg }]}>{streak}</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`${points} points. Open rewards`} onPress={onPress} style={({ pressed }) => [styles.balancePill, { backgroundColor: theme.sunken, borderColor: theme.lineStrong }, pressed && styles.balancePressed]}><Coins size={16} fill="#E5B84E" color="#F0C878" /><Text style={[styles.balanceValue, { color: theme.fg }]}>{points}</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`${hearts} recovery hearts. Open rewards`} onPress={onPress} style={({ pressed }) => [styles.balancePill, { backgroundColor: theme.sunken, borderColor: theme.lineStrong }, pressed && styles.balancePressed]}><Heart size={15} fill="#F36F94" color="#FF91AD" /><Text style={[styles.balanceValue, { color: theme.fg }]}>{hearts}</Text></Pressable>
  </View></View>;
}

function RewardWallet({ visible, points, hearts, streak, canRecover, onRecover, onClose }: { visible: boolean; points: number; hearts: number; streak: number; canRecover: boolean; onRecover: () => boolean; onClose: () => void }) {
  const { theme } = useAppTheme();
  const recoveryEnabled = canRecover && hearts > 0;
  return <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
    <View style={styles.walletRoot}><Pressable accessibilityRole="button" accessibilityLabel="Close rewards" onPress={onClose} style={styles.walletBackdrop} /><View style={[styles.walletSheet, { backgroundColor: theme.elevated, borderColor: theme.lineStrong }]}>
      <View style={[styles.walletHandle, { backgroundColor: theme.lineStrong }]} />
      <View style={styles.walletHeading}><View style={styles.walletHeadingCopy}><Text style={[styles.walletEyebrow, { color: theme.primary }]}>MOMENTUM WALLET</Text><Text style={[styles.walletTitle, { color: theme.fg }]}>Rewards that protect progress</Text><Text style={[styles.walletSubtitle, { color: theme.muted }]}>Complete a focused day to earn points. Recovery hearts save a streak after a missed day.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={[styles.walletClose, { backgroundColor: theme.sunken }]}><X size={18} color={theme.muted} /></Pressable></View>

      <View style={styles.walletBalances}><View style={[styles.walletBalance, { backgroundColor: theme.sunken, borderColor: theme.line }]}><Flame size={18} fill={theme.goldStrong} color={theme.goldStrong} /><Text style={[styles.walletBalanceValue, { color: theme.fg }]}>{streak}</Text><Text style={[styles.walletBalanceLabel, { color: theme.muted }]}>Day streak</Text></View><View style={[styles.walletBalance, { backgroundColor: theme.sunken, borderColor: theme.line }]}><Coins size={19} color={theme.goldStrong} /><Text style={[styles.walletBalanceValue, { color: theme.fg }]}>{points}</Text><Text style={[styles.walletBalanceLabel, { color: theme.muted }]}>Points</Text></View><View style={[styles.walletBalance, { backgroundColor: theme.sunken, borderColor: theme.line }]}><Heart size={18} fill="#F36F94" color="#FF91AD" /><Text style={[styles.walletBalanceValue, { color: theme.fg }]}>{hearts}/{monthlyHeartLimit}</Text><Text style={[styles.walletBalanceLabel, { color: theme.muted }]}>Hearts</Text></View></View>

      <View style={styles.pointsRules}><View style={[styles.pointsRule, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.ruleIcon, { backgroundColor: theme.primarySoft }]}><Target size={17} color={theme.primaryStrong} /></View><View style={styles.ruleCopy}><Text style={[styles.ruleTitle, { color: theme.fg }]}>Below your daily target</Text><Text style={[styles.ruleDetail, { color: theme.muted }]}>Complete the day with less study time than planned.</Text></View><Text style={[styles.rulePoints, { color: theme.primaryStrong }]}>+10</Text></View><View style={[styles.pointsRule, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.ruleIcon, { backgroundColor: theme.goldSoft }]}><Award size={17} color={theme.goldStrong} /></View><View style={styles.ruleCopy}><Text style={[styles.ruleTitle, { color: theme.fg }]}>Meet or exceed your target</Text><Text style={[styles.ruleDetail, { color: theme.muted }]}>Reach the full planned study time before checkout.</Text></View><Text style={[styles.rulePoints, { color: theme.goldStrong }]}>+20</Text></View></View>

      <View style={[styles.recoveryCard, { backgroundColor: canRecover ? theme.dangerSoft : theme.successSoft, borderColor: canRecover ? theme.danger : theme.success }]}><View style={[styles.recoveryIcon, { backgroundColor: theme.surface }]}>{canRecover ? <Heart size={21} fill="#F36F94" color="#FF91AD" /> : <ShieldCheck size={21} color={theme.success} />}</View><View style={styles.recoveryCopy}><Text style={[styles.recoveryTitle, { color: theme.fg }]}>{canRecover ? 'Your streak needs recovery' : 'Your streak is protected'}</Text><Text style={[styles.recoveryDetail, { color: theme.muted }]}>{canRecover ? `Use one of this month’s ${monthlyHeartLimit} hearts to restore continuity.` : `Hearts are only used after a missed day and reset to ${monthlyHeartLimit} each month.`}</Text></View></View>
      <Pressable disabled={!recoveryEnabled} accessibilityRole="button" onPress={onRecover} style={({ pressed }) => [styles.recoverButton, { backgroundColor: recoveryEnabled ? theme.primary : theme.sunken, borderColor: recoveryEnabled ? theme.primary : theme.line }, !recoveryEnabled && styles.rewardDisabled, pressed && styles.balancePressed]}><Heart size={17} fill={recoveryEnabled ? theme.primaryFg : theme.faint} color={recoveryEnabled ? theme.primaryFg : theme.faint} /><Text style={[styles.recoverButtonText, { color: recoveryEnabled ? theme.primaryFg : theme.muted }]}>{canRecover ? hearts ? 'Use 1 heart to restore streak' : 'No hearts left this month' : 'No recovery needed today'}</Text></Pressable>
      <Text style={[styles.walletFootnote, { color: theme.faint }]}>Daily points can be earned once per calendar day.</Text>
    </View></View>
  </Modal>;
}

function CheckoutCelebration({ visible, streak, seconds, pointsEarned, onClose }: { visible: boolean; streak: number; seconds: number; pointsEarned: number; onClose: () => void }) {
  const [flameIn] = useState(() => new Animated.Value(0));
  const [numberIn] = useState(() => new Animated.Value(0));
  const [copyIn] = useState(() => new Animated.Value(0));
  const [rewardIn] = useState(() => new Animated.Value(0));
  const [actionsIn] = useState(() => new Animated.Value(0));
  const [burn] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!visible) return;
    flameIn.setValue(0);
    numberIn.setValue(0);
    copyIn.setValue(0);
    rewardIn.setValue(0);
    actionsIn.setValue(0);
    burn.setValue(0);
    const entrance = Animated.stagger(165, [
      Animated.spring(flameIn, { toValue: 1, speed: 12, bounciness: 9, useNativeDriver: nativeDriver }),
      Animated.spring(numberIn, { toValue: 1, speed: 18, bounciness: 8, useNativeDriver: nativeDriver }),
      Animated.timing(copyIn, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }),
      Animated.spring(rewardIn, { toValue: 1, speed: 15, bounciness: 5, useNativeDriver: nativeDriver }),
      Animated.timing(actionsIn, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }),
    ]);
    entrance.start();
    const burnLoop = Animated.loop(Animated.sequence([
      Animated.timing(burn, { toValue: 1, duration: 520, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      Animated.timing(burn, { toValue: 0, duration: 520, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
    ]));
    burnLoop.start();
    return () => { entrance.stop(); burnLoop.stop(); };
  }, [actionsIn, burn, copyIn, flameIn, numberIn, rewardIn, visible]);

  const flameScale = flameIn.interpolate({ inputRange: [0, 1], outputRange: [.18, 1] });
  const flameLift = flameIn.interpolate({ inputRange: [0, 1], outputRange: [72, 0] });
  const flameEntryRotate = flameIn.interpolate({ inputRange: [0, 1], outputRange: ['-10deg', '0deg'] });
  const numberScale = numberIn.interpolate({ inputRange: [0, 1], outputRange: [.2, 1] });
  const copyLift = copyIn.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const rewardLift = rewardIn.interpolate({ inputRange: [0, 1], outputRange: [42, 0] });
  const rewardScale = rewardIn.interpolate({ inputRange: [0, 1], outputRange: [.94, 1] });
  const actionsLift = actionsIn.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });
  const flameStretch = burn.interpolate({ inputRange: [0, 1], outputRange: [.96, 1.045] });
  const flameRotate = burn.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '1.5deg'] });
  const sparkOpacity = burn.interpolate({ inputRange: [0, 1], outputRange: [.25, 1] });
  const shareStreak = () => { void Share.share({ message: `I’m on a ${streak}-day learning streak with Parallax Flow!` }); };

  return <Modal visible={visible} animationType="none" presentationStyle="fullScreen" statusBarTranslucent onRequestClose={onClose}>
    <LinearGradient colors={['#06324A', '#03141E', '#020507', '#000000']} locations={[0, .28, .56, 1]} style={styles.celebrationBackground}>
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.celebrationSafe}>
        <View pointerEvents="none" style={styles.stars}><View style={[styles.star, styles.starOne]} /><View style={[styles.star, styles.starTwo]} /><View style={[styles.star, styles.starThree]} /><View style={[styles.star, styles.starFour]} /><Animated.View style={[styles.spark, styles.sparkOne, { opacity: sparkOpacity }]} /><Animated.View style={[styles.spark, styles.sparkTwo, { opacity: sparkOpacity }]} /></View>
        <View style={styles.celebrationHeader}><Pressable accessibilityRole="button" accessibilityLabel="Close celebration" onPress={onClose} style={styles.celebrationClose}><X size={30} color="#FFFFFF" strokeWidth={2.4} /></Pressable><View style={styles.savedPill}><CheckCircle2 size={14} color="#78DDB4" /><Text style={styles.savedPillText}>SESSION SAVED</Text></View></View>

        <ScrollView style={styles.celebrationScroll} contentContainerStyle={styles.celebrationScrollContent} showsVerticalScrollIndicator={false} bounces={false}>
          <Animated.View style={[styles.celebrationFlameEntrance, { opacity: flameIn, transform: [{ translateY: flameLift }, { scale: flameScale }, { rotate: flameEntryRotate }] }]}>
            <View style={styles.celebrationFlameWrap}>
              <Animated.View style={{ transform: [{ scaleY: flameStretch }, { rotate: flameRotate }] }}><Flame size={205} fill="#FF8614" color="#FF8614" strokeWidth={1.15} /></Animated.View>
              <Animated.View pointerEvents="none" style={[styles.celebrationNumberLayer, styles.celebrationNumberOpticalLayer, { opacity: numberIn, transform: [{ translateX: 10 }, { translateY: 13 }, { scale: numberScale }] }]}><Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={.58} style={[styles.celebrationNumber, styles.celebrationNumberOpticalText, streak > 9 && styles.celebrationNumberDouble, streak > 99 && styles.celebrationNumberTriple]}>{streak}</Text></Animated.View>
              <Animated.View style={[styles.floatingEmber, styles.floatingEmberOne, { opacity: sparkOpacity }]} /><Animated.View style={[styles.floatingEmber, styles.floatingEmberTwo, { opacity: sparkOpacity }]} />
            </View>
          </Animated.View>

          <Animated.View style={[styles.celebrationCopy, { opacity: copyIn, transform: [{ translateY: copyLift }] }]}>
            <Text style={styles.celebrationTitle}>You’re on an awesome{`\n`}{streak} day streak!</Text>
            <Text style={styles.celebrationSubtitle}>Keep this momentum up.</Text>
            <View style={styles.celebrationDivider}><View style={styles.dividerLine} /><Sparkles size={15} color="#596068" /><View style={styles.dividerLine} /></View>
          </Animated.View>

          <Animated.View style={[styles.rewardCard, { opacity: rewardIn, transform: [{ translateY: rewardLift }, { scale: rewardScale }] }]}><View style={styles.rewardCopy}><Text style={styles.rewardEyebrow}>FOCUS COMPLETE</Text><Text style={styles.rewardTitle}>Your effort counts.</Text><Text style={styles.rewardDescription}>{formatDuration(seconds)} has been secured in today’s learning progress.</Text><View style={styles.rewardBadge}><Award size={15} color="#FF9A3D" /><Text style={styles.rewardBadgeText}>{pointsEarned ? `+${pointsEarned} points` : 'Daily reward secured'}</Text></View></View><View style={styles.rewardIcon}><Gift size={44} color="#07101A" strokeWidth={2.4} /></View></Animated.View>
        </ScrollView>

        <Animated.View style={[styles.celebrationActions, { opacity: actionsIn, transform: [{ translateY: actionsLift }] }]}><Pressable accessibilityRole="button" onPress={shareStreak} style={({ pressed }) => [styles.shareButton, pressed && styles.celebrationPressed]}><Share2 size={22} color="#06111A" strokeWidth={2.5} /><Text style={styles.shareText}>Share</Text></Pressable><Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.claimButton, pressed && styles.celebrationPressed]}><Text style={styles.claimText}>Claim reward</Text></Pressable></Animated.View>
      </SafeAreaView>
    </LinearGradient>
  </Modal>;
}

function AnimatedExamCard({ examDays, examName, category, examDate, pressure }: { examDays: number; examName: string; category: string; examDate: string; pressure: number }) {
  const { theme } = useAppTheme();
  const dark = theme.canvas === themes.dark.canvas;
  const [counter] = useState(() => new Animated.Value(365));
  const [displayDays, setDisplayDays] = useState(365);

  useFocusEffect(useCallback(() => {
    const listener = counter.addListener(({ value }) => setDisplayDays(Math.max(0, Math.round(value))));
    counter.setValue(365);
    const animation = Animated.timing(counter, { toValue: examDays, duration: 1100, easing: Easing.linear, useNativeDriver: false });
    animation.start();
    return () => { animation.stop(); counter.removeListener(listener); };
  }, [counter, examDays]));

  return <LinearGradient colors={dark ? ['#251D10', '#16130E', '#111316'] : ['#FFFAED', '#FFFDF7']} style={[styles.examCard, { borderColor: dark ? '#433522' : '#E8DDC4' }]}>
    <View style={styles.examAccent} />
    <View style={styles.examTop}><View style={[styles.examIcon, { backgroundColor: theme.goldSoft }]}><CalendarDays color={theme.goldStrong} size={21} /></View><View style={[styles.pressurePill, { backgroundColor: theme.goldSoft }]}><Text style={[styles.pressureText, { color: theme.goldStrong }]}>PRESSURE {pressure}/100</Text></View></View>
    <Text style={[styles.examEyebrow, { color: theme.goldStrong }]}>{examName.toUpperCase()} · {category.toUpperCase()}</Text>
    <View style={styles.examCountRow}><Text style={[styles.examDays, { color: theme.fg }]}>{displayDays}</Text><View><Text style={[styles.examDaysLabel, { color: theme.fg }]}>days</Text><Text style={[styles.examDaysSubLabel, { color: theme.muted }]}>remaining</Text></View></View>
    <View style={styles.examFooter}><Text style={[styles.examDate, { color: theme.muted }]}>Exam date · {examDate}</Text><Text style={[styles.examMotionLabel, { color: theme.goldStrong }]}>365 → {examDays}</Text></View>
    <View style={styles.progressGap}><ProgressBar value={pressure} color={theme.gold} /></View>
  </LinearGradient>;
}

const styles = StyleSheet.create({
  activeCalendarNumberLayer: { transform: [{ translateX: 2 }, { translateY: 4 }] },
  fireDayTextOptical: { width: 18, color: '#160C04', fontFamily: font.extraBold, fontSize: 9, lineHeight: 11, letterSpacing: -.2, textAlign: 'center' },
  fireDayTextDoubleOptical: { fontSize: 7, lineHeight: 9, letterSpacing: -.65 },
  celebrationNumberOpticalLayer: { paddingTop: 0, paddingHorizontal: 48 },
  celebrationNumberOpticalText: { width: '100%', fontSize: 48, lineHeight: 54, letterSpacing: -1, textAlign: 'center' },
  celebrationNumberDouble: { fontSize: 40, lineHeight: 47, letterSpacing: -1.5 },
  celebrationNumberTriple: { fontSize: 32, lineHeight: 39, letterSpacing: -1.8 },
  heroAmbient: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
  heroTopLeftOrbit: { position: 'absolute', width: 142, height: 142, left: -73, top: -73, alignItems: 'center' },
  heroTopLeftRing: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 1, borderColor: 'rgba(224,190,118,.22)' },
  heroGoldSatellite: { width: 7, height: 7, marginTop: -3, borderRadius: 4, backgroundColor: '#D6B46C' },
  heroPlanetSystem: { position: 'absolute', width: 154, height: 154, right: -29, top: -31, alignItems: 'center', justifyContent: 'center' },
  heroPlanetOrbitLayer: { position: 'absolute', width: 154, height: 154, alignItems: 'center', justifyContent: 'center' },
  heroPlanetRing: { position: 'absolute', borderWidth: 1, borderColor: 'rgba(205,211,239,.16)', borderRadius: 90 },
  heroPlanetRingWide: { width: 145, height: 66, transform: [{ rotate: '18deg' }] },
  heroPlanetRingTall: { width: 68, height: 142, transform: [{ rotate: '31deg' }] },
  heroPlanetSatellite: { position: 'absolute', width: 9, height: 9, top: 10, left: 73, borderRadius: 5, backgroundColor: '#D6B46C' },
  heroPlanetMoon: { position: 'absolute', width: 4, height: 4, right: 18, top: 67, borderRadius: 2, backgroundColor: 'rgba(235,238,255,.72)' },
  heroPlanetEye: { width: 74, height: 46, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-16deg' }] },
  heroPlanetEyeCore: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#D6B46C' },
  heroEyeSystem: { position: 'absolute', width: 154, height: 154, left: -35, bottom: 57, alignItems: 'center', justifyContent: 'center' },
  heroEyeOrbitLayer: { position: 'absolute', width: 154, height: 154, alignItems: 'center' },
  heroEyeOuterRing: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderColor: 'rgba(205,211,239,.15)' },
  heroEyeDashedRing: { position: 'absolute', width: 112, height: 112, top: 21, borderRadius: 56, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(205,211,239,.14)' },
  heroEyeSatellite: { width: 7, height: 7, marginTop: -3, borderRadius: 4, backgroundColor: 'rgba(205,211,239,.3)' },
  heroEyeIcon: { width: 82, height: 55, alignItems: 'center', justifyContent: 'center' },
  heroEyeCore: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#D6B46C' },
  heroDriftingDot: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#D6B46C' },
  heroDriftingDotOne: { top: 98, right: 72 },
  heroDriftingDotTwo: { width: 5, height: 5, top: 154, left: 56, backgroundColor: 'rgba(235,238,255,.65)' },
  heroAmbientSpark: { position: 'absolute', width: 7, height: 7, borderRadius: 1, backgroundColor: '#D6B46C' },
  heroAmbientSparkOne: { top: 76, right: 104 },
  heroAmbientSparkTwo: { width: 5, height: 5, bottom: 118, left: 24, backgroundColor: 'rgba(185,199,255,.55)' },
  todayPlanCard: { minHeight: 198, padding: 15, overflow: 'hidden' },
  planGlow: { position: 'absolute', width: 150, height: 150, borderRadius: 75, right: -76, top: -83, opacity: .55 },
  planOrbit: { position: 'absolute', width: 106, height: 106, borderRadius: 53, borderWidth: 1, right: -39, top: -50, opacity: .38 },
  planHeader: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 9 },
  planIcon: { width: 40, height: 40, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  planHeadingCopy: { flex: 1, minWidth: 0 },
  planTitle: { marginTop: 2, fontFamily: font.extraBold, fontSize: 14, letterSpacing: -.25 },
  planPercentBadge: { borderWidth: 1 },
  planMetricRow: { minHeight: 82, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  planTimeCopy: { flex: 1, minWidth: 0 },
  planTimeCaption: { marginTop: 4, fontFamily: font.regular, fontSize: 8, lineHeight: 12 },
  planDial: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  planDialOuter: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 1, borderStyle: 'dashed' },
  planDialInner: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  planDialValue: { width: 50, paddingHorizontal: 2, fontFamily: font.extraBold, fontSize: 11, letterSpacing: -.25, textAlign: 'center' },
  planDialLabel: { marginTop: 1, fontFamily: font.bold, fontSize: 6, letterSpacing: .9 },
  planDialMarkerTrack: { position: 'absolute', width: 72, height: 72, alignItems: 'center' },
  planDialMarker: { width: 8, height: 8, marginTop: -3, borderRadius: 4, borderWidth: 2, borderColor: '#111316' },
  planSegments: { width: '100%', height: 13, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 4 },
  planSegment: { flex: 1, height: 8, minWidth: 3, borderWidth: 1, borderRadius: 4 },
  planFooter: { minHeight: 35, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  momentumChip: { minHeight: 27, borderRadius: radius.pill, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
  momentumText: { fontFamily: font.bold, fontSize: 8 },
  trackerLink: { minHeight: 32, paddingLeft: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  todoSurface: { overflow: 'hidden' },
  todoHeader: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 10 },
  todoIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  todoHeadingCopy: { flex: 1, minWidth: 0 },
  todoIntro: { marginTop: 3, fontFamily: font.regular, fontSize: 9, lineHeight: 13 },
  todoScore: { minWidth: 49, height: 45, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  todoScoreValue: { fontFamily: font.extraBold, fontSize: 13, lineHeight: 16 }, todoScoreLabel: { fontFamily: font.bold, fontSize: 6, letterSpacing: .7 },
  todoProgressTrack: { height: 5, marginTop: 10, borderRadius: 3, overflow: 'hidden' }, todoProgressFill: { height: '100%', borderRadius: 3 },
  todoComposer: { minHeight: 48, marginTop: 12, borderWidth: 1, borderRadius: 14, paddingLeft: 12, paddingRight: 5, flexDirection: 'row', alignItems: 'center', gap: 8 },
  todoInput: { flex: 1, minWidth: 0, minHeight: 44, paddingVertical: 0, fontFamily: font.semibold, fontSize: 11 }, todoAdd: { width: 37, height: 37, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, todoDisabled: { opacity: .62 },
  todoList: { marginTop: 7 }, todoRow: { minHeight: 52, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  todoCheck: { width: 26, height: 26, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, todoTitle: { flex: 1, minWidth: 0, fontFamily: font.semibold, fontSize: 11, lineHeight: 16 }, todoTitleDone: { textDecorationLine: 'line-through' }, todoDelete: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  todoEmpty: { minHeight: 61, marginTop: 9, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, todoEmptyText: { flex: 1, fontFamily: font.regular, fontSize: 9, lineHeight: 14 },
  clearTodos: { minHeight: 31, alignSelf: 'flex-end', justifyContent: 'center', paddingLeft: 10 }, clearTodosText: { fontFamily: font.bold, fontSize: 8 },
  celebrationScroll: { flex: 1, width: '100%' },
  celebrationScrollContent: { flexGrow: 1, width: '100%', maxWidth: 540, alignSelf: 'center', alignItems: 'center', paddingTop: 2, paddingBottom: 14 },
  celebrationFlameEntrance: { alignItems: 'center', justifyContent: 'center' },
  celebrationCopy: { width: '100%', alignItems: 'center' },
  safe: { flex: 1 }, content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 108, maxWidth: 680, width: '100%', alignSelf: 'center' }, contentWide: { maxWidth: layout.studentContentMaxWidth, paddingHorizontal: spacing.xl }, dashboardLead: { gap: spacing.lg }, dashboardLeadWide: { flexDirection: 'row', alignItems: 'stretch' }, heroColumn: { width: '100%' }, heroColumnWide: { flex: 1.06, minWidth: 0 }, supportColumn: { width: '100%', gap: spacing.lg }, supportColumnWide: { flex: .94, minWidth: 0 }, surface: { borderWidth: 1, borderRadius: 19, padding: 14, shadowColor: '#000000', shadowOpacity: .1, shadowRadius: 15, shadowOffset: { width: 0, height: 7 }, elevation: 2 },
  rewardHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 }, rewardHeaderCopy: { flex: 1, minWidth: 58 }, rewardHeaderEyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1.15 }, rewardHeaderTitle: { marginTop: 2, fontFamily: font.extraBold, fontSize: 16, letterSpacing: -.3 }, balanceRow: { flexDirection: 'row', gap: 6 }, balancePill: { minWidth: 55, height: 35, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 }, balanceValue: { fontFamily: font.extraBold, fontSize: 11 }, balancePressed: { opacity: .7, transform: [{ scale: .97 }] },
  walletRoot: { flex: 1, justifyContent: 'flex-end' }, walletBackdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,.72)' }, walletSheet: { width: '100%', maxWidth: 680, alignSelf: 'center', borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: spacing.lg, paddingBottom: 28 }, walletHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 }, walletHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, walletHeadingCopy: { flex: 1, minWidth: 0 }, walletEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, walletTitle: { marginTop: 4, fontFamily: font.extraBold, fontSize: 19, lineHeight: 25, letterSpacing: -.4 }, walletSubtitle: { marginTop: 4, maxWidth: 420, fontFamily: font.regular, fontSize: 9, lineHeight: 14 }, walletClose: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, walletBalances: { marginTop: 15, flexDirection: 'row', gap: 8 }, walletBalance: { flex: 1, minWidth: 0, minHeight: 86, borderWidth: 1, borderRadius: 15, padding: 10 }, walletBalanceValue: { marginTop: 6, fontFamily: font.extraBold, fontSize: 17, letterSpacing: -.35 }, walletBalanceLabel: { marginTop: 2, fontFamily: font.medium, fontSize: 8 }, pointsRules: { marginTop: 12, gap: 7 }, pointsRule: { minHeight: 66, borderWidth: 1, borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 9 }, ruleIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, ruleCopy: { flex: 1, minWidth: 0 }, ruleTitle: { fontFamily: font.bold, fontSize: 11 }, ruleDetail: { marginTop: 2, fontFamily: font.regular, fontSize: 8, lineHeight: 12 }, rulePoints: { fontFamily: font.extraBold, fontSize: 16 }, recoveryCard: { minHeight: 76, marginTop: 12, borderWidth: 1, borderRadius: 15, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, recoveryIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, recoveryCopy: { flex: 1, minWidth: 0 }, recoveryTitle: { fontFamily: font.bold, fontSize: 11 }, recoveryDetail: { marginTop: 3, fontFamily: font.regular, fontSize: 8, lineHeight: 13 }, recoverButton: { minHeight: 46, marginTop: 10, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, recoverButtonText: { fontFamily: font.bold, fontSize: 10 }, rewardDisabled: { opacity: .58 }, walletFootnote: { marginTop: 8, textAlign: 'center', fontFamily: font.regular, fontSize: 8 },
  hero: { minHeight: 455, borderWidth: 1, borderRadius: 25, padding: 17, overflow: 'hidden' }, heroWide: { flex: 1 }, heroGlowOne: { position: 'absolute', width: 250, height: 250, borderRadius: 125, right: -120, top: -110, backgroundColor: 'rgba(124,156,255,.14)' }, heroGlowTwo: { position: 'absolute', width: 220, height: 220, borderRadius: 110, left: -135, bottom: -105, borderWidth: 1, borderColor: 'rgba(217,170,87,.18)' }, heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, date: { flex: 1, fontFamily: font.bold, fontSize: 9, letterSpacing: 1.05 }, liveStatus: { minHeight: 29, borderRadius: radius.pill, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, liveStatusDot: { width: 6, height: 6, borderRadius: 3 }, liveStatusText: { fontFamily: font.bold, fontSize: 8, letterSpacing: .75 }, heroTitle: { color: '#FFFFFF', fontFamily: font.extraBold, fontSize: 27, lineHeight: 34, letterSpacing: -.8, textAlign: 'center', marginTop: 16 }, heroCopy: { maxWidth: 310, alignSelf: 'center', fontFamily: font.regular, fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 4 }, sessionWrap: { flex: 1, minHeight: 272, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  sessionStage: { width: 238, height: 238, alignItems: 'center', justifyContent: 'center' }, sessionHalo: { position: 'absolute', width: 224, height: 224, borderRadius: 112, borderWidth: 14 }, sessionBurst: { position: 'absolute', width: 196, height: 196, borderRadius: 98, borderWidth: 3 }, sessionOrbit: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, borderStyle: 'dashed' }, orbitDot: { position: 'absolute', width: 11, height: 11, borderRadius: 6, top: -6, left: 104, shadowOpacity: .8, shadowRadius: 9, shadowOffset: { width: 0, height: 0 }, elevation: 5 }, sessionCore: { width: 184, height: 184, borderRadius: 92, borderWidth: 2, alignItems: 'center', justifyContent: 'center' }, sessionEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.25 }, sessionActionIcon: { width: 49, height: 49, marginTop: 9, borderRadius: 25, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: .28, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 }, sessionValue: { color: '#FFFFFF', marginTop: 8, fontFamily: font.extraBold, fontSize: 19, letterSpacing: -.35 }, sessionHint: { marginTop: 3, fontFamily: font.medium, fontSize: 8 },
  targetHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, cardEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.1 }, targetValue: { fontFamily: font.extraBold, fontSize: 27, letterSpacing: -.7, marginTop: 4 }, targetSuffix: { fontFamily: font.medium, fontSize: 13, letterSpacing: 0 }, percentBadge: { minHeight: 32, borderRadius: 16, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, percentText: { fontFamily: font.bold, fontSize: 10 }, progressGap: { marginTop: 13 }, targetFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 }, smallCopy: { fontFamily: font.regular, fontSize: 10 }, textLink: { fontFamily: font.bold, fontSize: 10 },
  streakCard: { padding: 15 }, streakHero: { minHeight: 94, flexDirection: 'row', alignItems: 'center', gap: 13 }, streakButtonWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' }, streakFlameGlow: { position: 'absolute', width: 60, height: 64, alignItems: 'center', justifyContent: 'flex-end' }, streakButton: { width: 60, height: 66, alignItems: 'center', justifyContent: 'flex-end' }, flameOuter: { height: 49, alignItems: 'center', justifyContent: 'flex-end' }, flameInner: { position: 'absolute', bottom: 10 }, emberOne: { position: 'absolute', width: 4, height: 4, borderRadius: 2, top: 3, right: 10 }, emberTwo: { position: 'absolute', width: 3, height: 3, borderRadius: 2, top: 10, left: 11 }, streakCopy: { flex: 1, minWidth: 0 }, streakEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.15 }, streakTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 22, letterSpacing: -.55 }, streakDescription: { marginTop: 3, fontFamily: font.regular, fontSize: 9, lineHeight: 14 }, calendarPanel: { marginTop: 13, borderWidth: 1, borderRadius: 19, padding: 13 }, calendarHeader: { minHeight: 51, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, calendarMonth: { fontFamily: font.extraBold, fontSize: 17, letterSpacing: -.25 }, calendarHint: { marginTop: 3, fontFamily: font.regular, fontSize: 8 }, monthActions: { flexDirection: 'row', gap: 6 }, monthButton: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, weekRow: { flexDirection: 'row', marginTop: 14, marginBottom: 7 }, weekDay: { width: '14.285%', fontFamily: font.bold, fontSize: 7, letterSpacing: .35, textAlign: 'center' }, calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, dayCell: { width: '14.285%', height: 46, alignItems: 'center', justifyContent: 'center' }, dayBadge: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' }, dayFlame: { position: 'absolute', top: -1 }, calendarNumberLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' }, dayText: { fontFamily: font.bold, fontSize: 10, lineHeight: 12, textAlign: 'center' }, fireDayText: { color: '#160C04', fontFamily: font.extraBold, fontSize: 10, lineHeight: 11 }, fireDayTextDouble: { fontSize: 8, letterSpacing: -.4 }, todayFireText: { fontSize: 10 }, missedDot: { position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: 2 }, streakFooter: { minHeight: 44, marginTop: 11, borderRadius: 13, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 }, streakFooterText: { fontFamily: font.bold, fontSize: 9 }, streakFooterDivider: { width: 1, height: 15, opacity: .28 }, missedLegendDot: { width: 5, height: 5, borderRadius: 3 }, streakFooterMuted: { flex: 1, fontFamily: font.medium, fontSize: 8 },
  celebrationBackground: { flex: 1 }, celebrationSafe: { flex: 1, paddingHorizontal: spacing.lg }, stars: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }, star: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.72)' }, starOne: { top: '8%', left: '18%' }, starTwo: { top: '14%', right: '22%' }, starThree: { top: '23%', left: '35%' }, starFour: { top: '18%', right: '42%', width: 2, height: 2 }, spark: { position: 'absolute', width: 7, height: 7, borderRadius: 2, backgroundColor: '#FF8A1F', transform: [{ rotate: '20deg' }] }, sparkOne: { top: '25%', left: '26%' }, sparkTwo: { top: '21%', right: '27%', width: 5, height: 5 }, celebrationHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, celebrationClose: { width: 45, height: 45, alignItems: 'center', justifyContent: 'center' }, savedPill: { minHeight: 31, borderRadius: radius.pill, paddingHorizontal: 10, backgroundColor: 'rgba(103,214,167,.12)', borderWidth: 1, borderColor: 'rgba(103,214,167,.3)', flexDirection: 'row', alignItems: 'center', gap: 5 }, savedPillText: { color: '#78DDB4', fontFamily: font.bold, fontSize: 8, letterSpacing: .7 }, celebrationBody: { flex: 1, width: '100%', maxWidth: 540, alignSelf: 'center', alignItems: 'center', paddingTop: 2 }, celebrationFlameWrap: { width: 220, height: 215, alignItems: 'center', justifyContent: 'center' }, flameAura: { position: 'absolute', width: 184, height: 184, borderRadius: 92, backgroundColor: 'rgba(255,134,20,.11)', shadowColor: '#FF8614', shadowOpacity: .48, shadowRadius: 34, shadowOffset: { width: 0, height: 0 }, elevation: 7 }, celebrationNumberLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', paddingTop: 34 }, celebrationNumber: { color: '#050505', fontFamily: font.extraBold, fontSize: 54, lineHeight: 62, letterSpacing: -2, textAlign: 'center' }, floatingEmber: { position: 'absolute', borderRadius: 4, backgroundColor: '#FF8614' }, floatingEmberOne: { width: 14, height: 14, top: 38, right: 23, transform: [{ rotate: '32deg' }] }, floatingEmberTwo: { width: 9, height: 9, top: 64, left: 29, backgroundColor: '#D99B41', transform: [{ rotate: '14deg' }] }, celebrationTitle: { color: '#FFFFFF', marginTop: -4, fontFamily: font.extraBold, fontSize: 28, lineHeight: 36, letterSpacing: -.7, textAlign: 'center' }, celebrationSubtitle: { color: '#9DA4AA', marginTop: 6, fontFamily: font.bold, fontSize: 12, textAlign: 'center' }, celebrationDivider: { width: 142, height: 29, marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8 }, dividerLine: { flex: 1, height: 2, borderRadius: 1, backgroundColor: '#343A40' }, rewardCard: { width: '100%', minHeight: 130, marginTop: 5, borderWidth: 2, borderColor: '#FF8614', borderRadius: 20, backgroundColor: 'rgba(9,11,13,.9)', padding: 15, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden' }, rewardCopy: { flex: 1, minWidth: 0 }, rewardEyebrow: { color: '#FF9A3D', fontFamily: font.bold, fontSize: 8, letterSpacing: 1.1 }, rewardTitle: { color: '#FFFFFF', marginTop: 4, fontFamily: font.extraBold, fontSize: 18 }, rewardDescription: { color: '#AEB3B8', marginTop: 5, fontFamily: font.regular, fontSize: 9, lineHeight: 14 }, rewardBadge: { alignSelf: 'flex-start', minHeight: 28, marginTop: 9, borderRadius: radius.pill, paddingHorizontal: 9, backgroundColor: 'rgba(255,134,20,.13)', flexDirection: 'row', alignItems: 'center', gap: 5 }, rewardBadgeText: { color: '#FF9A3D', fontFamily: font.bold, fontSize: 9 }, rewardIcon: { width: 68, height: 68, marginRight: -4, borderRadius: 22, backgroundColor: '#FF9A3D', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] }, celebrationActions: { width: '100%', maxWidth: 540, minHeight: 78, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10 }, shareButton: { flex: 1, minHeight: 54, borderRadius: 16, backgroundColor: '#29AFF3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, shareText: { color: '#06111A', fontFamily: font.extraBold, fontSize: 17 }, claimButton: { flex: 1, minHeight: 54, borderRadius: 16, borderWidth: 2, borderColor: '#29AFF3', alignItems: 'center', justifyContent: 'center' }, claimText: { color: '#29AFF3', fontFamily: font.bold, fontSize: 15 }, celebrationPressed: { opacity: .74, transform: [{ scale: .98 }] },
  examCard: { minHeight: 238, borderWidth: 1, borderRadius: 21, padding: 15, overflow: 'hidden' }, examAccent: { position: 'absolute', width: 160, height: 160, borderRadius: 80, right: -74, bottom: -70, backgroundColor: 'rgba(217,170,87,.08)' }, examTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, examIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, pressurePill: { minHeight: 29, borderRadius: 15, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }, pressureText: { fontFamily: font.bold, fontSize: 8, letterSpacing: .45 }, examEyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.05, marginTop: 14 }, examCountRow: { marginTop: 2, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }, examDays: { fontFamily: font.extraBold, fontSize: 48, lineHeight: 57, letterSpacing: -1.7 }, examDaysLabel: { fontFamily: font.bold, fontSize: 14, marginBottom: 15 }, examDaysSubLabel: { fontFamily: font.regular, fontSize: 8, marginBottom: 3, marginTop: -13 }, examFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, examDate: { fontFamily: font.regular, fontSize: 9 }, examMotionLabel: { fontFamily: font.bold, fontSize: 8 },
  syllabusCard: { minHeight: 105, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }, snapshotIcon: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, syllabusCopy: { flex: 1, minWidth: 0 }, syllabusTitle: { marginTop: 3, fontFamily: font.bold, fontSize: 13 }, snapshotLabel: { fontFamily: font.regular, fontSize: 9, marginTop: 2 }, syllabusValue: { fontFamily: font.extraBold, fontSize: 23, letterSpacing: -.5 }, syllabusProgress: { width: '100%', marginTop: 2 }, cardTitle: { fontFamily: font.extraBold, fontSize: 18, letterSpacing: -.35, marginTop: 3 }, pressed: { opacity: .75 },
});
