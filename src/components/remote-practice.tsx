import { useEffect, useRef, useState, type ComponentType } from 'react';
import { ActivityIndicator, Animated, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft, ArrowRight, BookOpenCheck, Brain, BriefcaseBusiness, Check, CheckCircle2, ChevronRight, Clock3, Flag, History, LockKeyhole, RotateCcw, Search, Target, TimerReset, XCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { font, spacing } from '@/constants/theme';
import { completePracticeSession, createPracticeSession, getPracticeModes, getPracticeQuestions, getPracticeResult, getQuestionBanks, getResumablePracticeSession, markPracticeReview, previewPracticeSet, searchPracticeScope, submitPracticeAnswer, type PracticeBuild, type PracticeMode, type PracticeModeCard, type PracticeScopeItem, type PracticeSession, type QuestionBank } from '@/lib/practice-api';
import { STORE_BASE_URL } from '@/lib/env';
import { useAppTheme } from '@/providers/app-providers';
import { ProfileShortcut } from '@/components/profile-shortcut';

const modeIcons: Record<PracticeMode, ComponentType<{ size?: number; color?: string }>> = { MCQ: Brain, CASE_STUDY: BookOpenCheck, QUESTION_BANK: BriefcaseBusiness, WRONG_ANSWERS: RotateCcw, REVISIT: History };
const countOptions = [5, 10, 20, 30, 50];
const timerOptions = [{ label: 'Off', value: null }, { label: '10m', value: 600 }, { label: '20m', value: 1200 }, { label: '30m', value: 1800 }];
const isReviewMode = (mode: PracticeMode) => mode === 'WRONG_ANSWERS' || mode === 'REVISIT';
const currentTimeMs = () => Date.now();

export function RemotePracticeScreen() {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [session, setSession] = useState<PracticeSession | null>(null);
  const contentWidth = Math.min(width, 760);
  return <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safe, { backgroundColor: theme.canvas }]}><View style={[styles.frame, { width: contentWidth }]}>{session ? <PracticeRunner initial={session} onExit={() => setSession(null)} /> : <PracticeStudio onCreated={setSession} onTracker={() => router.push('/practice-tracker')} />}</View></SafeAreaView>;
}

function PracticeStudio({ onCreated, onTracker }: { onCreated: (session: PracticeSession) => void; onTracker: () => void }) {
  const { theme } = useAppTheme();
  const [mode, setMode] = useState<PracticeMode>('MCQ');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PracticeScopeItem[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string>();
  const [questionCount, setQuestionCount] = useState<number | null>(10);
  const [timerSeconds, setTimerSeconds] = useState<number | null>(600);
  const [customQuestionCount, setCustomQuestionCount] = useState('');
  const [customCountSelected, setCustomCountSelected] = useState(false);
  const [customHours, setCustomHours] = useState('');
  const [customMinutes, setCustomMinutes] = useState('');
  const [setupError, setSetupError] = useState('');
  const [reveal] = useState(() => new Animated.Value(1));
  const modes = useQuery({ queryKey: ['student', 'practice', 'modes'], queryFn: getPracticeModes });
  const banks = useQuery({ queryKey: ['student', 'practice', 'question-banks'], queryFn: getQuestionBanks, enabled: mode === 'QUESTION_BANK' });
  const resume = useQuery({ queryKey: ['student', 'practice', 'resume'], queryFn: getResumablePracticeSession });
  const selectedIds = selected.filter((item) => item.kind === 'MATERIAL').map((item) => item.id);
  const selectedTopic = selected.find((item) => item.kind === 'TOPIC');
  const activeMode = modes.data?.modes.find((item) => item.id === mode);
  const selectedBank = banks.data?.find((bank) => bank.id === selectedBankId);
  const selectedBankAccessible = selectedBank && !selectedBank.locked ? selectedBank : undefined;
  const scope = useQuery({ queryKey: ['student', 'practice', 'search', mode, selectedBankAccessible?.id, query], queryFn: () => searchPracticeScope(mode, query, selectedBankAccessible?.id), enabled: mode !== 'QUESTION_BANK' || Boolean(selectedBankAccessible) });
  const modeAvailable = mode === 'QUESTION_BANK' ? selectedBankAccessible?.questionCount ?? 0 : activeMode?.availableCount ?? 0;
  const previewInput: PracticeBuild = { sourceKind: 'ARCHIVE', mode, ...(selectedIds.length ? { contentItemIds: selectedIds } : {}), ...(selectedTopic ? { topicId: selectedTopic.id } : {}), ...(mode === 'QUESTION_BANK' ? { collection: 'QUESTION_BANK', questionBankId: selectedBankId } : {}), answerFormat: mode === 'CASE_STUDY' ? 'CASE_STUDY' : 'MCQ', questionCount: 1 };
  const preview = useQuery({
    queryKey: ['student', 'practice', 'preview', mode, selectedBankAccessible?.id, [...selectedIds].sort().join(','), selectedTopic?.id],
    queryFn: () => previewPracticeSet(previewInput),
    enabled: modeAvailable > 0 && (mode !== 'QUESTION_BANK' || Boolean(selectedBankAccessible)),
    retry: false,
  });
  const available = preview.data?.eligibleQuestionCount ?? (preview.isError ? 0 : modeAvailable);
  const allowedCounts = countOptions.filter((value) => value <= available);
  const typedCount = customQuestionCount.trim() ? Number(customQuestionCount) : null;
  const effectiveCount = typedCount !== null && Number.isInteger(typedCount) ? typedCount : questionCount === null ? null : Math.min(questionCount, available || questionCount);
  const build: PracticeBuild = { sourceKind: 'ARCHIVE', mode, ...(selectedIds.length ? { contentItemIds: selectedIds } : {}), ...(selectedTopic ? { topicId: selectedTopic.id } : {}), ...(mode === 'QUESTION_BANK' ? { collection: 'QUESTION_BANK', questionBankId: selectedBankId } : {}), answerFormat: mode === 'CASE_STUDY' ? 'CASE_STUDY' : 'MCQ', ...(effectiveCount !== null ? { questionCount: Math.max(1, effectiveCount) } : {}), ...(timerSeconds ? { timerSeconds } : {}) };
  const create = useMutation({ mutationFn: () => createPracticeSession(build), onSuccess: onCreated });
  const startDisabled = create.isPending || preview.isFetching || (mode === 'QUESTION_BANK' && !selectedBankAccessible);

  const openBankStore = async (bank: QuestionBank) => {
    const path = bank.storePath || `/store/product/${encodeURIComponent(bank.slug || bank.id)}`;
    const url = `${STORE_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
    try { await Linking.openURL(url); } catch { setSetupError('The Store could not be opened on this device. Please try again.'); }
  };

  const startSession = () => {
    setSetupError('');
    if (mode === 'QUESTION_BANK') {
      if (!selectedBankId) { setSetupError('Choose a Question Bank before starting this session.'); return; }
      if (!selectedBank) { setSetupError('That Question Bank is no longer available. Refresh and choose another bank.'); return; }
      if (selectedBank.locked) { setSetupError('Purchase this Question Bank in the Store before starting practice.'); return; }
    }
    if (customQuestionCount.trim() && (typedCount === null || !Number.isInteger(typedCount) || typedCount < 1 || typedCount > 100)) { setSetupError('Enter a whole number from 1 to 100 questions.'); return; }
    if (available < 1) { setSetupError('No published questions are available for this selection.'); return; }
    if (effectiveCount !== null && (!Number.isInteger(effectiveCount) || effectiveCount < 1 || effectiveCount > available)) { setSetupError(`Choose between 1 and ${available} questions, or deselect the count for an unlimited session.`); return; }
    if (timerSeconds !== null && (!Number.isInteger(timerSeconds) || timerSeconds < 30 || timerSeconds > 86_400)) { setSetupError('Choose a timer between 30 seconds and 24 hours, or turn it off.'); return; }
    create.mutate();
  };

  const chooseMode = (next: PracticeMode) => {
    if (next === mode) return;
    setMode(next); setSelected([]); setSelectedBankId(undefined); setQuery(''); setQuestionCount(10); setCustomQuestionCount(''); setCustomCountSelected(false); setSetupError('');
    reveal.setValue(0);
    Animated.spring(reveal, { toValue: 1, damping: 18, stiffness: 180, mass: .7, useNativeDriver: true }).start();
  };
  const toggle = (item: PracticeScopeItem) => { setSetupError(''); setSelected((current) => current.some((entry) => entry.id === item.id) ? current.filter((entry) => entry.id !== item.id) : item.kind === 'TOPIC' ? [...current.filter((entry) => entry.kind !== 'TOPIC'), item] : [...current, item]); };
  const applyCustomQuestionCount = () => {
    const custom = Number(customQuestionCount);
    if (!Number.isInteger(custom) || custom < 1 || custom > 100) { setSetupError('Enter a whole number from 1 to 100 questions.'); return; }
    if (available > 0 && custom > available) { setSetupError(`Only ${available} question${available === 1 ? '' : 's'} are available for this mode.`); return; }
    setQuestionCount(custom); setCustomCountSelected(true); setSetupError('');
  };
  const applyCustomTimer = () => {
    const hours = customHours.trim() ? Number(customHours) : 0;
    const minutes = customMinutes.trim() ? Number(customMinutes) : 0;
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || minutes < 0 || minutes > 59) { setSetupError('Enter whole hours and 0 to 59 minutes.'); return; }
    const totalMinutes = hours * 60 + minutes;
    if (totalMinutes < 1 || totalMinutes > 1440) { setSetupError('Set a timer between 1 minute and 24 hours.'); return; }
    setTimerSeconds(totalMinutes * 60); setSetupError('');
  };

  if (modes.isLoading) return <State loading title="Preparing Practice Studio" text="Checking your course, files and entitlements…" />;
  if (modes.isError || !modes.data) return <State title="Practice is unavailable" text="We could not load your authorized question modes." action="Try again" onPress={() => modes.refetch()} />;

  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.heroRow}><View style={[styles.flex, { minWidth: 0 }]}><Text style={[styles.eyebrow, { color: theme.primary }]}>PRACTICE STUDIO</Text><Text style={[styles.title, { color: theme.fg }]}>Train with intention.</Text><Text style={[styles.subtitle, { color: theme.muted }]}>Questions are selected securely from {modes.data.course.name} and only from materials you can access.</Text></View><View style={{ alignItems: 'flex-end', gap: 10 }}><ProfileShortcut /><Pressable accessibilityLabel="Open practice tracker" onPress={onTracker} style={[styles.tracker, { backgroundColor: theme.primarySoft, borderColor: theme.lineStrong }]}><Target size={20} color={theme.primaryStrong} /></Pressable></View></View>

    {resume.data ? <Pressable onPress={() => onCreated(resume.data!)} style={[styles.resume, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}><View style={[styles.resumeIcon, { backgroundColor: theme.gold }]}><RotateCcw size={16} color={theme.primaryFg} /></View><View style={styles.flex}><Text style={[styles.resumeTitle, { color: theme.fg }]}>Resume your {labelMode(resume.data.mode)} session</Text><Text style={[styles.resumeText, { color: theme.muted }]}>{resume.data.answeredCount ?? 0} of {resume.data.questionCount} answered · progress is saved</Text></View><ChevronRight size={18} color={theme.goldStrong} /></Pressable> : null}

    <SectionLabel number="01" title="Choose a mode" />
    <View style={styles.modeGrid}>{modes.data.modes.map((item) => <ModeCard key={item.id} item={item} selected={mode === item.id} onPress={() => chooseMode(item.id)} />)}</View>

    <Animated.View style={{ opacity: reveal, transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
      <SectionLabel number="02" title="Find your focus" />
      <View style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.line }]}><Search size={18} color={theme.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search materials or topics" placeholderTextColor={theme.faint} style={[styles.searchInput, { color: theme.fg }]} />{query ? <Pressable onPress={() => setQuery('')}><XCircle size={17} color={theme.faint} /></Pressable> : null}</View>
      {mode === 'QUESTION_BANK' && banks.isLoading ? <State loading title="Loading Question Banks" text="Checking free and purchased collections…" compact /> : null}
      {mode === 'QUESTION_BANK' && banks.isError ? <State title="Question Banks unavailable" text="We could not load the collections for this course." action="Try again" onPress={() => banks.refetch()} compact /> : null}
      {mode === 'QUESTION_BANK' && banks.data?.length ? <View style={styles.bankList}>{banks.data.map((bank) => { const active = !bank.locked && bank.id === selectedBankId; const formats = bank.questionKinds.length > 1 ? 'Normal + case-based' : bank.questionKinds[0] === 'CASE_MCQ' ? 'Case-based' : 'Normal MCQ'; const access = bank.accessType === 'FREE' ? 'Free collection' : bank.includedInPackage && bank.includedPackage ? `Included in ${bank.includedPackage.title}` : bank.locked ? `Paid · ₹${bank.price.toLocaleString('en-IN')} · Purchase required` : 'Purchased collection'; const state = active ? 'SELECTED' : bank.locked ? 'VIEW STORE' : bank.includedInPackage ? 'INCLUDED' : 'AVAILABLE'; return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => { setSetupError(''); setSelected([]); if (bank.locked) void openBankStore(bank); else setSelectedBankId(bank.id); }} key={bank.id} style={[styles.bankCard, { backgroundColor: active ? theme.goldSoft : theme.surface, borderColor: active ? theme.gold : bank.locked ? theme.goldStrong : theme.line }]}><View style={[styles.bankIcon, { backgroundColor: active ? theme.gold : bank.locked ? theme.goldSoft : theme.sunken }]}>{active ? <Check size={18} color={theme.primaryFg} /> : bank.locked ? <LockKeyhole size={18} color={theme.goldStrong} /> : <BriefcaseBusiness size={18} color={theme.muted} />}</View><View style={styles.flex}><Text style={[styles.materialTitle, { color: theme.fg }]}>{bank.title}</Text><Text style={[styles.materialMeta, { color: theme.muted }]}>{bank.questionCount} questions · {formats} · {access}</Text></View><Text style={[styles.bankState, { color: active ? theme.goldStrong : bank.locked ? theme.goldStrong : theme.success }]}>{state}</Text></Pressable>; })}</View> : null}
      {mode === 'QUESTION_BANK' && banks.data && !banks.data.length ? <View style={[styles.emptyScope, { backgroundColor: theme.surface, borderColor: theme.line }]}><AlertCircle size={20} color={theme.muted} /><Text style={[styles.emptyTitle, { color: theme.fg }]}>No Question Banks available</Text><Text style={[styles.emptyText, { color: theme.muted }]}>Published collections for your selected course will appear here.</Text></View> : null}
      {(mode !== 'QUESTION_BANK' || selectedBankAccessible) && (scope.isLoading ? <State loading title="Finding questions" text="Applying course and access rules…" compact /> : scope.isError ? <State title="Search unavailable" text="Your practice scope could not be loaded." action="Retry" onPress={() => scope.refetch()} compact /> : <>
        {scope.data?.materials.length ? <ScopeRail title="Materials" items={scope.data.materials} selected={selected} onToggle={toggle} /> : null}
        {scope.data?.topics.length ? <ScopeRail title="Topics" items={scope.data.topics} selected={selected} onToggle={toggle} /> : null}
        {!scope.data?.materials.length && !scope.data?.topics.length ? <View style={[styles.emptyScope, { backgroundColor: theme.surface, borderColor: theme.line }]}><AlertCircle size={20} color={theme.muted} /><Text style={[styles.emptyTitle, { color: theme.fg }]}>{!query && available > 0 && mode === 'REVISIT' ? `${available} question${available === 1 ? '' : 's'} ready to revisit` : !query && available > 0 && mode === 'WRONG_ANSWERS' ? `${available} wrong answer${available === 1 ? '' : 's'} ready` : mode === 'QUESTION_BANK' ? banks.data?.length ? 'Choose a Question Bank above' : 'No Question Bank available' : mode === 'WRONG_ANSWERS' ? 'No wrong answers to practise' : mode === 'REVISIT' ? 'No questions ready to revisit' : 'No matching questions'}</Text><Text style={[styles.emptyText, { color: theme.muted }]}>{!query && available > 0 && isReviewMode(mode) ? 'These questions do not need a material or topic filter. Shape the session below to practise all available questions.' : mode === 'QUESTION_BANK' ? 'Free and purchased collections for your selected course appear here automatically.' : mode === 'REVISIT' ? 'Questions appear here after you answer them correctly.' : 'Try a different search or choose another mode.'}</Text></View> : null}
      </>)}
      {mode === 'QUESTION_BANK' && banks.data?.length && !selectedBankAccessible ? <View style={[styles.emptyScope, { backgroundColor: theme.surface, borderColor: theme.line }]}><LockKeyhole size={20} color={selectedBank?.locked ? theme.goldStrong : theme.muted} /><Text style={[styles.emptyTitle, { color: theme.fg }]}>{selectedBank?.locked ? 'Purchase required' : 'Choose a Question Bank above'}</Text><Text style={[styles.emptyText, { color: theme.muted }]}>{selectedBank?.locked ? 'This paid collection is visible, but its questions remain protected until it is purchased in the Store.' : 'Select a free or purchased collection to configure the session.'}</Text>{selectedBank?.locked ? <Pressable onPress={() => void openBankStore(selectedBank)} style={[styles.storeAction, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}><Text style={[styles.storeActionText, { color: theme.goldStrong }]}>Open Store</Text><ArrowRight size={15} color={theme.goldStrong} /></Pressable> : null}</View> : null}
      {selected.length ? <View style={styles.selectedRow}>{selected.map((item) => <Pressable key={item.id} onPress={() => toggle(item)} style={[styles.selectedChip, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}><Text numberOfLines={1} style={[styles.selectedText, { color: theme.primaryStrong }]}>{item.title}</Text><XCircle size={13} color={theme.primaryStrong} /></Pressable>)}</View> : null}
    </Animated.View>

    <SectionLabel number="03" title="Shape the session" />
    <View style={[styles.setupCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.setupLabel, { color: theme.muted }]}>QUESTION COUNT</Text><View style={styles.segmentRow}>{countOptions.map((value) => { const active = !customCountSelected && questionCount === value; const disabled = value > available && !active; return <Pressable accessibilityRole="button" accessibilityState={{ selected: active, disabled }} key={value} disabled={disabled} onPress={() => { setQuestionCount(active ? null : value); setCustomQuestionCount(''); setCustomCountSelected(false); setSetupError(''); }} style={[styles.segment, { backgroundColor: active ? theme.primarySoft : theme.sunken, borderColor: active ? theme.primary : theme.line }, disabled && styles.disabled]}><Text style={[styles.segmentText, { color: active ? theme.primaryStrong : theme.muted }]}>{value}</Text></Pressable>; })}</View>
      <View style={styles.customBlock}><Text style={[styles.customLabel, { color: theme.faint }]}>CUSTOM COUNT</Text><View style={styles.customRow}><TextInput accessibilityLabel="Custom number of questions" keyboardType="number-pad" value={customQuestionCount} onChangeText={(value) => { setCustomQuestionCount(value); setQuestionCount(null); setCustomCountSelected(Boolean(value.trim())); setSetupError(''); }} onSubmitEditing={applyCustomQuestionCount} placeholder="e.g. 8" placeholderTextColor={theme.faint} style={[styles.customInput, { color: theme.fg, borderColor: theme.line, backgroundColor: theme.sunken }]} /><Pressable accessibilityRole="button" onPress={applyCustomQuestionCount} style={[styles.apply, { backgroundColor: theme.primarySoft }]}><Text style={[styles.applyText, { color: theme.primaryStrong }]}>Use count</Text></Pressable></View></View>
      {available > 0 && !allowedCounts.length ? <Text style={[styles.availableHint, { color: theme.goldStrong }]}>Only {available} question{available === 1 ? '' : 's'} available; the server will use all of them.</Text> : null}
      {effectiveCount === null ? <Text style={[styles.availableHint, { color: theme.success }]}>Unlimited selected — all available questions will be included. You can end the session at any time.</Text> : null}
      <View style={[styles.divider, { backgroundColor: theme.line }]} />
      <View style={styles.timerHeading}><View><Text style={[styles.setupLabel, { color: theme.muted }]}>SESSION TIMER</Text><Text style={[styles.timerHint, { color: theme.faint }]}>Server-authoritative deadline</Text></View><View style={[styles.timerOrb, { backgroundColor: theme.goldSoft }]}><Clock3 size={16} color={theme.goldStrong} /><Text style={[styles.timerOrbText, { color: theme.goldStrong }]}>{timerSeconds ? formatTime(timerSeconds) : '∞'}</Text></View></View>
      <View style={styles.segmentRow}>{timerOptions.map((option) => { const active = timerSeconds === option.value; return <Pressable key={option.label} onPress={() => { setTimerSeconds(option.value); setSetupError(''); }} style={[styles.segment, { backgroundColor: active ? theme.goldSoft : theme.sunken, borderColor: active ? theme.gold : theme.line }]}><Text style={[styles.segmentText, { color: active ? theme.goldStrong : theme.muted }]}>{option.label}</Text></Pressable>; })}</View>
      <View style={styles.customBlock}><Text style={[styles.customLabel, { color: theme.faint }]}>CUSTOM DURATION</Text><View style={styles.customRow}><TimerReset size={17} color={theme.muted} /><TextInput accessibilityLabel="Custom timer hours" keyboardType="number-pad" value={customHours} onChangeText={setCustomHours} onSubmitEditing={applyCustomTimer} placeholder="Hours" placeholderTextColor={theme.faint} style={[styles.customInput, { color: theme.fg, borderColor: theme.line, backgroundColor: theme.sunken }]} /><TextInput accessibilityLabel="Custom timer minutes" keyboardType="number-pad" value={customMinutes} onChangeText={setCustomMinutes} onSubmitEditing={applyCustomTimer} placeholder="Minutes" placeholderTextColor={theme.faint} style={[styles.customInput, { color: theme.fg, borderColor: theme.line, backgroundColor: theme.sunken }]} /><Pressable accessibilityRole="button" onPress={applyCustomTimer} style={[styles.apply, { backgroundColor: theme.goldSoft }]}><Text style={[styles.applyText, { color: theme.goldStrong }]}>Set</Text></Pressable></View></View>
    </View>

    <Pressable accessibilityRole="button" accessibilityState={{ disabled: startDisabled }} disabled={startDisabled} onPress={startSession} style={[styles.start, { backgroundColor: theme.primary }, startDisabled && styles.disabled]}>{create.isPending ? <ActivityIndicator color={theme.primaryFg} /> : <><View><Text style={[styles.startEyebrow, { color: theme.primaryFg }]}>READY TO BEGIN</Text><Text style={[styles.startText, { color: theme.primaryFg }]}>{mode === 'QUESTION_BANK' && !selectedBankAccessible ? 'Choose an accessible Question Bank' : effectiveCount === null ? 'Start unlimited session' : `Start ${Math.max(1, effectiveCount)}-question session`}</Text></View><ArrowRight size={21} color={theme.primaryFg} /></>}</Pressable>
    {setupError ? <InlineError text={setupError} /> : null}
    {create.isError ? <InlineError text={errorMessage(create.error)} /> : null}
  </ScrollView>;
}

function ModeCard({ item, selected, onPress }: { item: PracticeModeCard; selected: boolean; onPress: () => void }) {
  const { theme } = useAppTheme(); const Icon = modeIcons[item.id];
  return <Pressable onPress={onPress} style={[styles.modeCard, { backgroundColor: selected ? theme.primarySoft : theme.surface, borderColor: selected ? theme.primary : theme.line }]}><View style={[styles.modeIcon, { backgroundColor: selected ? theme.primary : theme.sunken }]}><Icon size={18} color={selected ? theme.primaryFg : theme.muted} /></View><View style={styles.flex}><Text style={[styles.modeTitle, { color: theme.fg }]}>{item.title}</Text><Text numberOfLines={2} style={[styles.modeText, { color: theme.muted }]}>{item.description}</Text></View><View style={[styles.countBadge, { backgroundColor: item.locked ? theme.sunken : selected ? theme.primary : theme.successSoft }]}>{item.locked ? <LockKeyhole size={12} color={theme.faint} /> : <Text style={[styles.countText, { color: selected ? theme.primaryFg : theme.success }]}>{item.availableCount}</Text>}</View></Pressable>;
}

function ScopeRail({ title, items, selected, onToggle }: { title: string; items: PracticeScopeItem[]; selected: PracticeScopeItem[]; onToggle: (item: PracticeScopeItem) => void }) {
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const materialPageWidth = Math.min(width, 760) - spacing.lg * 2;
  const materialPages = Array.from({ length: Math.ceil(items.length / 4) }, (_, index) => items.slice(index * 4, index * 4 + 4));
 return <View style={styles.scopeBlock}><View style={styles.scopeHead}><Text style={[styles.scopeTitle, { color: theme.fg }]}>{title}</Text><Text style={[styles.scopeHint, { color: theme.faint }]}>Select one or more</Text></View>{title === 'Materials' ? <ScrollView horizontal snapToInterval={materialPageWidth + 9} showsHorizontalScrollIndicator={false} decelerationRate="fast" contentContainerStyle={styles.materialPages}>{materialPages.map((page) => <View key={page.map((item) => item.id).join(':')} style={[styles.materialGrid, { width: materialPageWidth }]}>{page.map((item) => { const active = selected.some((entry) => entry.id === item.id); return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} key={item.id} onPress={() => onToggle(item)} style={[styles.materialGridCard, { width: (materialPageWidth - 8) / 2, backgroundColor: active ? theme.primarySoft : theme.surface, borderColor: active ? theme.primary : theme.line }]}><View style={styles.materialGridTop}><View style={[styles.materialMark, { backgroundColor: active ? theme.primary : theme.sunken }]}>{active ? <Check size={14} color={theme.primaryFg} /> : <BookOpenCheck size={14} color={theme.muted} />}</View><Text style={[styles.materialCount, { color: theme.faint }]}>{item.questionCount} Q</Text></View><Text numberOfLines={1} style={[styles.materialTitle, { color: theme.fg }]}>{item.title}</Text><Text numberOfLines={1} style={[styles.materialMeta, { color: theme.muted }]}>{item.subtitle}</Text></Pressable>; })}</View>)}</ScrollView> : <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopeRail}>{items.map((item) => { const active = selected.some((entry) => entry.id === item.id); return <Pressable key={item.id} onPress={() => onToggle(item)} style={[styles.materialCard, { backgroundColor: active ? theme.primarySoft : theme.surface, borderColor: active ? theme.primary : theme.line }]}><View style={styles.materialTop}><View style={[styles.materialMark, { backgroundColor: active ? theme.primary : theme.sunken }]}>{active ? <Check size={14} color={theme.primaryFg} /> : <Brain size={14} color={theme.muted} />}</View><Text style={[styles.materialCount, { color: theme.faint }]}>{item.questionCount} Q</Text></View><Text numberOfLines={2} style={[styles.materialTitle, { color: theme.fg }]}>{item.title}</Text><Text numberOfLines={1} style={[styles.materialMeta, { color: theme.muted }]}>{item.subtitle}</Text></Pressable>; })}</ScrollView>}</View>;
}

function PracticeRunner({ initial, onExit }: { initial: PracticeSession; onExit: () => void }) {
  const { theme } = useAppTheme(); const qc = useQueryClient();
  const [index, setIndex] = useState(0); const [selected, setSelected] = useState<string>(); const [feedback, setFeedback] = useState<{ correct: boolean | null; correctOptionLabel: string | null; correctExplanation: string | null; wrongExplanation: string | null; retryAllowed: boolean }>(); const [result, setResult] = useState<Awaited<ReturnType<typeof getPracticeResult>> | null>(null);
  const runnerScrollRef = useRef<ScrollView>(null);
  const finishingRef = useRef(false);
  const [questionStopwatchMs, setQuestionStopwatchMs] = useState(0);
  const [questionTimings, setQuestionTimings] = useState<QuestionTiming[]>([]);
  const timingTotalsRef = useRef<Record<string, number>>({});
  const timingStartedAtRef = useRef(0);
  const timingQuestionIdRef = useRef<string | null>(null);
  const timingRunningRef = useRef(false);
  const session = useQuery({ queryKey: ['student', 'practice', 'session', initial.id], queryFn: () => getPracticeResult(initial.id).then((item) => item.session), initialData: initial, refetchInterval: 15_000 });
  const questions = useQuery({ queryKey: ['student', 'practice', 'questions', initial.id], queryFn: () => getPracticeQuestions(initial.id) });
  const items = questions.data?.items ?? []; const question = items[index];
  const untimed = !session.data.expiresAt;
  const pauseQuestionStopwatch = () => {
    const questionId = timingQuestionIdRef.current;
    if (!untimed || !questionId || !timingRunningRef.current) return questionId ? timingTotalsRef.current[questionId] ?? 0 : 0;
    const total = (timingTotalsRef.current[questionId] ?? 0) + Math.max(0, currentTimeMs() - timingStartedAtRef.current);
    timingTotalsRef.current[questionId] = total;
    timingRunningRef.current = false;
    setQuestionStopwatchMs(total);
    return total;
  };
  const resumeQuestionStopwatch = () => {
    if (!untimed || !question || question.final || feedback) return;
    timingQuestionIdRef.current = question.id;
    timingStartedAtRef.current = currentTimeMs();
    timingRunningRef.current = true;
  };
  const submit = useMutation({
    mutationFn: async () => {
      const durationMs = untimed ? pauseQuestionStopwatch() : undefined;
      const data = await submitPracticeAnswer(initial.id, question.id, { answerOptionLabel: selected!, ...(durationMs !== undefined ? { durationMs } : {}) });
      return { data, durationMs, questionId: question.id, sequence: question.sequence };
    },
    onSuccess: async ({ data, durationMs, questionId, sequence }) => {
      if (durationMs !== undefined) setQuestionTimings((current) => [...current.filter((item) => item.questionId !== questionId), { questionId, sequence, durationMs }].sort((a, b) => a.sequence - b.sequence));
      setFeedback({ correct: data.attempt.correct, correctOptionLabel: data.result.correctOptionLabel, correctExplanation: data.result.correctExplanation, wrongExplanation: data.result.wrongExplanation, retryAllowed: data.result.retryAllowed });
      qc.setQueryData<typeof questions.data>(['student', 'practice', 'questions', initial.id], (current) => current ? {
        ...current,
        items: current.items.map((item) => item.id === questionId ? { ...item, navigatorState: data.result.navigatorState, attemptCount: item.attemptCount + 1, final: !data.result.retryAllowed } : item),
      } : current);
      if (data.session) qc.setQueryData<PracticeSession>(['student', 'practice', 'session', initial.id], (current) => current ? { ...current, ...data.session } : current);
      void Promise.all([qc.invalidateQueries({ queryKey: ['student', 'practice', 'modes'], refetchType: 'none' }), qc.invalidateQueries({ queryKey: ['student', 'practice', 'search'], refetchType: 'none' })]).catch(() => undefined);
    },
    onError: resumeQuestionStopwatch,
  });
  const review = useMutation({ mutationFn: () => markPracticeReview(initial.id, question.id, question.navigatorState !== 'MARKED_REVIEW'), onSuccess: () => questions.refetch() });
  const finish = useMutation({
    mutationFn: () => completePracticeSession(initial.id),
    onSuccess: (completedResult) => {
      finishingRef.current = false;
      const { completionTimingReport } = completedResult;
      if (untimed && completionTimingReport) setQuestionTimings(completionTimingReport);
      setResult(completedResult);
      void qc.invalidateQueries({ queryKey: ['student', 'practice'] });
    },
    onError: () => { finishingRef.current = false; resumeQuestionStopwatch(); },
  });
  const finishSession = () => {
    if (finishingRef.current || finish.isPending) return;
    finishingRef.current = true;
    pauseQuestionStopwatch();
    finish.mutate();
  };
  const goToQuestion = (next: number) => {
    if (next < 0 || next >= items.length || next === index) return;
    pauseQuestionStopwatch();
    setIndex(next);
    setSelected(undefined);
    setFeedback(undefined);
    requestAnimationFrame(() => runnerScrollRef.current?.scrollTo({ y: 0, animated: false }));
  };
  const seconds = useCountdown(session.data.expiresAt);
  const sessionExpiresAt = session.data.expiresAt; const sessionStatus = session.data.status; const refetchSession = session.refetch;
  useEffect(() => { if (sessionExpiresAt && seconds === 0 && sessionStatus === 'ACTIVE') void refetchSession(); }, [seconds, sessionExpiresAt, sessionStatus, refetchSession]);
  useEffect(() => {
    if (!untimed || !question) return;
    timingQuestionIdRef.current = question.id;
    setQuestionStopwatchMs(timingTotalsRef.current[question.id] ?? 0);
    timingStartedAtRef.current = currentTimeMs();
    timingRunningRef.current = !question.final;
  }, [question, untimed]);
  useEffect(() => {
    if (!untimed) return;
    const update = () => {
      const questionId = timingQuestionIdRef.current;
      if (questionId && timingRunningRef.current) setQuestionStopwatchMs((timingTotalsRef.current[questionId] ?? 0) + Math.max(0, currentTimeMs() - timingStartedAtRef.current));
    };
    update();
    const timer = setInterval(update, 250);
    return () => clearInterval(timer);
  }, [untimed]);
  if (questions.isLoading) return <State loading title="Opening your session" text="Restoring questions and saved progress…" />;
  if (questions.isError || !question) return <State title="Session unavailable" text="The questions could not be restored securely." action="Back to Practice" onPress={onExit} />;
  if (result) return <ResultScreen result={result} questionTimings={untimed ? questionTimings : undefined} onDone={onExit} />;
  const expired = session.data.status === 'EXPIRED' || Boolean(session.data.expiresAt && seconds <= 0);
  return <ScrollView ref={runnerScrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.runnerHead}><Pressable onPress={() => { pauseQuestionStopwatch(); onExit(); }} style={[styles.back, { backgroundColor: theme.surface, borderColor: theme.line }]}><ArrowLeft size={18} color={theme.fg} /></Pressable><View style={styles.flex}><Text style={[styles.eyebrow, { color: theme.primary }]}>{labelMode(session.data.mode).toUpperCase()} · SESSION LIVE</Text><Text style={[styles.runnerTitle, { color: theme.fg }]}>Question {index + 1} of {items.length}</Text></View><View style={styles.untimedControls}>{session.data.expiresAt ? <View style={[styles.liveClock, { backgroundColor: seconds < 60 ? theme.dangerSoft : theme.goldSoft }]}><Clock3 size={15} color={seconds < 60 ? theme.danger : theme.goldStrong} /><Text style={[styles.liveClockText, { color: seconds < 60 ? theme.danger : theme.goldStrong }]}>{formatTime(seconds)}</Text></View> : <View accessibilityLabel={`Question time ${formatTime(Math.floor(questionStopwatchMs / 1000))}`} style={[styles.liveClock, { backgroundColor: theme.goldSoft }]}><Clock3 size={15} color={theme.goldStrong} /><Text style={[styles.liveClockText, { color: theme.goldStrong }]}>{formatTime(Math.floor(questionStopwatchMs / 1000))}</Text></View>}{untimed || session.data.unlimitedQuestions ? <Pressable accessibilityRole="button" accessibilityLabel="End practice session" disabled={finish.isPending} onPress={finishSession} style={[styles.endSession, { borderColor: theme.danger }]}><Text style={[styles.endSessionText, { color: theme.danger }]}>{finish.isPending ? 'Ending…' : 'End session'}</Text></Pressable> : null}</View></View>
    <View style={[styles.progress, { backgroundColor: theme.sunken }]}><View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${(index + 1) / items.length * 100}%` }]} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigator}>{items.map((item, itemIndex) => <Pressable key={item.id} onPress={() => goToQuestion(itemIndex)} style={[styles.nav, { backgroundColor: navigatorColor(item.navigatorState, theme), borderColor: itemIndex === index ? theme.primary : theme.line }]}><Text style={[styles.navText, { color: itemIndex === index ? theme.primaryStrong : theme.fg }]}>{item.sequence}</Text></Pressable>)}</ScrollView>
    <View style={[styles.questionCard, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={styles.questionMeta}><Text style={[styles.difficulty, { color: theme.primary }]}>{question.difficulty}</Text><Pressable disabled={question.final || expired} onPress={() => review.mutate()} style={[styles.review, { backgroundColor: theme.sunken }]}><Flag size={15} color={question.navigatorState === 'MARKED_REVIEW' ? theme.goldStrong : theme.muted} /><Text style={[styles.reviewText, { color: theme.muted }]}>Review</Text></Pressable></View>{question.caseHtml ? <View style={[styles.casePanel, { backgroundColor: theme.primarySoft, borderColor: theme.lineStrong }]}><Text style={[styles.caseLabel, { color: theme.primary }]}>CASE PASSAGE</Text><Text style={[styles.caseText, { color: theme.muted }]}>{plain(question.caseHtml)}</Text></View> : null}<Text style={[styles.prompt, { color: theme.fg }]}>{plain(question.promptHtml)}</Text><View style={styles.options}>{question.options.map((option) => { const active = selected === option.optionLabel; const correctOption = Boolean(feedback && feedback.correctOptionLabel === option.optionLabel); const wrongSelection = Boolean(feedback && active && feedback.correct === false); const evaluatedTone = correctOption ? theme.success : wrongSelection ? theme.danger : null; return <Pressable key={option.optionLabel} disabled={expired || (question.final && !feedback?.retryAllowed)} onPress={() => setSelected(option.optionLabel)} style={[styles.option, { backgroundColor: correctOption ? theme.successSoft : wrongSelection ? theme.dangerSoft : active ? theme.primarySoft : theme.sunken, borderColor: evaluatedTone ?? (active ? theme.primary : theme.line) }]}><View style={[styles.optionLetter, { backgroundColor: evaluatedTone ?? (active ? theme.primary : theme.surface) }]}><Text style={[styles.optionLetterText, { color: evaluatedTone || active ? theme.primaryFg : theme.muted }]}>{option.optionLabel}</Text></View><Text style={[styles.optionCopy, { color: evaluatedTone ?? theme.fg }]}>{plain(option.html)}</Text></Pressable>; })}</View></View>
    {feedback ? <View style={styles.explanationStack}>{([{ kind: 'correct' as const, value: feedback.correctExplanation }, { kind: 'wrong' as const, value: feedback.wrongExplanation }]).map((item) => { const correct = item.kind === 'correct'; return <View key={item.kind} style={[styles.explanationCard, { backgroundColor: correct ? theme.successSoft : theme.dangerSoft, borderColor: correct ? theme.success : theme.danger }]}>{correct ? <CheckCircle2 size={20} color={theme.success} /> : <XCircle size={20} color={theme.danger} />}<View style={styles.flex}><Text style={[styles.explanationTitle, { color: correct ? theme.success : theme.danger }]}>{correct ? 'Correct Answer Explanation' : 'Wrong Answer Explanation'}</Text><Text style={[styles.explanationText, { color: theme.fg }]}>{item.value ? plain(item.value) : correct ? 'A correct-answer explanation was not provided for this question.' : 'A wrong-answer explanation was not provided for this question.'}</Text></View></View>; })}</View> : null}
    {expired ? <InlineError text="Time is up. The server has closed this session to new answers." /> : null}
    {submit.isError ? <InlineError text={errorMessage(submit.error)} /> : null}
    {finish.isError ? <InlineError text={errorMessage(finish.error)} /> : null}
    <View style={styles.runnerActions}><Pressable disabled={index === 0 || finish.isPending} onPress={() => goToQuestion(index - 1)} style={[styles.secondary, { borderColor: theme.line }, (index === 0 || finish.isPending) && styles.disabled]}><Text style={[styles.secondaryText, { color: theme.fg }]}>Previous</Text></Pressable>{feedback ? index < items.length - 1 ? <Pressable disabled={finish.isPending} onPress={() => goToQuestion(index + 1)} style={[styles.primary, { backgroundColor: theme.primary }]}><Text style={[styles.primaryText, { color: theme.primaryFg }]}>Next</Text></Pressable> : <Pressable disabled={finish.isPending} onPress={finishSession} style={[styles.primary, { backgroundColor: theme.primary }]}>{finish.isPending ? <View style={styles.pendingAction}><ActivityIndicator size="small" color={theme.primaryFg} /><Text style={[styles.primaryText, { color: theme.primaryFg }]}>Finishing…</Text></View> : <Text style={[styles.primaryText, { color: theme.primaryFg }]}>Finish session</Text>}</Pressable> : <Pressable disabled={!selected || submit.isPending || expired} onPress={() => submit.mutate()} style={[styles.primary, { backgroundColor: theme.primary }, (!selected || expired) && styles.disabled]}>{submit.isPending ? <ActivityIndicator color={theme.primaryFg} /> : <Text style={[styles.primaryText, { color: theme.primaryFg }]}>Submit answer</Text>}</Pressable>}</View>
  </ScrollView>;
}

type QuestionTiming = { questionId: string; sequence: number; durationMs: number };
function ResultScreen({ result, questionTimings, onDone }: { result: Awaited<ReturnType<typeof getPracticeResult>>; questionTimings?: QuestionTiming[]; onDone: () => void }) {
  const { theme } = useAppTheme();
  const overallMs = questionTimings?.reduce((total, item) => total + item.durationMs, 0) ?? 0;
  return <ScrollView contentContainerStyle={styles.resultWrap} showsVerticalScrollIndicator={false}>
    <View style={[styles.resultHalo, { backgroundColor: theme.primarySoft }]}><Text style={[styles.resultScore, { color: theme.primaryStrong }]}>{result.score.percent}%</Text></View>
    <Text style={[styles.resultTitle, { color: theme.fg }]}>Session complete.</Text>
    <Text style={[styles.resultText, { color: theme.muted }]}>Your answers and wrong-answer history are safely stored.</Text>
    <View style={styles.resultGrid}><Metric label="Correct" value={result.score.correct} tone={theme.success} /><Metric label="Wrong" value={result.score.wrong} tone={theme.danger} /><Metric label="Answered" value={`${result.score.answered}/${result.score.total}`} tone={theme.goldStrong} /></View>
    {questionTimings ? <View style={styles.timingReport}>
      <View style={[styles.overallTime, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}><Text style={[styles.timingLabel, { color: theme.goldStrong }]}>OVERALL TIME</Text><Text style={[styles.overallTimeValue, { color: theme.fg }]}>{formatDurationWords(overallMs)}</Text></View>
      <Text style={[styles.timingHeading, { color: theme.fg }]}>Question timing</Text>
      {questionTimings.length ? <View style={[styles.timingList, { backgroundColor: theme.surface, borderColor: theme.line }]}>{questionTimings.map((item, itemIndex) => <View key={item.questionId} style={[styles.timingRow, itemIndex < questionTimings.length - 1 && { borderBottomColor: theme.line, borderBottomWidth: 1 }]}><Text style={[styles.timingQuestion, { color: theme.fg }]}>Question {item.sequence}</Text><Text style={[styles.timingValue, { color: theme.primaryStrong }]}>{formatTime(Math.floor(item.durationMs / 1000))}</Text></View>)}</View> : <View style={[styles.timingList, { backgroundColor: theme.surface, borderColor: theme.line }]}><Text style={[styles.emptyTiming, { color: theme.muted }]}>No questions were submitted before this session ended.</Text></View>}
      <Text style={[styles.temporaryNote, { color: theme.faint }]}>This detailed timing list is temporary and closes with this report.</Text>
    </View> : null}
    <Pressable onPress={onDone} style={[styles.start, styles.resultAction, { backgroundColor: theme.primary }]}><Text style={[styles.startText, { color: theme.primaryFg }]}>Back to Practice Studio</Text><ArrowRight size={20} color={theme.primaryFg} /></Pressable>
  </ScrollView>;
}
function Metric({ label, value, tone }: { label: string; value: string | number; tone: string }) { const { theme } = useAppTheme(); return <View style={[styles.metric, { backgroundColor: theme.surface, borderColor: theme.line }]}><Text style={[styles.metricValue, { color: tone }]}>{value}</Text><Text style={[styles.metricLabel, { color: theme.muted }]}>{label}</Text></View>; }
function SectionLabel({ number, title }: { number: string; title: string }) { const { theme } = useAppTheme(); return <View style={styles.sectionLabel}><Text style={[styles.sectionNumber, { color: theme.goldStrong }]}>{number}</Text><Text style={[styles.sectionTitle, { color: theme.fg }]}>{title}</Text></View>; }
function InlineError({ text }: { text: string }) { const { theme } = useAppTheme(); return <View style={[styles.inlineError, { backgroundColor: theme.dangerSoft, borderColor: theme.danger }]}><AlertCircle size={16} color={theme.danger} /><Text style={[styles.inlineErrorText, { color: theme.danger }]}>{text}</Text></View>; }
function State({ loading, title, text, action, onPress, compact }: { loading?: boolean; title: string; text: string; action?: string; onPress?: () => void; compact?: boolean }) { const { theme } = useAppTheme(); return <View style={[styles.state, compact && styles.stateCompact]}>{loading ? <ActivityIndicator color={theme.primary} /> : <AlertCircle size={24} color={theme.muted} />}<Text style={[styles.stateTitle, { color: theme.fg }]}>{title}</Text><Text style={[styles.stateText, { color: theme.muted }]}>{text}</Text>{action ? <Pressable onPress={onPress}><Text style={[styles.stateAction, { color: theme.primaryStrong }]}>{action}</Text></Pressable> : null}</View>; }
function useCountdown(expiresAt: string | null) { const [value, setValue] = useState(() => expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)) : 0); useEffect(() => { if (!expiresAt) return; const update = () => setValue(Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000))); update(); const id = setInterval(update, 1000); return () => clearInterval(id); }, [expiresAt]); return value; }
const labelMode = (mode: PracticeMode) => mode === 'CASE_STUDY' ? 'Case Study' : mode === 'QUESTION_BANK' ? 'Question Bank' : mode === 'WRONG_ANSWERS' ? 'Wrong Answers' : mode === 'REVISIT' ? 'Revisit' : 'MCQ';
const plain = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60).toString().padStart(2, '0');
  const remainder = (safe % 60).toString().padStart(2, '0');
  return hours ? `${hours.toString().padStart(2, '0')}:${minutes}:${remainder}` : `${minutes}:${remainder}`;
};
const formatDurationWords = (durationMs: number) => {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours ? `${hours} hr` : '', minutes ? `${minutes} min` : '', `${seconds} sec`].filter(Boolean).join(' ');
};
const errorMessage = (error: unknown) => error instanceof Error && error.message ? error.message : 'Something went wrong. Please try again.';
const navigatorColor = (state: string, theme: ReturnType<typeof useAppTheme>['theme']) => state === 'ANSWERED_CORRECT' ? theme.successSoft : ['ANSWERED_WRONG', 'LOCKED_WRONG'].includes(state) ? theme.dangerSoft : state === 'MARKED_REVIEW' ? theme.goldSoft : theme.surface;

const styles = StyleSheet.create({
  safe: { flex: 1, alignItems: 'center' }, frame: { flex: 1 }, content: { padding: spacing.lg, paddingBottom: 150, gap: 18 }, flex: { flex: 1 }, heroRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' }, eyebrow: { fontFamily: font.bold, fontSize: 9, letterSpacing: 1.5 }, title: { marginTop: 5, fontFamily: font.extraBold, fontSize: 30, letterSpacing: -.8 }, subtitle: { marginTop: 5, maxWidth: 560, fontFamily: font.regular, fontSize: 11, lineHeight: 17 }, tracker: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, resume: { borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 }, resumeIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, resumeTitle: { fontFamily: font.bold, fontSize: 12 }, resumeText: { marginTop: 3, fontFamily: font.regular, fontSize: 9 }, sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 2 }, sectionNumber: { width: 24, fontFamily: font.extraBold, fontSize: 9 }, sectionTitle: { fontFamily: font.bold, fontSize: 15 }, modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, modeCard: { width: '48%', flexGrow: 1, minHeight: 118, borderWidth: 1, borderRadius: 18, padding: 12, gap: 9 }, modeIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, modeTitle: { fontFamily: font.bold, fontSize: 13 }, modeText: { marginTop: 3, fontFamily: font.regular, fontSize: 9, lineHeight: 14 }, countBadge: { position: 'absolute', right: 10, top: 10, minWidth: 25, height: 25, borderRadius: 13, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }, countText: { fontFamily: font.bold, fontSize: 9 }, searchBox: { marginTop: 12, height: 52, borderWidth: 1, borderRadius: 17, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 }, searchInput: { flex: 1, height: '100%', fontFamily: font.medium, fontSize: 11 }, bankList: { marginTop: 10, gap: 8 }, bankCard: { borderWidth: 1, borderRadius: 16, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, bankIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, bankState: { fontFamily: font.extraBold, fontSize: 8, letterSpacing: 1 }, scopeBlock: { marginTop: 14, gap: 8 }, scopeHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, scopeTitle: { fontFamily: font.bold, fontSize: 12 }, scopeHint: { fontFamily: font.medium, fontSize: 8 }, scopeRail: { gap: 9, paddingRight: 18 }, materialGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, materialGridCard: { minHeight: 84, borderWidth: 1, borderRadius: 15, padding: 10 }, materialGridTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }, materialCard: { width: 172, minHeight: 112, borderWidth: 1, borderRadius: 17, padding: 12 }, materialTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }, materialMark: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, materialCount: { fontFamily: font.bold, fontSize: 8 }, materialTitle: { fontFamily: font.bold, fontSize: 11, lineHeight: 16 }, materialMeta: { marginTop: 5, fontFamily: font.regular, fontSize: 8 }, selectedRow: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, selectedChip: { maxWidth: '100%', borderWidth: 1, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }, selectedText: { maxWidth: 220, fontFamily: font.semibold, fontSize: 9 }, emptyScope: { marginTop: 12, minHeight: 132, borderWidth: 1, borderRadius: 18, padding: 18, alignItems: 'center', justifyContent: 'center' }, emptyTitle: { marginTop: 9, fontFamily: font.bold, fontSize: 12 }, emptyText: { marginTop: 4, maxWidth: 320, textAlign: 'center', fontFamily: font.regular, fontSize: 9, lineHeight: 14 }, setupCard: { borderWidth: 1, borderRadius: 20, padding: 14, gap: 11 }, setupLabel: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, segmentRow: { flexDirection: 'row', gap: 7 }, segment: { flex: 1, height: 42, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, segmentText: { fontFamily: font.bold, fontSize: 10 }, disabled: { opacity: .35 }, availableHint: { fontFamily: font.medium, fontSize: 8 }, divider: { height: 1, marginVertical: 3 }, timerHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, timerHint: { marginTop: 3, fontFamily: font.regular, fontSize: 8 }, timerOrb: { minWidth: 80, height: 36, borderRadius: 18, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }, timerOrbText: { fontFamily: font.extraBold, fontSize: 10 }, customBlock: { gap: 6 }, customLabel: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1 }, customRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, customInput: { flex: 1, minWidth: 0, height: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, fontFamily: font.medium, fontSize: 10 }, apply: { height: 42, borderRadius: 13, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }, applyText: { fontFamily: font.bold, fontSize: 10 }, start: { minHeight: 62, borderRadius: 19, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, startEyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1.2, opacity: .7 }, startText: { marginTop: 2, fontFamily: font.extraBold, fontSize: 13 }, inlineError: { borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8 }, inlineErrorText: { flex: 1, fontFamily: font.medium, fontSize: 9, lineHeight: 14 }, state: { flex: 1, minHeight: 300, padding: 24, alignItems: 'center', justifyContent: 'center' }, stateCompact: { minHeight: 130 }, stateTitle: { marginTop: 10, fontFamily: font.bold, fontSize: 14 }, stateText: { marginTop: 5, maxWidth: 320, textAlign: 'center', fontFamily: font.regular, fontSize: 10, lineHeight: 16 }, stateAction: { marginTop: 9, fontFamily: font.bold, fontSize: 10 }, runnerHead: { flexDirection: 'row', alignItems: 'center', gap: 8 }, untimedControls: { alignItems: 'flex-end', gap: 5 }, endSession: { minHeight: 26, borderWidth: 1, borderRadius: 10, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' }, endSessionText: { fontFamily: font.bold, fontSize: 8 }, back: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, runnerTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 21 }, liveClock: { height: 38, borderRadius: 19, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 6 }, liveClockText: { fontFamily: font.extraBold, fontSize: 10 }, progress: { height: 6, borderRadius: 3, overflow: 'hidden' }, progressFill: { height: '100%', borderRadius: 3 }, navigator: { gap: 7, paddingRight: 20 }, nav: { width: 38, height: 38, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, navText: { fontFamily: font.bold, fontSize: 10 }, questionCard: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 13 }, questionMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, difficulty: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, review: { borderRadius: 12, paddingVertical: 7, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, reviewText: { fontFamily: font.semibold, fontSize: 8 }, casePanel: { borderWidth: 1, borderRadius: 16, padding: 13 }, caseLabel: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, caseText: { marginTop: 6, fontFamily: font.regular, fontSize: 10, lineHeight: 17 }, prompt: { fontFamily: font.bold, fontSize: 16, lineHeight: 24 }, options: { gap: 9 }, option: { minHeight: 56, borderWidth: 1, borderRadius: 16, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, optionLetter: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, optionLetterText: { fontFamily: font.bold, fontSize: 11 }, optionCopy: { flex: 1, fontFamily: font.medium, fontSize: 11, lineHeight: 17 }, feedback: { borderWidth: 1, borderRadius: 17, padding: 13, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, feedbackTitle: { fontFamily: font.bold, fontSize: 12 }, feedbackText: { marginTop: 4, fontFamily: font.regular, fontSize: 9, lineHeight: 15 }, explanationStack: { gap: 10 }, explanationCard: { borderWidth: 1, borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, explanationTitle: { fontFamily: font.bold, fontSize: 12 }, explanationText: { marginTop: 6, fontFamily: font.regular, fontSize: 12, lineHeight: 19 }, runnerActions: { flexDirection: 'row', gap: 9 }, secondary: { flex: 1, height: 52, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, primary: { flex: 1.5, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, secondaryText: { fontFamily: font.bold, fontSize: 11 }, primaryText: { fontFamily: font.bold, fontSize: 11 }, resultWrap: { flexGrow: 1, minHeight: 600, padding: 24, paddingBottom: 120, alignItems: 'center', justifyContent: 'center' }, resultHalo: { width: 132, height: 132, borderRadius: 66, alignItems: 'center', justifyContent: 'center' }, resultScore: { fontFamily: font.extraBold, fontSize: 38 }, resultTitle: { marginTop: 20, fontFamily: font.extraBold, fontSize: 27 }, resultText: { marginTop: 7, textAlign: 'center', fontFamily: font.regular, fontSize: 11 }, resultGrid: { width: '100%', flexDirection: 'row', gap: 8, marginVertical: 22 }, metric: { flex: 1, minHeight: 82, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, metricValue: { fontFamily: font.extraBold, fontSize: 20 }, metricLabel: { marginTop: 4, fontFamily: font.medium, fontSize: 8 }, timingReport: { width: '100%', gap: 10, marginBottom: 20 }, overallTime: { width: '100%', borderWidth: 1, borderRadius: 17, padding: 15 }, timingLabel: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.2 }, overallTimeValue: { marginTop: 5, fontFamily: font.extraBold, fontSize: 22 }, timingHeading: { marginTop: 4, fontFamily: font.bold, fontSize: 15 }, timingList: { width: '100%', borderWidth: 1, borderRadius: 17, overflow: 'hidden', paddingHorizontal: 14 }, timingRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, timingQuestion: { fontFamily: font.semibold, fontSize: 11 }, timingValue: { fontFamily: font.extraBold, fontSize: 12 }, emptyTiming: { paddingVertical: 18, textAlign: 'center', fontFamily: font.regular, fontSize: 10 }, temporaryNote: { textAlign: 'center', fontFamily: font.regular, fontSize: 8 }, resultAction: { width: '100%' },
  materialPages: { gap: 9, paddingRight: 18 },
  pendingAction: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  storeAction: { marginTop: 12, minHeight: 40, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7 },
  storeActionText: { fontFamily: font.bold, fontSize: 10 },
});
