import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, CheckCircle2, Clock3, ListTodo, MoreHorizontal, Play, Plus, RefreshCw, SkipForward, Sparkles, Trash2, X } from 'lucide-react-native';

import { Card } from '@/components/ui';
import { font, radius, spacing } from '@/constants/theme';
import { homeTodoDateKey, useHomeTodoStore } from '@/lib/home-todo-store';
import { isDemoSession } from '@/lib/student-session';
import { addStudyTask, clearCompletedStudyTasks, getTodayStudyPlan, hideStudyTask, regenerateStudyPlan, updateStudyTask, type StudyPlan, type StudyTask } from '@/lib/study-plan-api';
import { useAppTheme } from '@/providers/app-providers';

const nativeDriver = Platform.OS !== 'web';
const planKey = ['student', 'study-plan', 'today'] as const;
const addDays = (date: string, days: number) => { const value = new Date(`${date}T00:00:00.000Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); };

type VisibleTask = { id: string; title: string; completed: boolean; reason?: string; plannedMinutes?: number; source?: StudyTask['source']; remote?: StudyTask };
type PlanMutation = { execute: () => Promise<StudyPlan>; optimistic?: (plan: StudyPlan) => StudyPlan; afterSuccess?: () => void };

const withPlanTasks = (plan: StudyPlan, tasks: StudyTask[]): StudyPlan => {
  const completedTasks = tasks.filter((task) => task.status === 'COMPLETED');
  return {
    ...plan,
    tasks,
    summary: {
      ...plan.summary,
      completed: completedTasks.length,
      total: tasks.length,
      plannedMinutes: tasks.reduce((sum, task) => sum + task.plannedMinutes, 0),
      completedMinutes: completedTasks.reduce((sum, task) => sum + (task.actualMinutes ?? task.plannedMinutes), 0),
    },
  };
};

const withTaskAction = (plan: StudyPlan, id: string, action: 'start' | 'complete' | 'reopen' | 'skip' | 'reschedule' | 'hide'): StudyPlan => {
  if (['skip', 'reschedule', 'hide'].includes(action)) return withPlanTasks(plan, plan.tasks.filter((task) => task.id !== id));
  const status = action === 'complete' ? 'COMPLETED' : action === 'start' ? 'IN_PROGRESS' : 'PLANNED';
  return withPlanTasks(plan, plan.tasks.map((task) => task.id === id ? { ...task, status } : task));
};

export function StudyPlanCard() {
  const { theme } = useAppTheme();
  const demo = isDemoSession();
  const queryClient = useQueryClient();
  const demoTodos = useHomeTodoStore((state) => state.todos);
  const syncDemo = useHomeTodoStore((state) => state.syncToday);
  const addDemo = useHomeTodoStore((state) => state.addTodo);
  const toggleDemo = useHomeTodoStore((state) => state.toggleTodo);
  const removeDemo = useHomeTodoStore((state) => state.removeTodo);
  const clearDemo = useHomeTodoStore((state) => state.clearCompleted);
  const remote = useQuery({ queryKey: planKey, queryFn: getTodayStudyPlan, enabled: !demo });
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<StudyTask | null>(null);
  const [entrance] = useState(() => new Animated.Value(0));
  const mutationLock = useRef(false);

  useEffect(() => { if (demo) syncDemo(homeTodoDateKey()); }, [demo, syncDemo]);
  useEffect(() => { Animated.timing(entrance, { toValue: 1, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }).start(); }, [entrance]);
  const commit = (plan: StudyPlan) => queryClient.setQueryData(planKey, plan);
  const mutation = useMutation<StudyPlan, Error, PlanMutation, { previous?: StudyPlan }>({
    mutationFn: ({ execute }) => execute(),
    onMutate: async ({ optimistic }) => {
      await queryClient.cancelQueries({ queryKey: planKey });
      const previous = queryClient.getQueryData<StudyPlan>(planKey);
      if (previous && optimistic) commit(optimistic(previous));
      return { previous };
    },
    onSuccess: (plan, variables) => { commit(plan); variables.afterSuccess?.(); },
    onError: (_error, _variables, context) => { if (context?.previous) commit(context.previous); },
    onSettled: () => { mutationLock.current = false; },
  });
  const runMutation = (input: PlanMutation) => {
    if (mutationLock.current) return false;
    mutationLock.current = true;
    mutation.mutate(input);
    return true;
  };
  const tasks: VisibleTask[] = demo ? demoTodos.map((task) => ({ ...task })) : (remote.data?.tasks ?? []).filter((task) => !['SKIPPED', 'RESCHEDULED', 'REPLACED'].includes(task.status)).map((task) => ({ id: task.id, title: task.title, completed: task.status === 'COMPLETED', reason: task.reason, plannedMinutes: task.plannedMinutes, source: task.source, remote: task }));
  const completed = tasks.filter((task) => task.completed).length;
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  const translateY = entrance.interpolate({ inputRange: [0, 1], outputRange: [15, 0] });
  const sourceLabel = (source?: StudyTask['source']) => source === 'REVISION_DUE' ? 'REVISION DUE' : source === 'CONTINUE_RESOURCE' ? 'CONTINUE' : source === 'CARRY_OVER' ? 'CARRY-OVER' : source === 'MANUAL' ? 'YOUR TASK' : 'TODAY’S PLAN';

  const submit = () => {
    const title = text.trim();
    if (!title) return;
    if (demo) { addDemo(title); setText(''); return; }
    const started = runMutation({
      execute: () => addStudyTask(title),
      optimistic: (plan) => {

        const task: StudyTask = { id: `pending-${Date.now()}`, type: 'MANUAL', source: 'MANUAL', status: 'PLANNED', estimateSource: 'LEARNER', title, reason: 'Added by you.', plannedMinutes: 25, actualMinutes: null, priority: 0, sequence: plan.tasks.length + 1, contentItemId: null, startedAt: null, completedAt: null, skippedAt: null, rescheduledForDate: null };
        return withPlanTasks(plan, [...plan.tasks, task]);
      },
    });
    if (started) setText('');
  };
  const toggle = (task: VisibleTask) => {
    if (demo) toggleDemo(task.id);
    else {
      const action = task.completed ? 'reopen' : 'complete';
      runMutation({ execute: () => updateStudyTask(task.id, action), optimistic: (plan) => withTaskAction(plan, task.id, action) });
    }
  };

  if (!demo && remote.isError) return <Card style={styles.error}><ListTodo color={theme.danger} size={22} /><Text style={[styles.errorTitle, { color: theme.fg }]}>Your study plan is unavailable</Text><Text style={[styles.errorText, { color: theme.muted }]}>Nothing was replaced with demo data. Try loading the real plan again.</Text><Pressable onPress={() => remote.refetch()} style={[styles.retry, { backgroundColor: theme.primary }]}><Text style={[styles.retryText, { color: theme.primaryFg }]}>Try again</Text></Pressable></Card>;

  return <Animated.View style={{ opacity: entrance, transform: [{ translateY }] }}><Card style={styles.card}>
    <View pointerEvents="none" style={[styles.glow, { backgroundColor: theme.primarySoft }]} />
    <View style={styles.header}><View style={[styles.icon, { backgroundColor: theme.primarySoft }]}><ListTodo color={theme.primaryStrong} size={21} /></View><View style={styles.headingCopy}><Text style={[styles.eyebrow, { color: theme.primary }]}>TODAY’S ACTIONS</Text><Text style={[styles.title, { color: theme.fg }]}>Study to-do list</Text><Text style={[styles.intro, { color: theme.muted }]}>{completed === tasks.length && tasks.length ? 'Everything planned is complete.' : demo ? 'Keep today clear, small and achievable.' : `${remote.data?.summary.plannedMinutes ?? 0} focused minutes planned for today.`}</Text></View>{!demo ? <Pressable accessibilityLabel="Refresh remaining plan" disabled={mutation.isPending} onPress={() => runMutation({ execute: regenerateStudyPlan })} style={[styles.refresh, { backgroundColor: theme.sunken, borderColor: theme.line }]}><RefreshCw size={15} color={theme.muted} /></Pressable> : null}<View style={[styles.score, { backgroundColor: percent === 100 && tasks.length ? theme.successSoft : theme.sunken, borderColor: percent === 100 && tasks.length ? theme.success : theme.line }]}><Text style={[styles.scoreValue, { color: percent === 100 && tasks.length ? theme.success : theme.fg }]}>{completed}/{tasks.length}</Text><Text style={[styles.scoreLabel, { color: theme.muted }]}>DONE</Text></View></View>
    <View style={[styles.progressTrack, { backgroundColor: theme.sunken }]}><View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: percent === 100 && tasks.length ? theme.success : theme.primary }]} /></View>
    <View style={[styles.composer, { backgroundColor: theme.sunken, borderColor: theme.line }]}><TextInput value={text} onChangeText={setText} onSubmitEditing={submit} placeholder="Add a study task…" placeholderTextColor={theme.faint} returnKeyType="done" style={[styles.input, { color: theme.fg }]} /><Pressable disabled={!text.trim() || mutation.isPending} accessibilityRole="button" accessibilityLabel="Add study task" onPress={submit} style={[styles.add, { backgroundColor: text.trim() ? theme.primary : theme.line }]}><Plus color={text.trim() ? theme.primaryFg : theme.faint} size={18} strokeWidth={2.8} /></Pressable></View>
    {!demo && remote.isPending ? <View style={styles.loading}><Sparkles size={18} color={theme.primaryStrong} /><Text style={[styles.loadingText, { color: theme.muted }]}>Building a realistic plan for today…</Text></View> : <View style={styles.list}>{tasks.map((task) => <View key={task.id} style={[styles.row, { borderTopColor: theme.line }]}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: task.completed, disabled: mutation.isPending }} disabled={mutation.isPending} onPress={() => toggle(task)} style={[styles.check, { backgroundColor: task.completed ? theme.success : theme.sunken, borderColor: task.completed ? theme.success : theme.lineStrong }]}>{task.completed ? <CheckCircle2 color={theme.primaryFg} size={17} strokeWidth={2.8} /> : null}</Pressable><View style={styles.taskCopy}>{task.source ? <View style={styles.meta}><Text style={[styles.source, { color: task.source === 'REVISION_DUE' ? theme.goldStrong : theme.primaryStrong }]}>{sourceLabel(task.source)}</Text>{task.plannedMinutes ? <><View style={[styles.dot, { backgroundColor: theme.lineStrong }]} /><Clock3 size={10} color={theme.faint} /><Text style={[styles.minutes, { color: theme.faint }]}>{task.plannedMinutes}m</Text></> : null}</View> : null}<Text numberOfLines={2} style={[styles.taskTitle, { color: task.completed ? theme.faint : theme.fg }, task.completed && styles.done]}>{task.title}</Text>{task.reason && !task.completed ? <Text numberOfLines={1} style={[styles.reason, { color: theme.muted }]}>{task.reason}</Text> : null}</View>{demo ? <Pressable accessibilityLabel={`Delete ${task.title}`} onPress={() => removeDemo(task.id)} hitSlop={7} style={styles.more}><Trash2 color={theme.faint} size={16} /></Pressable> : <Pressable accessibilityLabel={`Manage ${task.title}`} onPress={() => setSelected(task.remote ?? null)} style={[styles.more, { backgroundColor: theme.sunken }]}><MoreHorizontal color={theme.muted} size={17} /></Pressable>}</View>)}</View>}
    {!tasks.length && !remote.isPending ? <View style={[styles.empty, { backgroundColor: theme.sunken }]}><Sparkles color={theme.primaryStrong} size={18} /><Text style={[styles.emptyText, { color: theme.muted }]}>Your active list is clear. Add one meaningful task for today.</Text></View> : completed > 0 ? <Pressable accessibilityRole="button" disabled={mutation.isPending} onPress={() => demo ? clearDemo() : runMutation({ execute: clearCompletedStudyTasks, optimistic: (plan) => withPlanTasks(plan, plan.tasks.filter((task) => task.status !== 'COMPLETED')) })} style={styles.clear}><Text style={[styles.clearText, { color: theme.muted }]}>Clear completed</Text></Pressable> : null}
    {!demo && remote.data ? <Text style={[styles.engineNote, { color: theme.faint }]}>Plan engine · {remote.data.algorithmVersion} · estimates update when academic workload metadata becomes available.</Text> : null}
  </Card><TaskActions task={selected} date={remote.data?.localDate} busy={mutation.isPending} onClose={() => setSelected(null)} onAction={(action, options) => { if (!selected) return; const taskId = selected.id; runMutation({ execute: () => action === 'hide' ? hideStudyTask(taskId) : updateStudyTask(taskId, action, options), optimistic: (plan) => withTaskAction(plan, taskId, action), afterSuccess: () => setSelected(null) }); }} /></Animated.View>;
}

function TaskActions({ task, date, busy, onClose, onAction }: { task: StudyTask | null; date?: string; busy: boolean; onClose: () => void; onAction: (action: 'start' | 'complete' | 'reopen' | 'skip' | 'reschedule' | 'hide', options?: { date?: string }) => void }) {
  const { theme } = useAppTheme();
  const actions = useMemo(() => task ? [
    task.status === 'COMPLETED' ? { label: 'Mark as planned', icon: RefreshCw, action: 'reopen' as const } : { label: 'Start this task', icon: Play, action: 'start' as const },
    ...(task.status === 'COMPLETED' ? [] : [{ label: 'Mark complete', icon: CheckCircle2, action: 'complete' as const }]),
    { label: 'Move to tomorrow', icon: CalendarPlus, action: 'reschedule' as const, date: date ? addDays(date, 1) : undefined },
    { label: 'Skip for today', icon: SkipForward, action: 'skip' as const },
    { label: 'Remove from card', icon: Trash2, action: 'hide' as const },
  ] : [], [date, task]);
  return <Modal visible={Boolean(task)} transparent animationType="fade" onRequestClose={onClose}><View style={styles.modalRoot}><Pressable style={styles.backdrop} onPress={onClose} /><View style={[styles.sheet, { backgroundColor: theme.surface, borderColor: theme.line }]}><View style={[styles.handle, { backgroundColor: theme.lineStrong }]} /><View style={styles.sheetHeader}><View style={styles.sheetCopy}><Text style={[styles.sheetEyebrow, { color: theme.primary }]}>STUDY TASK</Text><Text numberOfLines={2} style={[styles.sheetTitle, { color: theme.fg }]}>{task?.title}</Text></View><Pressable accessibilityLabel="Close task actions" onPress={onClose} style={[styles.close, { backgroundColor: theme.sunken }]}><X size={17} color={theme.muted} /></Pressable></View><View style={styles.actions}>{actions.map(({ label, icon: Icon, action, date: targetDate }) => <Pressable key={action} disabled={busy} onPress={() => onAction(action, targetDate ? { date: targetDate } : undefined)} style={[styles.action, { backgroundColor: theme.sunken, borderColor: theme.line }]}><Icon size={17} color={action === 'hide' ? theme.danger : theme.primaryStrong} /><Text style={[styles.actionText, { color: action === 'hide' ? theme.danger : theme.fg }]}>{label}</Text></Pressable>)}</View></View></View></Modal>;
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden' }, glow: { position: 'absolute', width: 170, height: 170, borderRadius: 85, right: -105, top: -112, opacity: .45 }, header: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 9 }, icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, headingCopy: { flex: 1, minWidth: 0 }, eyebrow: { fontFamily: font.bold, fontSize: 8, letterSpacing: 1.1 }, title: { marginTop: 2, fontFamily: font.extraBold, fontSize: 18, letterSpacing: -.35 }, intro: { marginTop: 3, fontFamily: font.regular, fontSize: 9, lineHeight: 13 }, refresh: { width: 34, height: 34, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, score: { minWidth: 49, height: 45, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, scoreValue: { fontFamily: font.extraBold, fontSize: 13, lineHeight: 16 }, scoreLabel: { fontFamily: font.bold, fontSize: 6, letterSpacing: .7 }, progressTrack: { height: 5, marginTop: 10, borderRadius: 3, overflow: 'hidden' }, progressFill: { height: '100%', borderRadius: 3 }, composer: { minHeight: 45, marginTop: 12, borderWidth: 1, borderRadius: 14, paddingLeft: 11, paddingRight: 5, flexDirection: 'row', alignItems: 'center' }, input: { flex: 1, minWidth: 0, paddingVertical: 0, fontFamily: font.medium, fontSize: 10 }, add: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, list: { marginTop: 7 }, row: { minHeight: 67, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 9 }, check: { width: 24, height: 24, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, taskCopy: { flex: 1, minWidth: 0, paddingVertical: 7 }, meta: { flexDirection: 'row', alignItems: 'center', gap: 4 }, source: { fontFamily: font.bold, fontSize: 6, letterSpacing: .7 }, dot: { width: 3, height: 3, borderRadius: 2 }, minutes: { fontFamily: font.bold, fontSize: 7 }, taskTitle: { marginTop: 3, fontFamily: font.bold, fontSize: 10, lineHeight: 14 }, reason: { marginTop: 2, fontFamily: font.regular, fontSize: 7.5 }, done: { textDecorationLine: 'line-through' }, more: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, clear: { alignSelf: 'flex-end', minHeight: 28, paddingHorizontal: 4, justifyContent: 'center' }, clearText: { fontFamily: font.medium, fontSize: 8 }, empty: { minHeight: 61, marginTop: 8, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }, emptyText: { flex: 1, fontFamily: font.medium, fontSize: 9, lineHeight: 13 }, loading: { minHeight: 82, alignItems: 'center', justifyContent: 'center', gap: 7 }, loadingText: { fontFamily: font.medium, fontSize: 9 }, engineNote: { marginTop: 2, fontFamily: font.regular, fontSize: 6.5, lineHeight: 10, textAlign: 'center' }, error: { alignItems: 'center', paddingVertical: spacing.xl }, errorTitle: { marginTop: 8, fontFamily: font.bold, fontSize: 14 }, errorText: { maxWidth: 300, marginTop: 4, fontFamily: font.regular, fontSize: 9, lineHeight: 14, textAlign: 'center' }, retry: { minHeight: 38, marginTop: 12, borderRadius: 12, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' }, retryText: { fontFamily: font.bold, fontSize: 10 }, modalRoot: { flex: 1, justifyContent: 'flex-end' }, backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,.7)' }, sheet: { width: '100%', maxWidth: 680, alignSelf: 'center', borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 28 }, handle: { width: 38, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 14 }, sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, sheetCopy: { flex: 1, minWidth: 0 }, sheetEyebrow: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1.05 }, sheetTitle: { marginTop: 4, fontFamily: font.extraBold, fontSize: 18, lineHeight: 23 }, close: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, actions: { marginTop: 13, gap: 7 }, action: { minHeight: 49, borderWidth: 1, borderRadius: radius.field, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 9 }, actionText: { fontFamily: font.bold, fontSize: 11 },
});
