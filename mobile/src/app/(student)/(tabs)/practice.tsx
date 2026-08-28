import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Archive, ArrowRight, ArrowUpRight, BarChart3, BookOpen, CalendarDays, Check, CheckCircle2, CircleHelp, Clock3, Crown, FileStack, Flag, Layers3, ListFilter, LockKeyhole, PenLine, Play, RotateCcw, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton, Card } from '@/components/ui';
import { font, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { practiceSubjects } from '@/lib/demo-practice';
import { usePracticeProgressStore } from '@/lib/practice-progress-store';
import { isDemoSession } from '@/lib/student-session';
import { RemotePracticeScreen } from '@/components/remote-practice';
import { useAppTheme } from '@/providers/app-providers';

type PracticeMode = 'mcq' | 'written' | 'case-study';
type PracticeSource = 'archive';
const nativeDriver = Platform.OS !== 'web';
const archiveYears = ['2025', '2024', '2023', '2022'];

export default function PracticeScreen() {
  const demo = useAuthStore((state) => isDemoSession(state.accessToken, state.user?.id));
  return demo ? <DemoPracticeScreen /> : <RemotePracticeScreen />;
}

function DemoPracticeScreen() {
  const { theme } = useAppTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const plan = user?.plan ?? 'free';
  const paid = plan === 'paid';
  const practiceProgress = usePracticeProgressStore((state) => state.byQuestionId);
  const recordAnswer = usePracticeProgressStore((state) => state.recordAnswer);
  const source: PracticeSource = 'archive';
  const [year, setYear] = useState(archiveYears[0]);
  const [showFilters, setShowFilters] = useState(false);
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
  const formatLabel = mode === 'mcq' ? 'MCQ' : mode === 'written' ? 'Descriptive' : 'Case study';
  const sourceLabel = `Course practice · ${year}`;
  const effectiveTimerDuration = timerDuration;

  useEffect(() => {
    if (!started || mode !== 'mcq' || effectiveTimerDuration === null || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(interval);
  }, [effectiveTimerDuration, mode, started, timeLeft]);

  const clock = useMemo(() => formatCountdown(timeLeft), [timeLeft]);
  const clearAttempt = () => { setStarted(false); setCurrent(0); setAnswers({}); setMarked(new Set()); setSubmitted(new Set()); setWritten(''); setWrittenSubmitted(false); setExplanationQuestionId(null); setTimeLeft(effectiveTimerDuration ?? 0); };
  const chooseSubject = (nextId: string) => { const next = practiceSubjects.find((item) => item.id === nextId) ?? practiceSubjects[0]; setSubjectId(next.id); setTopicId(next.topics[0].id); clearAttempt(); };
  const chooseTopic = (nextId: string) => { setTopicId(nextId); clearAttempt(); };
  const chooseMode = (nextMode: PracticeMode) => { setMode(nextMode); clearAttempt(); };
  const changeTimer = (seconds: number | null) => { setTimerDuration(seconds); setTimeLeft(seconds ?? 0); };
  const startSession = () => { if (mode === 'mcq' && effectiveTimerDuration !== null && effectiveTimerDuration <= 0) return; setCurrent(0); setAnswers({}); setMarked(new Set()); setSubmitted(new Set()); setWritten(''); setWrittenSubmitted(false); setExplanationQuestionId(null); setTimeLeft(effectiveTimerDuration ?? 0); setStarted(true); };
  const selectAnswer = (option: string) => {
    if (lockedWrong || (effectiveTimerDuration !== null && timeLeft === 0)) return;
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
    <View style={styles.practiceHeading}><View style={styles.practiceHeadingCopy}><View style={styles.eyebrowRow}><Text style={[styles.eyebrow, { color: theme.primary }]}>FOCUSED PRACTICE</Text><View style={[styles.planPill, { backgroundColor: paid ? theme.goldSoft : theme.sunken }]}>{paid ? <Crown size={10} color={theme.goldStrong} /> : null}<Text style={[styles.planText, { color: paid ? theme.goldStrong : theme.muted }]}>{paid ? 'PAID' : 'FREE'}</Text></View></View><Text style={[styles.title, { color: theme.fg }]}>Practice</Text><Text style={[styles.description, { color: theme.muted }]}>Every published question for your selected course is free. Refine the set by subject, chapter, year and answer format.</Text></View><PracticeTrackerShortcut onPress={() => router.push('/practice-tracker' as never)} /></View>

    {!started ? <Card style={styles.builderCard}>
      <View style={styles.builderHeading}><View style={[styles.builderIcon, { backgroundColor: theme.primarySoft }]}><Layers3 size={20} color={theme.primaryStrong} /></View><View style={styles.builderCopy}><Text style={[styles.builderTitle, { color: theme.fg }]}>Choose how you want to practise</Text><Text style={[styles.builderHint, { color: theme.muted }]}>Pick a source, then refine only when needed.</Text></View></View>

      <View style={styles.sourceGrid}><View style={[styles.sourceCard, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}><View style={[styles.sourceIcon, { backgroundColor: theme.primary }]}><Archive size={19} color={theme.primaryFg} /></View><View style={styles.sourceCopy}><View style={styles.sourceTitleRow}><Text style={[styles.sourceTitle, { color: theme.fg }]}>Free course questions</Text><View style={[styles.freeBadge, { backgroundColor: theme.successSoft }]}><Text style={[styles.freeBadgeText, { color: theme.success }]}>FREE</Text></View></View><Text style={[styles.sourceDescription, { color: theme.muted }]}>Questions published by Admin for your selected course.</Text></View><Check size={17} color={theme.primaryStrong} strokeWidth={3} /></View></View>

      <View style={[styles.selectionSummary, { backgroundColor: theme.sunken, borderColor: theme.line }]}>
        <View style={styles.selectionTop}><View style={[styles.selectionIcon, { backgroundColor: theme.primarySoft }]}><ListFilter size={18} color={theme.primaryStrong} /></View><View style={styles.selectionCopy}><Text style={[styles.selectionEyebrow, { color: theme.primary }]}>YOUR SET</Text><Text numberOfLines={1} style={[styles.selectionTitle, { color: theme.fg }]}>{subject.title} · {topic.title}</Text></View><Pressable accessibilityRole="button" onPress={() => setShowFilters(true)} style={({ pressed }) => [styles.adjustFilters, { backgroundColor: theme.surface, borderColor: theme.lineStrong }, pressed && styles.pressed]}><ListFilter size={14} color={theme.primaryStrong} /><Text style={[styles.adjustFiltersText, { color: theme.primaryStrong }]}>Adjust</Text></Pressable></View>
        <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectionChips}><SelectionChip icon={<Archive size={11} color={theme.primaryStrong} />} label={sourceLabel} /><SelectionChip icon={mode === 'mcq' ? <CircleHelp size={11} color={theme.primaryStrong} /> : mode === 'written' ? <PenLine size={11} color={theme.primaryStrong} /> : <FileStack size={11} color={theme.primaryStrong} />} label={formatLabel} /><SelectionChip icon={<Clock3 size={11} color={theme.primaryStrong} />} label={mode === 'mcq' ? effectiveTimerDuration === null ? 'Untimed' : formatCountdown(effectiveTimerDuration) : '1 writing prompt'} /></ScrollView>
      </View>

      <Pressable disabled={mode === 'mcq' && effectiveTimerDuration !== null && effectiveTimerDuration <= 0} onPress={startSession} style={({ pressed }) => [styles.startButton, { backgroundColor: theme.primary }, mode === 'mcq' && effectiveTimerDuration !== null && effectiveTimerDuration <= 0 && styles.disabled, pressed && styles.pressed]}><Play size={18} fill={theme.primaryFg} color={theme.primaryFg} /><Text style={[styles.startText, { color: theme.primaryFg }]}>{`Start ${formatLabel} session`}</Text></Pressable>
    </Card> : <SessionSummary subject={subject.title} topic={topic.title} source={sourceLabel} mode={mode} timer={effectiveTimerDuration === null || mode !== 'mcq' ? 'Untimed' : clock} answered={answeredCount} total={questions.length} reviewCount={marked.size} words={written.trim() ? written.trim().split(/\s+/).length : 0} writtenSubmitted={writtenSubmitted} onChange={clearAttempt} />}

    <PracticeFilterSheet visible={showFilters} source={source} subjectId={subject.id} topicId={topic.id} year={year} mode={mode} timerDuration={timerDuration} onClose={() => setShowFilters(false)} onChooseSubject={chooseSubject} onChooseTopic={chooseTopic} onChooseYear={setYear} onChooseMode={chooseMode} onChangeTimer={changeTimer} />

    {started && mode === 'mcq' ? <>
      <Card><View style={styles.progressHeader}><View><Text style={[styles.cardLabel, { color: theme.fg }]}>Question navigator</Text><Text style={[styles.progressCopy, { color: theme.muted }]}>{answeredCount} answered of {questions.length} · {topic.title}</Text></View><Text style={[styles.progressValue, { color: theme.primaryStrong }]}>{progress}%</Text></View><View style={[styles.progressTrack, { backgroundColor: theme.sunken }]}><View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${progress}%` }]} /></View><View style={styles.legend}><Legend color={theme.success} label="Answered" /><Legend color={theme.goldStrong} label="Review" />{!paid ? <Legend color={theme.danger} label="Free attempt closed" /> : null}<Legend color={theme.faint} label="Unanswered" /></View><View style={styles.navigator}>{questions.map((item, index) => { const answered = Boolean(answers[item.id]); const review = marked.has(item.id); const wrongLocked = !paid && Boolean(practiceProgress[item.id]?.lockedWrong); const active = index === current; const backgroundColor = active ? theme.primary : wrongLocked ? theme.dangerSoft : review ? theme.goldSoft : answered ? theme.successSoft : theme.surface; const borderColor = active ? theme.primary : wrongLocked ? theme.danger : review ? theme.goldStrong : answered ? theme.success : theme.line; return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Question ${index + 1}${answered ? ', answered' : ''}${review ? ', marked for review' : ''}${wrongLocked ? ', incorrect attempt closed' : ''}`} onPress={() => navigateToQuestion(index)} style={[styles.navItem, { backgroundColor, borderColor }]}><Text style={[styles.navText, { color: active ? theme.primaryFg : wrongLocked ? theme.danger : review ? theme.goldStrong : answered ? theme.success : theme.muted }]}>{index + 1}</Text></Pressable>; })}</View></Card>
      <Card>
        <View style={styles.questionHeader}><View style={styles.questionContext}><Text style={[styles.questionSubject, { color: theme.primaryStrong }]}>{subject.title.toUpperCase()}</Text><Text numberOfLines={1} style={[styles.questionTopic, { color: theme.muted }]}>{topic.title} · {sourceLabel} · {current + 1} of {questions.length}</Text></View><Pressable onPress={toggleReview} style={[styles.reviewButton, { backgroundColor: marked.has(question.id) ? theme.goldSoft : theme.sunken }]}><Flag size={15} color={marked.has(question.id) ? theme.goldStrong : theme.muted} /><Text style={[styles.reviewText, { color: marked.has(question.id) ? theme.goldStrong : theme.muted }]}>{marked.has(question.id) ? 'Marked' : 'Review'}</Text></Pressable></View>
        <Text style={[styles.question, { color: theme.fg }]}>{question.prompt}</Text>
        {lockedWrong && !isSubmitted ? <View style={[styles.closedAttempt, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}><View style={[styles.closedIcon, { backgroundColor: theme.surface }]}><LockKeyhole size={17} color={theme.danger} /></View><View style={styles.closedCopy}><Text style={[styles.closedTitle, { color: theme.danger }]}>Free attempt closed</Text><Text style={[styles.closedText, { color: theme.muted }]}>Wrong questions cannot be retried on the Free plan. Explanations unlock only after a correct response.</Text></View></View> : null}
        <View style={styles.options}>{question.options.map((option) => { const selectedThis = selected === option; const correctOption = option === question.answer; const backgroundColor = isSubmitted && correctOption ? theme.successSoft : isSubmitted && selectedThis ? theme.dangerSoft : selectedThis ? theme.primarySoft : theme.surface; const borderColor = isSubmitted && correctOption ? theme.success : isSubmitted && selectedThis ? theme.danger : selectedThis ? theme.primary : theme.line; return <Pressable key={option} disabled={lockedWrong || (isSubmitted && !canRetry) || (effectiveTimerDuration !== null && timeLeft === 0)} onPress={() => selectAnswer(option)} style={[styles.option, { backgroundColor, borderColor }, lockedWrong && styles.closedOption]}><View style={[styles.radio, { borderColor: selectedThis ? theme.primary : theme.faint, backgroundColor: selectedThis ? theme.primary : 'transparent' }]}>{selectedThis ? <Text style={[styles.radioCheck, { color: theme.primaryFg }]}>✓</Text> : null}</View><Text style={[styles.optionText, { color: lockedWrong ? theme.faint : theme.fg }]}>{option}</Text></Pressable>; })}</View>
        {isSubmitted && explanationQuestionId === question.id ? <View style={[styles.feedback, { backgroundColor: selected === question.answer ? theme.successSoft : theme.dangerSoft }]}><Text style={[styles.feedbackTitle, { color: selected === question.answer ? theme.success : theme.danger }]}>{selected === question.answer ? 'Correct — well done.' : 'Not quite — try once more.'}</Text><Text style={[styles.feedbackText, { color: theme.muted }]}>{question.explanation}</Text>{canRetry ? <Text style={[styles.retryHint, { color: theme.primaryStrong }]}>Tap any option to retry this question.</Text> : null}</View> : isSubmitted ? <View style={[styles.answerRecorded, { backgroundColor: theme.dangerSoft }]}><LockKeyhole size={16} color={theme.danger} /><View style={styles.recordedCopy}><Text style={[styles.answerRecordedText, { color: theme.danger }]}>Incorrect answer recorded</Text><Text style={[styles.recordedHint, { color: theme.muted }]}>Explanation is available after correct answers on Free.</Text></View></View> : null}
        <View style={styles.actions}><AppButton label={lockedWrong ? 'Free attempt closed' : canRetry ? 'Choose another option' : isSubmitted ? 'Answered' : 'Submit answer'} disabled={!selected || lockedWrong || isSubmitted || (effectiveTimerDuration !== null && timeLeft === 0)} onPress={submitAnswer} /><Pressable onPress={() => navigateToQuestion(current + 1)} style={[styles.next, { borderColor: theme.line, backgroundColor: theme.surface }]}><Text style={[styles.nextText, { color: theme.primaryStrong }]}>{current === questions.length - 1 ? 'Last question' : 'Next question'}</Text></Pressable></View>
        {timeLeft === 0 && effectiveTimerDuration !== null ? <Text style={[styles.timeUp, { color: theme.danger }]}>Time is up. Start a new session to practise again.</Text> : null}
      </Card>
    </> : null}

    {started && mode !== 'mcq' ? <Card><Text style={[styles.questionSubject, { color: theme.primaryStrong }]}>{subject.title.toUpperCase()} · {topic.title.toUpperCase()} · {mode === 'case-study' ? 'CASE STUDY' : 'DESCRIPTIVE'}</Text>{mode === 'case-study' ? <View style={[styles.caseStudyLead, { backgroundColor: theme.primarySoft, borderColor: theme.lineStrong }]}><FileStack size={18} color={theme.primaryStrong} /><Text style={[styles.caseStudyLeadText, { color: theme.muted }]}>Analyse the situation, connect the relevant concepts and give a reasoned conclusion.</Text></View> : null}<Text style={[styles.question, { color: theme.fg }]}>{topic.writtenPrompt}</Text><TextInput multiline value={written} onChangeText={setWritten} placeholder={mode === 'case-study' ? 'Write your analysis…' : 'Write a concise answer…'} placeholderTextColor={theme.faint} style={[styles.answer, { color: theme.fg, borderColor: theme.line, backgroundColor: theme.sunken }]} />{writtenSubmitted ? <View style={[styles.feedback, { backgroundColor: theme.successSoft }]}><Text style={[styles.feedbackTitle, { color: theme.success }]}>Sample feedback</Text><Text style={[styles.feedbackText, { color: theme.muted }]}>{topic.writtenFeedback}</Text></View> : <AppButton label="Submit for feedback" disabled={written.trim().length < 12} onPress={() => setWrittenSubmitted(true)} />}</Card> : null}
  </ScrollView></SafeAreaView>;
}

function SelectionChip({ icon, label }: { icon: ReactNode; label: string }) {
  const { theme } = useAppTheme();
  return <View style={[styles.selectionChip, { backgroundColor: theme.surface, borderColor: theme.line }]}>{icon}<Text numberOfLines={1} style={[styles.selectionChipText, { color: theme.muted }]}>{label}</Text></View>;
}

function PracticeFilterSheet({ visible, source, subjectId, topicId, year, mode, timerDuration, onClose, onChooseSubject, onChooseTopic, onChooseYear, onChooseMode, onChangeTimer }: { visible: boolean; source: PracticeSource; subjectId: string; topicId: string; year: string; mode: PracticeMode; timerDuration: number | null; onClose: () => void; onChooseSubject: (id: string) => void; onChooseTopic: (id: string) => void; onChooseYear: (year: string) => void; onChooseMode: (mode: PracticeMode) => void; onChangeTimer: (seconds: number | null) => void }) {
  const { theme } = useAppTheme();
  const subject = practiceSubjects.find((item) => item.id === subjectId) ?? practiceSubjects[0];
  const selectedTopic = subject.topics.find((item) => item.id === topicId) ?? subject.topics[0];
  const showYear = source === 'archive';
  return <Modal transparent visible={visible} animationType="none" statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.filterModal}><Pressable accessibilityRole="button" accessibilityLabel="Close practice filters" onPress={onClose} style={styles.filterScrim} />
      <SafeAreaView edges={['bottom']} style={[styles.filterSheet, { backgroundColor: theme.surface, borderColor: theme.lineStrong }]}>
        <View style={[styles.filterHandle, { backgroundColor: theme.lineStrong }]} />
        <View style={styles.filterHeader}><View style={[styles.filterHeaderIcon, { backgroundColor: theme.goldSoft }]}><Archive size={19} color={theme.goldStrong} /></View><View style={styles.filterHeaderCopy}><Text style={[styles.filterHeaderEyebrow, { color: theme.goldStrong }]}>FREE COURSE PRACTICE</Text><Text style={[styles.filterHeaderTitle, { color: theme.fg }]}>Refine your practice set</Text><Text style={[styles.filterHeaderHint, { color: theme.muted }]}>Use the taxonomy supplied with Admin-uploaded questions.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close filters" onPress={onClose} style={[styles.filterClose, { backgroundColor: theme.sunken }]}><X size={18} color={theme.muted} /></Pressable></View>

        <ScrollView contentContainerStyle={styles.filterContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <FilterSection number="01" title="Subject"><ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRail}>{practiceSubjects.map((item) => <FilterPill key={item.id} active={item.id === subjectId} label={item.title} icon={<BookOpen size={14} color={item.id === subjectId ? '#171108' : theme.muted} />} onPress={() => onChooseSubject(item.id)} />)}</ScrollView></FilterSection>

          <FilterSection number="02" title="Chapter"><ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRail}>{subject.topics.map((item) => <FilterPill key={item.id} active={item.id === topicId} label={item.title} suffix={`${item.questions.length} Q`} onPress={() => onChooseTopic(item.id)} />)}</ScrollView></FilterSection>

          {showYear ? <FilterSection number="03" title="Year"><ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRail}>{archiveYears.map((item) => <FilterPill key={item} active={item === year} label={item} icon={<CalendarDays size={13} color={item === year ? '#171108' : theme.muted} />} onPress={() => onChooseYear(item)} />)}</ScrollView></FilterSection> : null}

          <FilterSection number="04" title="Answer format"><View style={styles.formatGrid}><FormatChoice active={mode === 'mcq'} title="MCQ" detail="Choose an option" icon={<CircleHelp size={17} color={mode === 'mcq' ? theme.goldStrong : theme.muted} />} onPress={() => onChooseMode('mcq')} /><FormatChoice active={mode === 'written'} title="Descriptive" detail="Write an answer" icon={<PenLine size={17} color={mode === 'written' ? theme.goldStrong : theme.muted} />} onPress={() => onChooseMode('written')} /><FormatChoice active={mode === 'case-study'} title="Case study" detail="Analyse a scenario" icon={<FileStack size={17} color={mode === 'case-study' ? theme.goldStrong : theme.muted} />} onPress={() => onChooseMode('case-study')} /></View></FilterSection>

          {mode === 'mcq' ? <FilterSection number="05" title="Timer"><CustomTimer duration={timerDuration} onChange={onChangeTimer} /></FilterSection> : <View style={[styles.composedTimingNote, { backgroundColor: theme.sunken, borderColor: theme.line }]}><Clock3 size={17} color={theme.muted} /><View style={styles.composedTimingCopy}><Text style={[styles.composedTimingTitle, { color: theme.fg }]}>Open writing session</Text><Text style={[styles.composedTimingText, { color: theme.muted }]}>Descriptive and case-study responses remain untimed.</Text></View></View>}
        </ScrollView>

        <View style={[styles.filterFooter, { borderTopColor: theme.line }]}><View style={styles.filterFooterCopy}><Text style={[styles.filterFooterLabel, { color: theme.muted }]}>READY TO BUILD</Text><Text numberOfLines={1} style={[styles.filterFooterValue, { color: theme.fg }]}>{subject.title} · {selectedTopic.title}</Text></View><Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.filterDone, { backgroundColor: theme.goldStrong }, pressed && styles.pressed]}><Text style={[styles.filterDoneText, { color: '#171108' }]}>Use filters</Text><ArrowRight size={16} color="#171108" /></Pressable></View>
      </SafeAreaView>
    </View>
  </Modal>;
}

function FilterSection({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  const { theme } = useAppTheme();
  return <View style={styles.filterSection}><View style={styles.filterSectionTitle}><Text style={[styles.filterNumber, { color: theme.goldStrong }]}>{number}</Text><Text style={[styles.filterTitle, { color: theme.fg }]}>{title}</Text></View>{children}</View>;
}

function FilterPill({ active, label, suffix, icon, onPress }: { active: boolean; label: string; suffix?: string; icon?: ReactNode; onPress: () => void }) {
  const { theme } = useAppTheme();
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.filterPill, { backgroundColor: active ? theme.goldStrong : theme.sunken, borderColor: active ? theme.goldStrong : theme.line }, pressed && styles.pressed]}>{icon}<Text numberOfLines={1} style={[styles.filterPillText, { color: active ? '#171108' : theme.muted }]}>{label}</Text>{suffix ? <Text style={[styles.filterPillSuffix, { color: active ? '#3B2A0C' : theme.faint }]}>{suffix}</Text> : null}</Pressable>;
}

function FormatChoice({ active, title, detail, icon, onPress }: { active: boolean; title: string; detail: string; icon: ReactNode; onPress: () => void }) {
  const { theme } = useAppTheme();
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} onPress={onPress} style={({ pressed }) => [styles.formatChoice, { backgroundColor: active ? theme.goldSoft : theme.sunken, borderColor: active ? theme.goldStrong : theme.line }, pressed && styles.pressed]}><View style={styles.formatChoiceTop}>{icon}{active ? <Check size={13} color={theme.goldStrong} strokeWidth={3} /> : null}</View><Text style={[styles.formatChoiceTitle, { color: active ? theme.goldStrong : theme.fg }]}>{title}</Text><Text style={[styles.formatChoiceDetail, { color: theme.muted }]}>{detail}</Text></Pressable>;
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

function SessionSummary({ subject, topic, source, mode, timer, answered, total, reviewCount, words, writtenSubmitted, onChange }: { subject: string; topic: string; source: string; mode: PracticeMode; timer: string; answered: number; total: number; reviewCount: number; words: number; writtenSubmitted: boolean; onChange: () => void }) {
  const { theme } = useAppTheme();
  const composed = mode !== 'mcq';
  const modeLabel = mode === 'mcq' ? `${total}-question MCQ` : mode === 'written' ? 'Descriptive response' : 'Case-study response';
  return <Card style={styles.sessionSummary}>
    <View style={styles.sessionTop}><View style={styles.sessionContext}><View style={[styles.livePill, { backgroundColor: theme.successSoft }]}><View style={[styles.liveDot, { backgroundColor: theme.success }]} /><Text style={[styles.liveText, { color: theme.success }]}>SESSION LIVE</Text></View><Text style={[styles.sessionSubject, { color: theme.fg }]}>{subject}</Text><Text numberOfLines={1} style={[styles.sessionTopic, { color: theme.muted }]}>{topic} · {source} · {modeLabel}</Text></View><Pressable accessibilityRole="button" onPress={onChange} style={({ pressed }) => [styles.changeCompact, { backgroundColor: theme.sunken, borderColor: theme.line }, pressed && styles.pressed]}><RotateCcw size={15} color={theme.primaryStrong} /><Text style={[styles.changeCompactText, { color: theme.primaryStrong }]}>Change</Text></Pressable></View>
    <View style={styles.sessionMetrics}>
      <View style={[styles.sessionMetric, { backgroundColor: theme.sunken }]}><Clock3 size={17} color={theme.primaryStrong} /><Text numberOfLines={1} adjustsFontSizeToFit style={[styles.sessionMetricValue, { color: theme.fg }]}>{timer}</Text><Text style={[styles.sessionMetricLabel, { color: theme.muted }]}>Time left</Text></View>
      <View style={[styles.sessionMetric, { backgroundColor: theme.sunken }]}><CheckCircle2 size={17} color={theme.success} /><Text style={[styles.sessionMetricValue, { color: theme.fg }]}>{composed ? words : `${answered}/${total}`}</Text><Text style={[styles.sessionMetricLabel, { color: theme.muted }]}>{composed ? 'Words' : 'Answered'}</Text></View>
      <View style={[styles.sessionMetric, { backgroundColor: theme.sunken }]}><Flag size={17} color={theme.goldStrong} /><Text style={[styles.sessionMetricValue, { color: theme.fg }]}>{composed ? (writtenSubmitted ? 'Done' : 'Draft') : reviewCount}</Text><Text style={[styles.sessionMetricLabel, { color: theme.muted }]}>{composed ? 'Status' : 'For review'}</Text></View>
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
    const nextHours = part === 'hours' ? Math.max(0, Math.min(23, nextValue)) : hours;
    const nextMinutes = part === 'minutes' ? Math.max(0, Math.min(59, nextValue)) : minutes;
    const nextSeconds = part === 'seconds' ? Math.max(0, Math.min(59, nextValue)) : seconds;
    const nextDuration = nextHours * 3600 + nextMinutes * 60 + nextSeconds;
    setSavedDuration(nextDuration);
    onChange(nextDuration);
  };
  const applyPreset = (nextDuration: number) => { setSavedDuration(nextDuration); onChange(nextDuration); };
  const toggleTimer = () => {
    if (enabled) {
      if (current > 0) setSavedDuration(current);
      onChange(null);
      return;
    }
    onChange(savedDuration);
  };

  return <View style={[styles.customTimer, { backgroundColor: theme.sunken, borderColor: enabled ? theme.goldStrong : theme.line }]}>
    <View style={styles.customTimerTop}>
      <View style={styles.timerIdentity}>
        <View style={[styles.timerIdentityIcon, { backgroundColor: theme.goldSoft, borderColor: theme.goldStrong }]}><Clock3 size={19} color={theme.goldStrong} /></View>
        <View style={styles.timerCopy}><Text style={[styles.timerTitle, { color: theme.fg }]}>Timer</Text><Text style={[styles.timerDescription, { color: theme.muted }]}>{enabled ? 'Scroll each wheel to set the duration' : 'Practise without a countdown'}</Text></View>
      </View>
      <View style={styles.timerSwitchGroup}><Text style={[styles.timerState, { color: enabled ? theme.goldStrong : theme.muted }]}>{enabled ? 'ON' : 'OFF'}</Text><TimerSwitch enabled={enabled} onPress={toggleTimer} /></View>
    </View>

    {enabled ? <>
      <View style={[styles.timerFace, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View pointerEvents="none" style={[styles.wheelSelection, { backgroundColor: theme.sunken, borderColor: theme.lineStrong }]} />
        <View style={styles.timeDial}><TimerWheel label="hours" value={hours} max={23} onChange={(value) => updatePart('hours', value)} /><TimerWheel label="min" value={minutes} max={59} onChange={(value) => updatePart('minutes', value)} /><TimerWheel label="sec" value={seconds} max={59} onChange={(value) => updatePart('seconds', value)} /></View>
        <View pointerEvents="none" style={[styles.wheelFade, styles.wheelFadeTop, { backgroundColor: theme.surface }]} /><View pointerEvents="none" style={[styles.wheelFade, styles.wheelFadeBottom, { backgroundColor: theme.surface }]} />
        <View style={[styles.timerFaceFooter, { borderTopColor: theme.line }]}><Text style={[styles.timerHint, { color: theme.muted }]}>Selected duration</Text><View style={[styles.configuredPill, { backgroundColor: theme.goldSoft }]}><Clock3 size={11} color={theme.goldStrong} /><Text style={[styles.configuredText, { color: theme.goldStrong }]}>{formatCountdown(current)}</Text></View></View>
      </View>
      <View style={styles.timerPresets}><Text style={[styles.presetLabel, { color: theme.faint }]}>QUICK SET</Text><View style={styles.presetRail}>{[[5 * 60, '5m'], [10 * 60, '10m'], [15 * 60, '15m'], [30 * 60, '30m']] .map(([preset, label]) => { const active = current === preset; return <Pressable key={label} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => applyPreset(Number(preset))} style={({ pressed }) => [styles.preset, { backgroundColor: active ? theme.goldSoft : theme.surface, borderColor: active ? theme.goldStrong : theme.line }, pressed && styles.pressed]}><Text style={[styles.presetText, { color: active ? theme.goldStrong : theme.muted }]}>{label}</Text></Pressable>; })}</View></View>
      {current === 0 ? <Text style={[styles.timerError, { color: theme.danger }]}>Set at least one second to start.</Text> : null}
    </> : <View style={[styles.untimed, { backgroundColor: theme.surface, borderColor: theme.line }]}><Clock3 size={18} color={theme.muted} /><View style={styles.untimedCopy}><Text style={[styles.untimedTitle, { color: theme.fg }]}>Untimed session</Text><Text style={[styles.untimedDescription, { color: theme.muted }]}>The session will continue until you finish it.</Text></View></View>}
  </View>;
}

function TimerSwitch({ enabled, onPress }: { enabled: boolean; onPress: () => void }) {
  const { theme } = useAppTheme();
  const [position] = useState(() => new Animated.Value(enabled ? 1 : 0));
  useEffect(() => { Animated.timing(position, { toValue: enabled ? 1 : 0, duration: 210, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }).start(); }, [enabled, position]);
  const translateX = position.interpolate({ inputRange: [0, 1], outputRange: [0, 19] });
  return <Pressable accessibilityRole="switch" accessibilityState={{ checked: enabled }} accessibilityLabel="Practice timer" onPress={onPress} style={[styles.timerToggle, { backgroundColor: enabled ? theme.goldStrong : theme.surface, borderColor: enabled ? theme.goldStrong : theme.line }]}><Animated.View style={[styles.timerToggleKnob, { backgroundColor: enabled ? '#171108' : theme.faint, transform: [{ translateX }] }]} /></Pressable>;
}

const wheelItemHeight = 42;

function TimerWheel({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (value: number) => void }) {
  const { theme } = useAppTheme();
  const scrollRef = useRef<ScrollView>(null);
  const values = useMemo(() => Array.from({ length: max + 1 }, (_, index) => index), [max]);
  useEffect(() => { requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: value * wheelItemHeight, animated: false })); }, [value]);
  const commit = (offset: number) => onChange(Math.max(0, Math.min(max, Math.round(offset / wheelItemHeight))));
  return <View style={styles.wheelColumn}><ScrollView ref={scrollRef} nestedScrollEnabled directionalLockEnabled showsVerticalScrollIndicator={false} snapToInterval={wheelItemHeight} decelerationRate="fast" contentContainerStyle={styles.wheelContent} onMomentumScrollEnd={(event) => commit(event.nativeEvent.contentOffset.y)}>{values.map((entry) => <Pressable key={entry} accessibilityRole="button" accessibilityState={{ selected: entry === value }} accessibilityLabel={`${entry} ${label}`} onPress={() => onChange(entry)} style={styles.wheelItem}><Text style={[styles.wheelValue, { color: entry === value ? theme.fg : theme.faint }, entry === value && styles.wheelValueActive]}>{String(entry).padStart(2, '0')}</Text></Pressable>)}</ScrollView><Text pointerEvents="none" style={[styles.wheelLabel, { color: theme.muted }]}>{label}</Text></View>;
}

function Legend({ color, label }: { color: string; label: string }) { const { theme } = useAppTheme(); return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={[styles.legendText, { color: theme.muted }]}>{label}</Text></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1 }, content: { width: '100%', maxWidth: 680, alignSelf: 'center', padding: spacing.lg, paddingBottom: 108, gap: spacing.md }, eyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.4 }, title: { marginTop: 3, fontFamily: font.extraBold, fontSize: 30, letterSpacing: -0.8 }, description: { marginTop: 4, maxWidth: 430, fontFamily: font.regular, fontSize: 12, lineHeight: 18 },
  practiceHeading: { gap: 12 }, practiceHeadingCopy: { minWidth: 0 }, eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, planPill: { minHeight: 22, borderRadius: radius.pill, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', gap: 4 }, planText: { fontFamily: font.bold, fontSize: 7, letterSpacing: .7 }, trackerShortcut: { minHeight: 64, borderWidth: 1, borderRadius: 18, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, trackerShortcutIcon: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center' }, trackerShortcutPulse: { position: 'absolute', width: 42, height: 42, borderRadius: 21, borderWidth: 6 }, trackerShortcutCore: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, trackerShortcutCopy: { flex: 1, minWidth: 0 }, trackerShortcutLabel: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 }, trackerShortcutTitle: { marginTop: 2, fontFamily: font.extraBold, fontSize: 13 },
  builderCard: { gap: 0 }, builderHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, builderIcon: { width: 41, height: 41, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, builderCopy: { flex: 1 }, builderTitle: { fontFamily: font.extraBold, fontSize: 16, letterSpacing: -0.3 }, builderHint: { marginTop: 2, fontFamily: font.regular, fontSize: 9 }, livePill: { minHeight: 27, borderRadius: radius.pill, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, liveDot: { width: 5, height: 5, borderRadius: 3 }, liveText: { fontFamily: font.bold, fontSize: 8, letterSpacing: .8 },
  sourceGrid: { marginTop: 15, gap: 8 }, sourceCard: { minHeight: 76, borderWidth: 1, borderRadius: 16, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, sourceIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, sourceCopy: { flex: 1, minWidth: 0 }, sourceTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, sourceTitle: { fontFamily: font.extraBold, fontSize: 13 }, sourceDescription: { marginTop: 3, fontFamily: font.regular, fontSize: 9, lineHeight: 13 }, freeBadge: { minHeight: 18, borderRadius: radius.pill, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }, freeBadgeText: { fontFamily: font.bold, fontSize: 6, letterSpacing: .7 }, ownedBadge: { minHeight: 19, borderRadius: radius.pill, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 3 }, ownedBadgeText: { fontFamily: font.bold, fontSize: 6, letterSpacing: .65 },
  selectionSummary: { marginTop: 13, borderWidth: 1, borderRadius: 17, padding: 11, overflow: 'hidden' }, selectionTop: { flexDirection: 'row', alignItems: 'center', gap: 9 }, selectionIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, selectionCopy: { flex: 1, minWidth: 0 }, selectionEyebrow: { fontFamily: font.bold, fontSize: 6.5, letterSpacing: 1 }, selectionTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 12 }, adjustFilters: { minHeight: 34, borderWidth: 1, borderRadius: 11, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, adjustFiltersText: { fontFamily: font.bold, fontSize: 8 }, selectionChips: { gap: 6, paddingTop: 10, paddingRight: 8 }, selectionChip: { maxWidth: 180, minHeight: 28, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 5 }, selectionChipText: { flexShrink: 1, fontFamily: font.semibold, fontSize: 7.5 },
  stepLabel: { marginTop: 17, marginBottom: 8, fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, choiceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, subjectChoice: { minHeight: 37, maxWidth: '100%', borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }, subjectChoiceText: { fontFamily: font.bold, fontSize: 10 }, topicList: { gap: 7 }, topicChoice: { minHeight: 43, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }, topicRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, topicChoiceText: { flex: 1, fontFamily: font.semibold, fontSize: 11 }, questionCount: { fontFamily: font.bold, fontSize: 8 },
  segment: { flexDirection: 'row', borderRadius: 13, padding: 4, gap: 4 }, segmentButton: { flex: 1, minHeight: 38, borderWidth: 1, borderColor: 'transparent', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, segmentText: { fontFamily: font.bold, fontSize: 11 },
  customTimer: { borderWidth: 1, borderRadius: 20, padding: 13 }, customTimerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, timerIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }, timerIdentityIcon: { width: 39, height: 39, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, timerCopy: { flex: 1, minWidth: 0 }, timerTitle: { fontFamily: font.extraBold, fontSize: 14, letterSpacing: -.25 }, timerDescription: { marginTop: 2, fontFamily: font.regular, fontSize: 9 }, timerSwitchGroup: { flexDirection: 'row', alignItems: 'center', gap: 7 }, timerState: { fontFamily: font.bold, fontSize: 8, letterSpacing: .7 }, timerToggle: { width: 45, height: 27, borderRadius: radius.pill, borderWidth: 1, padding: 3, flexDirection: 'row', alignItems: 'center' }, timerToggleKnob: { width: 19, height: 19, borderRadius: 10 },
  timerFace: { position: 'relative', height: 170, marginTop: 13, borderWidth: 1, borderRadius: 17, overflow: 'hidden' }, timeDial: { zIndex: 2, height: 126, flexDirection: 'row', paddingHorizontal: 12 }, wheelSelection: { position: 'absolute', zIndex: 1, top: 42, left: 10, right: 10, height: 42, borderTopWidth: 1, borderBottomWidth: 1, borderRadius: 10 }, wheelColumn: { flex: 1, minWidth: 0, height: 126 }, wheelContent: { paddingVertical: 42 }, wheelItem: { height: 42, alignItems: 'center', justifyContent: 'center' }, wheelValue: { fontFamily: font.semibold, fontSize: 15, lineHeight: 42, letterSpacing: -.25 }, wheelValueActive: { fontFamily: font.extraBold, fontSize: 23, letterSpacing: -.7 }, wheelLabel: { position: 'absolute', zIndex: 5, right: 7, top: 59, fontFamily: font.bold, fontSize: 6.5, letterSpacing: .5, textTransform: 'uppercase' }, wheelFade: { position: 'absolute', zIndex: 3, left: 0, right: 0, height: 36, opacity: .82 }, wheelFadeTop: { top: 0 }, wheelFadeBottom: { top: 90 }, timerFaceFooter: { zIndex: 4, height: 44, borderTopWidth: 1, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, timerHint: { flex: 1, fontFamily: font.regular, fontSize: 8 }, configuredPill: { minHeight: 26, borderRadius: radius.pill, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }, configuredText: { fontFamily: font.bold, fontSize: 9 }, timerPresets: { marginTop: 11 }, presetLabel: { fontFamily: font.bold, fontSize: 6.5, letterSpacing: 1 }, presetRail: { marginTop: 7, flexDirection: 'row', gap: 6 }, preset: { flex: 1, minWidth: 0, minHeight: 34, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, presetText: { fontFamily: font.bold, fontSize: 9 }, timerError: { marginTop: 9, textAlign: 'center', fontFamily: font.semibold, fontSize: 9 }, untimed: { marginTop: 12, minHeight: 59, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, untimedCopy: { flex: 1 }, untimedTitle: { fontFamily: font.bold, fontSize: 11 }, untimedDescription: { marginTop: 2, fontFamily: font.regular, fontSize: 9, lineHeight: 13 },
  startButton: { minHeight: 47, marginTop: 17, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, startText: { fontFamily: font.bold, fontSize: 12 }, disabled: { opacity: .45 },
  sessionSummary: { gap: 0 }, sessionTop: { flexDirection: 'row', alignItems: 'center', gap: 10 }, sessionContext: { flex: 1, minWidth: 0 }, sessionSubject: { marginTop: 9, fontFamily: font.extraBold, fontSize: 16, letterSpacing: -0.3 }, sessionTopic: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, changeCompact: { minHeight: 35, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 }, changeCompactText: { fontFamily: font.bold, fontSize: 9 }, sessionMetrics: { marginTop: 15, flexDirection: 'row', gap: 7 }, sessionMetric: { flex: 1, minWidth: 0, minHeight: 88, borderRadius: 14, padding: 10 }, sessionMetricValue: { marginTop: 7, fontFamily: font.extraBold, fontSize: 15, letterSpacing: -0.3 }, sessionMetricLabel: { marginTop: 2, fontFamily: font.medium, fontSize: 8 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, cardLabel: { fontFamily: font.bold, fontSize: 14 }, progressCopy: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, progressValue: { fontFamily: font.extraBold, fontSize: 18 }, progressTrack: { height: 7, borderRadius: 4, overflow: 'hidden', marginTop: 11 }, progressFill: { height: '100%', borderRadius: 4 }, legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }, legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 }, legendDot: { width: 7, height: 7, borderRadius: 4 }, legendText: { fontFamily: font.medium, fontSize: 8 }, navigator: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 13 }, navItem: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, navText: { fontFamily: font.bold, fontSize: 10 },
  questionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, questionContext: { flex: 1, minWidth: 0 }, questionSubject: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.1 }, questionTopic: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, reviewButton: { minHeight: 31, borderRadius: 10, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, reviewText: { fontFamily: font.bold, fontSize: 9 }, question: { marginTop: 12, fontFamily: font.bold, fontSize: 17, lineHeight: 24 }, closedAttempt: { marginTop: 13, borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, closedIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, closedCopy: { flex: 1, minWidth: 0 }, closedTitle: { fontFamily: font.bold, fontSize: 11 }, closedText: { marginTop: 2, fontFamily: font.regular, fontSize: 9, lineHeight: 14 }, options: { gap: 8, marginVertical: 15 }, option: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, closedOption: { opacity: .48 }, radio: { height: 20, width: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' }, radioCheck: { fontFamily: font.bold, fontSize: 12 }, optionText: { flex: 1, fontFamily: font.medium, fontSize: 12, lineHeight: 17 }, feedback: { padding: 13, borderRadius: 13, gap: 6 }, feedbackTitle: { fontFamily: font.bold, fontSize: 13 }, feedbackText: { fontFamily: font.regular, fontSize: 11, lineHeight: 17 }, retryHint: { marginTop: 3, fontFamily: font.bold, fontSize: 9 }, answerRecorded: { minHeight: 48, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }, recordedCopy: { flex: 1, minWidth: 0 }, answerRecordedText: { fontFamily: font.bold, fontSize: 10 }, recordedHint: { marginTop: 2, fontFamily: font.regular, fontSize: 8 }, actions: { gap: 8, marginTop: 12 }, next: { minHeight: 42, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, nextText: { fontFamily: font.bold, fontSize: 11 }, timeUp: { marginTop: 10, fontFamily: font.semibold, fontSize: 10, textAlign: 'center' }, pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] }, answer: { minHeight: 150, borderWidth: 1, borderRadius: 13, padding: 12, textAlignVertical: 'top', fontFamily: font.regular, fontSize: 13, lineHeight: 20, marginVertical: 15 },
  caseStudyLead: { marginTop: 13, borderWidth: 1, borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, caseStudyLeadText: { flex: 1, fontFamily: font.medium, fontSize: 9, lineHeight: 14 },
  filterModal: { flex: 1, justifyContent: 'flex-end' }, filterScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(3,6,14,0.72)' }, filterSheet: { width: '100%', maxWidth: 620, maxHeight: '92%', alignSelf: 'center', borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' }, filterHandle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 9 }, filterHeader: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, filterHeaderIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, filterHeaderCopy: { flex: 1, minWidth: 0 }, filterHeaderEyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 }, filterHeaderTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 17 }, filterHeaderHint: { marginTop: 2, fontFamily: font.regular, fontSize: 8.5, lineHeight: 13 }, filterClose: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, filterContent: { paddingHorizontal: 14, paddingBottom: 18, gap: 18 }, filterSection: { gap: 9 }, filterSectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 7 }, filterNumber: { width: 22, fontFamily: font.extraBold, fontSize: 8 }, filterTitle: { fontFamily: font.extraBold, fontSize: 12 }, filterRail: { gap: 7, paddingRight: 14 }, filterPill: { minHeight: 38, maxWidth: 220, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }, filterPillText: { flexShrink: 1, fontFamily: font.bold, fontSize: 9 }, filterPillSuffix: { fontFamily: font.bold, fontSize: 7 }, collectionGrid: { gap: 7 }, collectionChoice: { minHeight: 44, borderWidth: 1, borderRadius: 13, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }, collectionText: { flex: 1, fontFamily: font.bold, fontSize: 10 }, formatGrid: { flexDirection: 'row', gap: 7 }, formatChoice: { flex: 1, minWidth: 0, minHeight: 91, borderWidth: 1, borderRadius: 14, padding: 9 }, formatChoiceTop: { minHeight: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, formatChoiceTitle: { marginTop: 9, fontFamily: font.extraBold, fontSize: 9.5 }, formatChoiceDetail: { marginTop: 3, fontFamily: font.regular, fontSize: 7.5, lineHeight: 11 },
  intentGrid: { flexDirection: 'row', gap: 8 }, intentChoice: { flex: 1, minWidth: 0, minHeight: 116, borderWidth: 1, borderRadius: 16, padding: 11 }, intentChoiceTop: { minHeight: 35, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }, intentChoiceIcon: { width: 34, height: 34, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, intentCheck: { width: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, intentChoiceTitle: { marginTop: 9, fontFamily: font.extraBold, fontSize: 10.5 }, intentChoiceDetail: { marginTop: 4, fontFamily: font.regular, fontSize: 8, lineHeight: 12 },
  rewardChallenge: { position: 'relative', overflow: 'hidden', borderWidth: 1, borderRadius: 20, padding: 13 }, rewardChallengeTop: { flexDirection: 'row', alignItems: 'center', gap: 11 }, rewardEmblem: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }, rewardPulse: { position: 'absolute', width: 43, height: 43, borderRadius: 22, borderWidth: 7 }, rewardCore: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, rewardChallengeCopy: { flex: 1, minWidth: 0 }, rewardEyebrow: { fontFamily: font.bold, fontSize: 6.5, letterSpacing: 1 }, rewardTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 13 }, rewardHint: { marginTop: 2, fontFamily: font.regular, fontSize: 8, lineHeight: 12 }, rewardMetrics: { marginTop: 12, flexDirection: 'row', gap: 6 }, rewardMetric: { flex: 1, minWidth: 0, minHeight: 54, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' }, rewardMetricValue: { maxWidth: '100%', fontFamily: font.extraBold, fontSize: 14 }, rewardMetricLabel: { marginTop: 2, fontFamily: font.medium, fontSize: 7 },
  rewardResult: { borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, rewardResultIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, rewardResultCopy: { flex: 1, minWidth: 0 }, rewardResultEyebrow: { fontFamily: font.bold, fontSize: 6.5, letterSpacing: 1 }, rewardResultTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 12.5 }, rewardResultHint: { marginTop: 2, fontFamily: font.regular, fontSize: 8, lineHeight: 12 },
  composedTimingNote: { borderWidth: 1, borderRadius: 15, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 9 }, composedTimingCopy: { flex: 1, minWidth: 0 }, composedTimingTitle: { fontFamily: font.bold, fontSize: 10.5 }, composedTimingText: { marginTop: 3, fontFamily: font.regular, fontSize: 8, lineHeight: 12 },
  filterFooter: { minHeight: 72, borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }, filterFooterCopy: { flex: 1, minWidth: 0 }, filterFooterLabel: { fontFamily: font.bold, fontSize: 6.5, letterSpacing: .9 }, filterFooterValue: { marginTop: 3, fontFamily: font.bold, fontSize: 10 }, filterDone: { minHeight: 42, borderRadius: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7 }, filterDoneText: { fontFamily: font.bold, fontSize: 10 },
});
