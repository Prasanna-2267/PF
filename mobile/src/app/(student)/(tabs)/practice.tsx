import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowUpRight, BarChart3, BookOpen, CheckCircle2, CircleHelp, Clock3, Crown, Flag, Layers3, LockKeyhole, Minus, PenLine, Play, Plus, RotateCcw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, Card } from '@/components/ui';
import { font, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { practiceSubjects } from '@/lib/demo-practice';
import { usePracticeProgressStore } from '@/lib/practice-progress-store';
import { useAppTheme } from '@/providers/app-providers';

type PracticeMode = 'mcq' | 'written';
const nativeDriver = Platform.OS !== 'web';

export default function PracticeScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const plan = useAuthStore((state) => state.user?.plan ?? 'free');
  const paid = plan === 'paid';
  const practiceProgress = usePracticeProgressStore((state) => state.byQuestionId);
  const recordAnswer = usePracticeProgressStore((state) => state.recordAnswer);
  const [mode, setMode] = useState<PracticeMode>('mcq');
  const [subjectId, setSubjectId] = useState(practiceSubjects[0].id);
  const subject = practiceSubjects.find((item) => item.id === subjectId) ?? practiceSubjects[0];
  const [topicId, setTopicId] = useState(subject.topics[0].id);
  const topic = subject.topics.find((item) => item.id === topicId) ?? subject.topics[0];
  const questions = topic.questions;
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());
  const [timerDuration, setTimerDuration] = useState<number | null>(10 * 60);
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [written, setWritten] = useState('');
  const [writtenSubmitted, setWrittenSubmitted] = useState(false);
  const [explanationQuestionId, setExplanationQuestionId] = useState<string | null>(null);
  const question = questions[Math.min(current, questions.length - 1)];
  const selected = answers[question.id];
  const isSubmitted = submitted.has(question.id);
  const persistentResult = practiceProgress[question.id];
  const lockedWrong = !paid && Boolean(persistentResult?.lockedWrong);
  const submittedWrong = isSubmitted && selected !== question.answer;
  const canRetry = paid && submittedWrong;
  const answeredCount = questions.filter((item) => Boolean(answers[item.id])).length;
  const progress = Math.round((answeredCount / Math.max(questions.length, 1)) * 100);

  useEffect(() => {
    if (!started || mode !== 'mcq' || timerDuration === null || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, [mode, started, timerDuration, timeLeft]);

  const clock = useMemo(() => formatCountdown(timeLeft), [timeLeft]);
  const clearAttempt = () => { setStarted(false); setCurrent(0); setAnswers({}); setMarked(new Set()); setSubmitted(new Set()); setWritten(''); setWrittenSubmitted(false); setExplanationQuestionId(null); setTimeLeft(timerDuration ?? 0); };
  const chooseSubject = (nextId: string) => { const next = practiceSubjects.find((item) => item.id === nextId) ?? practiceSubjects[0]; setSubjectId(next.id); setTopicId(next.topics[0].id); clearAttempt(); };
  const chooseTopic = (nextId: string) => { setTopicId(nextId); clearAttempt(); };
  const chooseMode = (nextMode: PracticeMode) => { setMode(nextMode); clearAttempt(); };
  const changeTimer = (seconds: number | null) => { setTimerDuration(seconds); setTimeLeft(seconds ?? 0); };
  const startSession = () => { if (mode === 'mcq' && timerDuration !== null && timerDuration <= 0) return; setCurrent(0); setAnswers({}); setMarked(new Set()); setSubmitted(new Set()); setWritten(''); setWrittenSubmitted(false); setExplanationQuestionId(null); setTimeLeft(timerDuration ?? 0); setStarted(true); };
  const selectAnswer = (option: string) => {
    if (lockedWrong || (timerDuration !== null && timeLeft === 0)) return;
    if (canRetry) {
      setSubmitted((value) => { const next = new Set(value); next.delete(question.id); return next; });
      setExplanationQuestionId(null);
      setAnswers((value) => ({ ...value, [question.id]: option }));
      return;
    }
    if (!isSubmitted) setAnswers((value) => ({ ...value, [question.id]: option }));
  };
  const toggleReview = () => setMarked((value) => { const next = new Set(value); if (next.has(question.id)) next.delete(question.id); else next.add(question.id); return next; });
  const navigateToQuestion = (index: number) => { setExplanationQuestionId(null); setCurrent(Math.max(0, Math.min(index, questions.length - 1))); };
  const submitAnswer = () => {
    if (!selected || isSubmitted || lockedWrong) return;
    const correct = selected === question.answer;
    setSubmitted((value) => new Set(value).add(question.id));
    const explanationShown = paid || correct;
    setExplanationQuestionId(explanationShown ? question.id : null);
    recordAnswer({ questionId: question.id, subjectId: subject.id, topicId: topic.id, correct, lockWrong: !paid, explanationShown });
  };

  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.canvas }]}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.practiceHeading}><View style={styles.practiceHeadingCopy}><View style={styles.eyebrowRow}><Text style={[styles.eyebrow, { color: theme.primary }]}>FOCUSED PRACTICE</Text><View style={[styles.planPill, { backgroundColor: paid ? theme.goldSoft : theme.sunken }]}>{paid ? <Crown size={10} color={theme.goldStrong} /> : null}<Text style={[styles.planText, { color: paid ? theme.goldStrong : theme.muted }]}>{paid ? 'PAID' : 'FREE'}</Text></View></View><Text style={[styles.title, { color: theme.fg }]}>Practice</Text><Text style={[styles.description, { color: theme.muted }]}>Choose a subject and topic before starting. Every question in the set will stay within that topic.</Text></View><PracticeTrackerShortcut onPress={() => router.push('/practice-tracker' as never)} /></View>

    {!started ? <Card style={styles.builderCard}>
      <View style={styles.builderHeading}><View style={[styles.builderIcon, { backgroundColor: theme.primarySoft }]}><Layers3 size={20} color={theme.primaryStrong} /></View><View style={styles.builderCopy}><Text style={[styles.builderTitle, { color: theme.fg }]}>Build your practice set</Text><Text style={[styles.builderHint, { color: theme.muted }]}>Subject → topic → session</Text></View>{started ? <View style={[styles.livePill, { backgroundColor: theme.successSoft }]}><View style={[styles.liveDot, { backgroundColor: theme.success }]} /><Text style={[styles.liveText, { color: theme.success }]}>LIVE</Text></View> : null}</View>
      <Text style={[styles.stepLabel, { color: theme.muted }]}>1 · SUBJECT</Text>
      <View style={styles.choiceGrid}>{practiceSubjects.map((item) => { const active = item.id === subject.id; return <Pressable key={item.id} onPress={() => chooseSubject(item.id)} style={[styles.subjectChoice, { backgroundColor: active ? theme.primarySoft : theme.sunken, borderColor: active ? theme.primary : theme.line }]}><BookOpen size={15} color={active ? theme.primaryStrong : theme.faint} /><Text numberOfLines={1} style={[styles.subjectChoiceText, { color: active ? theme.primaryStrong : theme.muted }]}>{item.title}</Text></Pressable>; })}</View>
      <Text style={[styles.stepLabel, { color: theme.muted }]}>2 · TOPIC</Text>
      <View style={styles.topicList}>{subject.topics.map((item) => { const active = item.id === topic.id; return <Pressable key={item.id} onPress={() => chooseTopic(item.id)} style={[styles.topicChoice, { backgroundColor: active ? theme.primarySoft : theme.surface, borderColor: active ? theme.primary : theme.line }]}><View style={[styles.topicRadio, { borderColor: active ? theme.primary : theme.faint, backgroundColor: active ? theme.primary : 'transparent' }]}>{active ? <CheckCircle2 size={12} color={theme.primaryFg} /> : null}</View><Text style={[styles.topicChoiceText, { color: active ? theme.fg : theme.muted }]}>{item.title}</Text><Text style={[styles.questionCount, { color: theme.faint }]}>{item.questions.length} Q</Text></Pressable>; })}</View>
      <Text style={[styles.stepLabel, { color: theme.muted }]}>3 · FORMAT</Text>
      <View style={[styles.segment, { backgroundColor: theme.sunken }]}><Pressable onPress={() => chooseMode('mcq')} style={[styles.segmentButton, mode === 'mcq' && { backgroundColor: theme.surface, borderColor: theme.line }]}><CircleHelp size={16} color={mode === 'mcq' ? theme.primaryStrong : theme.muted} /><Text style={[styles.segmentText, { color: mode === 'mcq' ? theme.primaryStrong : theme.muted }]}>MCQ set</Text></Pressable><Pressable onPress={() => chooseMode('written')} style={[styles.segmentButton, mode === 'written' && { backgroundColor: theme.surface, borderColor: theme.line }]}><PenLine size={16} color={mode === 'written' ? theme.primaryStrong : theme.muted} /><Text style={[styles.segmentText, { color: mode === 'written' ? theme.primaryStrong : theme.muted }]}>Written</Text></Pressable></View>
      {mode === 'mcq' ? <><Text style={[styles.stepLabel, { color: theme.muted }]}>4 · CUSTOM TIMER</Text><CustomTimer duration={timerDuration} onChange={changeTimer} /></> : null}
      <Pressable disabled={mode === 'mcq' && timerDuration !== null && timerDuration <= 0} onPress={startSession} style={({ pressed }) => [styles.startButton, { backgroundColor: theme.primary }, mode === 'mcq' && timerDuration !== null && timerDuration <= 0 && styles.disabled, pressed && styles.pressed]}><Play size={18} fill={theme.primaryFg} color={theme.primaryFg} /><Text style={[styles.startText, { color: theme.primaryFg }]}>Start {mode === 'mcq' ? `${questions.length}-question` : 'written'} session</Text></Pressable>
    </Card> : <SessionSummary subject={subject.title} topic={topic.title} mode={mode} timer={timerDuration === null || mode === 'written' ? 'Untimed' : clock} answered={answeredCount} total={questions.length} reviewCount={marked.size} words={written.trim() ? written.trim().split(/\s+/).length : 0} writtenSubmitted={writtenSubmitted} onChange={clearAttempt} />}

    {started && mode === 'mcq' ? <>
      <Card><View style={styles.progressHeader}><View><Text style={[styles.cardLabel, { color: theme.fg }]}>Question navigator</Text><Text style={[styles.progressCopy, { color: theme.muted }]}>{answeredCount} answered of {questions.length} · {topic.title}</Text></View><Text style={[styles.progressValue, { color: theme.primaryStrong }]}>{progress}%</Text></View><View style={[styles.progressTrack, { backgroundColor: theme.sunken }]}><View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${progress}%` }]} /></View><View style={styles.legend}><Legend color={theme.success} label="Answered" /><Legend color={theme.goldStrong} label="Review" />{!paid ? <Legend color={theme.danger} label="Free attempt closed" /> : null}<Legend color={theme.faint} label="Unanswered" /></View><View style={styles.navigator}>{questions.map((item, index) => { const answered = Boolean(answers[item.id]); const review = marked.has(item.id); const wrongLocked = !paid && Boolean(practiceProgress[item.id]?.lockedWrong); const active = index === current; const backgroundColor = active ? theme.primary : wrongLocked ? theme.dangerSoft : review ? theme.goldSoft : answered ? theme.successSoft : theme.surface; const borderColor = active ? theme.primary : wrongLocked ? theme.danger : review ? theme.goldStrong : answered ? theme.success : theme.line; return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Question ${index + 1}${answered ? ', answered' : ''}${review ? ', marked for review' : ''}${wrongLocked ? ', incorrect attempt closed' : ''}`} onPress={() => navigateToQuestion(index)} style={[styles.navItem, { backgroundColor, borderColor }]}><Text style={[styles.navText, { color: active ? theme.primaryFg : wrongLocked ? theme.danger : review ? theme.goldStrong : answered ? theme.success : theme.muted }]}>{index + 1}</Text></Pressable>; })}</View></Card>
      <Card>
        <View style={styles.questionHeader}><View style={styles.questionContext}><Text style={[styles.questionSubject, { color: theme.primaryStrong }]}>{subject.title.toUpperCase()}</Text><Text numberOfLines={1} style={[styles.questionTopic, { color: theme.muted }]}>{topic.title} · {current + 1} of {questions.length}</Text></View><Pressable onPress={toggleReview} style={[styles.reviewButton, { backgroundColor: marked.has(question.id) ? theme.goldSoft : theme.sunken }]}><Flag size={15} color={marked.has(question.id) ? theme.goldStrong : theme.muted} /><Text style={[styles.reviewText, { color: marked.has(question.id) ? theme.goldStrong : theme.muted }]}>{marked.has(question.id) ? 'Marked' : 'Review'}</Text></Pressable></View>
        <Text style={[styles.question, { color: theme.fg }]}>{question.prompt}</Text>
        {lockedWrong && !isSubmitted ? <View style={[styles.closedAttempt, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}><View style={[styles.closedIcon, { backgroundColor: theme.surface }]}><LockKeyhole size={17} color={theme.danger} /></View><View style={styles.closedCopy}><Text style={[styles.closedTitle, { color: theme.danger }]}>Free attempt closed</Text><Text style={[styles.closedText, { color: theme.muted }]}>Wrong questions cannot be retried on the Free plan. Explanations unlock only after a correct response.</Text></View></View> : null}
        <View style={styles.options}>{question.options.map((option) => { const selectedThis = selected === option; const correctOption = option === question.answer; const backgroundColor = isSubmitted && correctOption ? theme.successSoft : isSubmitted && selectedThis ? theme.dangerSoft : selectedThis ? theme.primarySoft : theme.surface; const borderColor = isSubmitted && correctOption ? theme.success : isSubmitted && selectedThis ? theme.danger : selectedThis ? theme.primary : theme.line; return <Pressable key={option} disabled={lockedWrong || (isSubmitted && !canRetry) || (timerDuration !== null && timeLeft === 0)} onPress={() => selectAnswer(option)} style={[styles.option, { backgroundColor, borderColor }, lockedWrong && styles.closedOption]}><View style={[styles.radio, { borderColor: selectedThis ? theme.primary : theme.faint, backgroundColor: selectedThis ? theme.primary : 'transparent' }]}>{selectedThis ? <Text style={[styles.radioCheck, { color: theme.primaryFg }]}>✓</Text> : null}</View><Text style={[styles.optionText, { color: lockedWrong ? theme.faint : theme.fg }]}>{option}</Text></Pressable>; })}</View>
        {isSubmitted && explanationQuestionId === question.id ? <View style={[styles.feedback, { backgroundColor: selected === question.answer ? theme.successSoft : theme.dangerSoft }]}><Text style={[styles.feedbackTitle, { color: selected === question.answer ? theme.success : theme.danger }]}>{selected === question.answer ? 'Correct — well done.' : 'Not quite — try once more.'}</Text><Text style={[styles.feedbackText, { color: theme.muted }]}>{question.explanation}</Text>{canRetry ? <Text style={[styles.retryHint, { color: theme.primaryStrong }]}>Tap any option to retry this question.</Text> : null}</View> : isSubmitted ? <View style={[styles.answerRecorded, { backgroundColor: theme.dangerSoft }]}><LockKeyhole size={16} color={theme.danger} /><View style={styles.recordedCopy}><Text style={[styles.answerRecordedText, { color: theme.danger }]}>Incorrect answer recorded</Text><Text style={[styles.recordedHint, { color: theme.muted }]}>Explanation is available after correct answers on Free.</Text></View></View> : null}
        <View style={styles.actions}><AppButton label={lockedWrong ? 'Free attempt closed' : canRetry ? 'Choose another option' : isSubmitted ? 'Answered' : 'Submit answer'} disabled={!selected || lockedWrong || isSubmitted || (timerDuration !== null && timeLeft === 0)} onPress={submitAnswer} /><Pressable onPress={() => navigateToQuestion(current + 1)} style={[styles.next, { borderColor: theme.line, backgroundColor: theme.surface }]}><Text style={[styles.nextText, { color: theme.primaryStrong }]}>{current === questions.length - 1 ? 'Last question' : 'Next question'}</Text></Pressable></View>
        {timeLeft === 0 && timerDuration !== null ? <Text style={[styles.timeUp, { color: theme.danger }]}>Time is up. Start a new session to practise again.</Text> : null}
      </Card>
    </> : null}

    {started && mode === 'written' ? <Card><Text style={[styles.questionSubject, { color: theme.primaryStrong }]}>{subject.title.toUpperCase()} · {topic.title.toUpperCase()}</Text><Text style={[styles.question, { color: theme.fg }]}>{topic.writtenPrompt}</Text><TextInput multiline value={written} onChangeText={setWritten} placeholder="Write a concise answer…" placeholderTextColor={theme.faint} style={[styles.answer, { color: theme.fg, borderColor: theme.line, backgroundColor: theme.sunken }]} />{writtenSubmitted ? <View style={[styles.feedback, { backgroundColor: theme.successSoft }]}><Text style={[styles.feedbackTitle, { color: theme.success }]}>Sample feedback</Text><Text style={[styles.feedbackText, { color: theme.muted }]}>{topic.writtenFeedback}</Text></View> : <AppButton label="Submit for feedback" disabled={written.trim().length < 12} onPress={() => setWrittenSubmitted(true)} />}</Card> : null}
  </ScrollView></SafeAreaView>;
}

function PracticeTrackerShortcut({ onPress }: { onPress: () => void }) {
  const { theme } = useAppTheme();
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
      Animated.timing(pulse, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: nativeDriver }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [.92, 1.12] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [.28, .06] });
  return <Pressable accessibilityRole="button" accessibilityLabel="Open practice tracker" onPress={onPress} style={({ pressed }) => [styles.trackerShortcut, { backgroundColor: theme.surface, borderColor: theme.lineStrong }, pressed && styles.pressed]}>
    <View style={styles.trackerShortcutIcon}><Animated.View style={[styles.trackerShortcutPulse, { borderColor: theme.primaryStrong, opacity, transform: [{ scale }] }]} /><View style={[styles.trackerShortcutCore, { backgroundColor: theme.primarySoft }]}><BarChart3 size={19} color={theme.primaryStrong} /></View></View>
    <View style={styles.trackerShortcutCopy}><Text style={[styles.trackerShortcutLabel, { color: theme.primary }]}>PROGRESS</Text><Text style={[styles.trackerShortcutTitle, { color: theme.fg }]}>Practice tracker</Text></View><ArrowUpRight size={15} color={theme.primaryStrong} />
  </Pressable>;
}

function SessionSummary({ subject, topic, mode, timer, answered, total, reviewCount, words, writtenSubmitted, onChange }: { subject: string; topic: string; mode: PracticeMode; timer: string; answered: number; total: number; reviewCount: number; words: number; writtenSubmitted: boolean; onChange: () => void }) {
  const { theme } = useAppTheme();
  const written = mode === 'written';
  return <Card style={styles.sessionSummary}>
    <View style={styles.sessionTop}><View style={styles.sessionContext}><View style={[styles.livePill, { backgroundColor: theme.successSoft }]}><View style={[styles.liveDot, { backgroundColor: theme.success }]} /><Text style={[styles.liveText, { color: theme.success }]}>SESSION LIVE</Text></View><Text style={[styles.sessionSubject, { color: theme.fg }]}>{subject}</Text><Text numberOfLines={1} style={[styles.sessionTopic, { color: theme.muted }]}>{topic} · {written ? 'Written response' : `${total}-question MCQ`}</Text></View><Pressable accessibilityRole="button" onPress={onChange} style={({ pressed }) => [styles.changeCompact, { backgroundColor: theme.sunken, borderColor: theme.line }, pressed && styles.pressed]}><RotateCcw size={15} color={theme.primaryStrong} /><Text style={[styles.changeCompactText, { color: theme.primaryStrong }]}>Change</Text></Pressable></View>
    <View style={styles.sessionMetrics}>
      <View style={[styles.sessionMetric, { backgroundColor: theme.sunken }]}><Clock3 size={17} color={theme.primaryStrong} /><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.sessionMetricValue, { color: theme.fg }]}>{timer}</Text><Text style={[styles.sessionMetricLabel, { color: theme.muted }]}>Time left</Text></View>
      <View style={[styles.sessionMetric, { backgroundColor: theme.sunken }]}><CheckCircle2 size={17} color={theme.success} /><Text style={[styles.sessionMetricValue, { color: theme.fg }]}>{written ? words : `${answered}/${total}`}</Text><Text style={[styles.sessionMetricLabel, { color: theme.muted }]}>{written ? 'Words' : 'Answered'}</Text></View>
      <View style={[styles.sessionMetric, { backgroundColor: theme.sunken }]}><Flag size={17} color={theme.goldStrong} /><Text style={[styles.sessionMetricValue, { color: theme.fg }]}>{written ? (writtenSubmitted ? 'Done' : 'Draft') : reviewCount}</Text><Text style={[styles.sessionMetricLabel, { color: theme.muted }]}>{written ? 'Status' : 'For review'}</Text></View>
    </View>
  </Card>;
}

function formatCountdown(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  const minuteText = String(minutes).padStart(2, '0');
  const secondText = String(seconds).padStart(2, '0');
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${minuteText}:${secondText}` : `${minuteText}:${secondText}`;
}

function CustomTimer({ duration, onChange }: { duration: number | null; onChange: (seconds: number | null) => void }) {
  const { theme } = useAppTheme();
  const enabled = duration !== null;
  const [savedDuration, setSavedDuration] = useState(duration && duration > 0 ? duration : 10 * 60);
  const current = duration ?? savedDuration;
  const hours = Math.floor(current / 3600);
  const minutes = Math.floor((current % 3600) / 60);
  const seconds = current % 60;
  const updatePart = (part: 'hours' | 'minutes' | 'seconds', nextValue: number) => {
    const nextHours = part === 'hours' ? Math.max(0, Math.min(99, nextValue)) : hours;
    const nextMinutes = part === 'minutes' ? Math.max(0, Math.min(59, nextValue)) : minutes;
    const nextSeconds = part === 'seconds' ? Math.max(0, Math.min(59, nextValue)) : seconds;
    const nextDuration = nextHours * 3600 + nextMinutes * 60 + nextSeconds;
    setSavedDuration(nextDuration);
    onChange(nextDuration);
  };
  const toggleTimer = () => {
    if (enabled) {
      if (current > 0) setSavedDuration(current);
      onChange(null);
      return;
    }
    onChange(savedDuration);
  };

  return <View style={[styles.customTimer, { backgroundColor: theme.sunken, borderColor: enabled ? theme.primary : theme.line }]}>
    <View style={styles.customTimerTop}>
      <View style={styles.timerIdentity}>
        <View style={[styles.timerIdentityIcon, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}><Clock3 size={19} color={theme.primaryStrong} /></View>
        <View style={styles.timerCopy}><Text style={[styles.timerTitle, { color: theme.fg }]}>Session timer</Text><Text style={[styles.timerDescription, { color: theme.muted }]}>{enabled ? 'Set your focus countdown' : 'No time limit'}</Text></View>
      </View>
      <View style={styles.timerSwitchGroup}><Text style={[styles.timerState, { color: enabled ? theme.primaryStrong : theme.muted }]}>{enabled ? 'ON' : 'OFF'}</Text><Pressable accessibilityRole="switch" accessibilityState={{ checked: enabled }} accessibilityLabel="Practice timer" onPress={toggleTimer} style={[styles.timerToggle, { backgroundColor: enabled ? theme.primary : theme.surface, borderColor: enabled ? theme.primary : theme.line, justifyContent: enabled ? 'flex-end' : 'flex-start' }]}><View style={[styles.timerToggleKnob, { backgroundColor: enabled ? theme.primaryFg : theme.faint }]} /></Pressable></View>
    </View>

    {enabled ? <>
      <View style={[styles.timerFace, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.timeDial}>
          <TimeUnit key={`hours-${hours}`} label="HOURS" value={hours} max={99} onChange={(value) => updatePart('hours', value)} />
          <Text style={[styles.timeColon, { color: theme.primaryStrong }]}>:</Text>
          <TimeUnit key={`minutes-${minutes}`} label="MINUTES" value={minutes} max={59} onChange={(value) => updatePart('minutes', value)} />
          <Text style={[styles.timeColon, { color: theme.primaryStrong }]}>:</Text>
          <TimeUnit key={`seconds-${seconds}`} label="SECONDS" value={seconds} max={59} onChange={(value) => updatePart('seconds', value)} />
        </View>
        <View style={[styles.timerFaceFooter, { borderTopColor: theme.line }]}><Text style={[styles.timerHint, { color: theme.muted }]}>Tap the digits to type a value</Text><View style={[styles.configuredPill, { backgroundColor: theme.primarySoft }]}><Clock3 size={11} color={theme.primaryStrong} /><Text style={[styles.configuredText, { color: theme.primaryStrong }]}>{formatCountdown(current)}</Text></View></View>
      </View>
      {current === 0 ? <Text style={[styles.timerError, { color: theme.danger }]}>Set at least one second to start.</Text> : null}
    </> : <View style={[styles.untimed, { backgroundColor: theme.surface, borderColor: theme.line }]}><Clock3 size={18} color={theme.muted} /><View style={styles.untimedCopy}><Text style={[styles.untimedTitle, { color: theme.fg }]}>Untimed session</Text><Text style={[styles.untimedDescription, { color: theme.muted }]}>The session will continue until you finish it.</Text></View></View>}
  </View>;
}

function TimeUnit({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  const { theme } = useAppTheme();
  const [draft, setDraft] = useState(String(value).padStart(2, '0'));

  const commit = () => {
    const parsed = Number(draft.replace(/\D/g, '')) || 0;
    const next = Math.max(0, Math.min(max, parsed));
    setDraft(String(next).padStart(2, '0'));
    onChange(next);
  };

  return <View style={styles.timeUnit}>
    <Text style={[styles.timeUnitLabel, { color: theme.muted }]}>{label}</Text>
    <TextInput accessibilityLabel={label.toLowerCase()} value={draft} onChangeText={(text) => setDraft(text.replace(/\D/g, '').slice(0, 2))} onBlur={commit} onSubmitEditing={commit} keyboardType="number-pad" maxLength={2} selectTextOnFocus style={[styles.timeInput, { color: theme.fg }]} />
    <View style={styles.adjustRow}><Pressable accessibilityRole="button" accessibilityLabel={`Decrease ${label.toLowerCase()}`} onPress={() => onChange(Math.max(0, value - 1))} style={({ pressed }) => [styles.stepButton, { backgroundColor: theme.sunken, borderColor: theme.line }, pressed && styles.pressed]}><Minus size={14} color={theme.muted} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Increase ${label.toLowerCase()}`} onPress={() => onChange(Math.min(max, value + 1))} style={({ pressed }) => [styles.stepButton, { backgroundColor: theme.primarySoft, borderColor: theme.primary } , pressed && styles.pressed]}><Plus size={14} color={theme.primaryStrong} /></Pressable></View>
  </View>;
}

function Legend({ color, label }: { color: string; label: string }) { const { theme } = useAppTheme(); return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={[styles.legendText, { color: theme.muted }]}>{label}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: spacing.lg, paddingBottom: 108, gap: spacing.md }, eyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.4 }, title: { marginTop: 3, fontFamily: font.extraBold, fontSize: 30, letterSpacing: -0.8 }, description: { marginTop: 4, maxWidth: 430, fontFamily: font.regular, fontSize: 12, lineHeight: 18 },
  practiceHeading: { gap: 12 }, practiceHeadingCopy: { minWidth: 0 }, eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, planPill: { minHeight: 22, borderRadius: radius.pill, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 4 }, planText: { fontFamily: font.bold, fontSize: 7, letterSpacing: .7 }, trackerShortcut: { minHeight: 64, borderWidth: 1, borderRadius: 18, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, trackerShortcutIcon: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center' }, trackerShortcutPulse: { position: 'absolute', width: 42, height: 42, borderRadius: 21, borderWidth: 6 }, trackerShortcutCore: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, trackerShortcutCopy: { flex: 1, minWidth: 0 }, trackerShortcutLabel: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 }, trackerShortcutTitle: { marginTop: 2, fontFamily: font.extraBold, fontSize: 13 },
  builderCard: { gap: 0 }, builderHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, builderIcon: { width: 41, height: 41, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, builderCopy: { flex: 1 }, builderTitle: { fontFamily: font.extraBold, fontSize: 16, letterSpacing: -0.3 }, builderHint: { marginTop: 2, fontFamily: font.regular, fontSize: 9 }, livePill: { minHeight: 27, borderRadius: radius.pill, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, liveDot: { width: 5, height: 5, borderRadius: 3 }, liveText: { fontFamily: font.bold, fontSize: 8, letterSpacing: .8 },
  stepLabel: { marginTop: 17, marginBottom: 8, fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, subjectChoice: { minHeight: 37, maxWidth: '100%', borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }, subjectChoiceText: { fontFamily: font.bold, fontSize: 10 }, topicList: { gap: 7 }, topicChoice: { minHeight: 43, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }, topicRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, topicChoiceText: { flex: 1, fontFamily: font.semibold, fontSize: 11 }, questionCount: { fontFamily: font.bold, fontSize: 8 },
  segment: { flexDirection: 'row', borderRadius: 13, padding: 4, gap: 4 }, segmentButton: { flex: 1, minHeight: 38, borderWidth: 1, borderColor: 'transparent', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, segmentText: { fontFamily: font.bold, fontSize: 11 },
  customTimer: { borderWidth: 1, borderRadius: 18, padding: 13 }, customTimerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, timerIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }, timerIdentityIcon: { width: 39, height: 39, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, timerCopy: { flex: 1, minWidth: 0 }, timerTitle: { fontFamily: font.extraBold, fontSize: 13, letterSpacing: -.2 }, timerDescription: { marginTop: 2, fontFamily: font.regular, fontSize: 9 }, timerSwitchGroup: { flexDirection: 'row', alignItems: 'center', gap: 7 }, timerState: { fontFamily: font.bold, fontSize: 8, letterSpacing: .7 }, timerToggle: { width: 45, height: 27, borderRadius: radius.pill, borderWidth: 1, padding: 3, flexDirection: 'row', alignItems: 'center' }, timerToggleKnob: { width: 19, height: 19, borderRadius: 10 },
  timerFace: { marginTop: 13, borderWidth: 1, borderRadius: 15, paddingTop: 13, overflow: 'hidden' }, timeDial: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9, gap: 4 }, timeUnit: { flex: 1, maxWidth: 86, alignItems: 'center' }, timeUnitLabel: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 }, timeInput: { width: '100%', height: 45, paddingHorizontal: 2, paddingVertical: 0, textAlign: 'center', fontFamily: font.extraBold, fontSize: 25, letterSpacing: -.5 }, adjustRow: { width: '100%', marginTop: 5, marginBottom: 11, flexDirection: 'row', justifyContent: 'center', gap: 7 }, stepButton: { width: 32, height: 27, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, timeColon: { marginTop: -10, fontFamily: font.extraBold, fontSize: 21 }, timerFaceFooter: { minHeight: 42, borderTopWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, timerHint: { flex: 1, fontFamily: font.regular, fontSize: 8 }, configuredPill: { minHeight: 25, borderRadius: radius.pill, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }, configuredText: { fontFamily: font.bold, fontSize: 9 }, timerError: { marginTop: 9, textAlign: 'center', fontFamily: font.semibold, fontSize: 9 }, untimed: { marginTop: 12, minHeight: 59, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, untimedCopy: { flex: 1 }, untimedTitle: { fontFamily: font.bold, fontSize: 11 }, untimedDescription: { marginTop: 2, fontFamily: font.regular, fontSize: 9, lineHeight: 13 },
  startButton: { minHeight: 47, marginTop: 17, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, startText: { fontFamily: font.bold, fontSize: 12 }, disabled: { opacity: .45 },
  sessionSummary: { gap: 0 }, sessionTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, sessionContext: { flex: 1, minWidth: 0 }, sessionSubject: { marginTop: 9, fontFamily: font.extraBold, fontSize: 16, letterSpacing: -0.3 }, sessionTopic: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, changeCompact: { minHeight: 35, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }, changeCompactText: { fontFamily: font.bold, fontSize: 9 }, sessionMetrics: { marginTop: 15, flexDirection: 'row', gap: 7 }, sessionMetric: { flex: 1, minWidth: 0, minHeight: 88, borderRadius: 14, padding: 10 }, sessionMetricValue: { marginTop: 7, fontFamily: font.extraBold, fontSize: 15, letterSpacing: -0.3 }, sessionMetricLabel: { marginTop: 2, fontFamily: font.medium, fontSize: 8 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, cardLabel: { fontFamily: font.bold, fontSize: 14 }, progressCopy: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, progressValue: { fontFamily: font.extraBold, fontSize: 18 }, progressTrack: { height: 7, borderRadius: 4, overflow: 'hidden', marginTop: 11 }, progressFill: { height: '100%', borderRadius: 4 }, legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, legendDot: { width: 7, height: 7, borderRadius: 4 }, legendText: { fontFamily: font.medium, fontSize: 8 }, navigator: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 }, navItem: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, navText: { fontFamily: font.bold, fontSize: 10 },
  questionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, questionContext: { flex: 1, minWidth: 0 }, questionSubject: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.1 }, questionTopic: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, reviewButton: { minHeight: 31, borderRadius: 10, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, reviewText: { fontFamily: font.bold, fontSize: 9 }, question: { marginTop: 12, fontFamily: font.bold, fontSize: 17, lineHeight: 24 }, closedAttempt: { marginTop: 13, borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, closedIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, closedCopy: { flex: 1, minWidth: 0 }, closedTitle: { fontFamily: font.bold, fontSize: 11 }, closedText: { marginTop: 2, fontFamily: font.regular, fontSize: 9, lineHeight: 14 }, options: { gap: 8, marginVertical: 15 }, option: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, closedOption: { opacity: .48 }, radio: { height: 20, width: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }, radioCheck: { fontFamily: font.bold, fontSize: 12 }, optionText: { flex: 1, fontFamily: font.medium, fontSize: 12, lineHeight: 17 }, feedback: { padding: 13, borderRadius: 13, gap: 6 }, feedbackTitle: { fontFamily: font.bold, fontSize: 13 }, feedbackText: { fontFamily: font.regular, fontSize: 11, lineHeight: 17 }, retryHint: { marginTop: 3, fontFamily: font.bold, fontSize: 9 }, answerRecorded: { minHeight: 48, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }, recordedCopy: { flex: 1, minWidth: 0 }, answerRecordedText: { fontFamily: font.bold, fontSize: 10 }, recordedHint: { marginTop: 2, fontFamily: font.regular, fontSize: 8 }, actions: { gap: 8, marginTop: 12 }, next: { minHeight: 42, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, nextText: { fontFamily: font.bold, fontSize: 11 }, timeUp: { marginTop: 10, fontFamily: font.semibold, fontSize: 10, textAlign: 'center' }, pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] }, answer: { minHeight: 150, borderWidth: 1, borderRadius: 13, padding: 12, textAlignVertical: 'top', fontFamily: font.regular, fontSize: 13, lineHeight: 20, marginVertical: 15 },
});
