import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Building2, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Clock3, GraduationCap } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { font, spacing } from '@/constants/theme';
import { useAdminCourseStore } from '@/lib/admin-course-store';
import { getAuthErrorMessage } from '@/lib/auth-session';
import { useAuthStore } from '@/lib/auth-store';
import { deviceTimezone, useLearnerProfileStore } from '@/lib/learner-profile-store';
import { loadPreferenceOptions, putLearnerPreferences } from '@/lib/learner-preferences-api';
import { learnerProfileFromPreference, type PreferenceCourse } from '@/lib/learner-preferences';

const months = [
  ['Jan', 'January'], ['Feb', 'February'], ['Mar', 'March'], ['Apr', 'April'],
  ['May', 'May'], ['Jun', 'June'], ['Jul', 'July'], ['Aug', 'August'],
  ['Sep', 'September'], ['Oct', 'October'], ['Nov', 'November'], ['Dec', 'December'],
] as const;
const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

function monthCells(year: number, monthIndex: number): (number | null)[] {
  const leading = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
  const days = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return [...Array.from({ length: leading }, () => null), ...Array.from({ length: days }, (_, index) => index + 1)];
}

const palette = {
  canvas: '#06070A',
  panel: '#0D0E12',
  panelRaised: '#111216',
  line: 'rgba(255,255,255,0.11)',
  lineStrong: 'rgba(255,255,255,0.18)',
  text: '#F8F8FA',
  muted: '#A9ADB6',
  faint: '#6F747E',
  gold: '#F4C55D',
  orange: '#FF783B',
  danger: '#FF7A80',
} as const;

type LearnerOnboardingModalProps = {
  visible: boolean;
  onComplete: () => void;
};

export function LearnerOnboardingModal({ visible, onComplete }: LearnerOnboardingModalProps) {
  const localCourses = useAdminCourseStore((state) => state.courses);
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const savedProfile = useLearnerProfileStore((state) => state.profile);
  const updateProfile = useLearnerProfileStore((state) => state.updateProfile);
  const today = useMemo(() => new Date(), []);
  const years = useMemo(() => Array.from({ length: 8 }, (_, index) => today.getFullYear() + index), [today]);
  const [courseId, setCourseId] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(1);
  const [exactDaySelected, setExactDaySelected] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [academyId, setAcademyId] = useState('');
  const [dailyTargetMinutes, setDailyTargetMinutes] = useState(120);
  const [serverCourses, setServerCourses] = useState<PreferenceCourse[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'academy' | null>(null);

  const hasServerSession = Boolean(accessToken && !accessToken.startsWith('ui-only-'));
  const loadingCourses = hasServerSession && serverCourses === null;
  const courses = hasServerSession ? (serverCourses ?? []) : localCourses.map((entry) => ({
    id: entry.id,
    code: entry.name.toUpperCase(),
    name: entry.name,
    slug: entry.id,
    description: entry.categories.slice(0, 2).map((category) => category.name).join(' · '),
    academy: null,
  }));
  const course = courses.find((entry) => entry.id === courseId);
  const calendarDays = useMemo(() => monthCells(calendarYear, calendarMonth), [calendarMonth, calendarYear]);
  const canMoveBack = calendarYear > today.getFullYear() || calendarMonth > today.getMonth();
  const canMoveForward = calendarYear < years[years.length - 1]! || calendarMonth < 11;
  const ready = Boolean(course);

  const moveMonth = (direction: -1 | 1) => {
    if ((direction === -1 && !canMoveBack) || (direction === 1 && !canMoveForward)) return;
    const next = new Date(Date.UTC(calendarYear, calendarMonth + direction, 1));
    setCalendarYear(next.getUTCFullYear());
    setCalendarMonth(next.getUTCMonth());
    setSelectedDay(1);
    setExactDaySelected(false);
    setRequestError('');
  };

  useEffect(() => {
    if (!visible || !hasServerSession) return;
    let active = true;
    void loadPreferenceOptions()
      .then((options) => { if (active) setServerCourses(options); })
      .catch((error: unknown) => { if (active) { setServerCourses([]); setRequestError(getAuthErrorMessage(error)); } })
    return () => { active = false; };
  }, [hasServerSession, visible]);

  const finish = async () => {
    setSubmitted(true);
    if (!ready || !course) return;
    const monthEntry = months[calendarMonth]!;
    const examDate = `${selectedDay} ${monthEntry[0]} ${calendarYear}`;
    setRequestError('');
    setSaving(true);
    try {
      if (hasServerSession) {
        const preference = await putLearnerPreferences({
          selectedCourseId: course.id,
          examMonth: calendarMonth + 1,
          examYear: calendarYear,
          ...(exactDaySelected ? { examDay: selectedDay } : {}),
          academyReference: academyId.trim() || undefined,
          dailyTargetMinutes,
          timezone: savedProfile.timezone.trim() || deviceTimezone(),
          language: savedProfile.language.trim() || 'English',
          reminderTime: '19:00',
        });
        updateProfile(learnerProfileFromPreference(preference, savedProfile));
        if (user) setUser({ ...user, activeStageId: preference.selectedCourseId });
      } else {
        updateProfile({
          ...savedProfile,
          examName: course.name,
          category: course.code,
          examDate,
          academyId: academyId.trim(),
          dailyTarget: dailyTargetMinutes % 60 === 0 ? `${dailyTargetMinutes / 60} ${dailyTargetMinutes === 60 ? 'hour' : 'hours'}` : `${Math.floor(dailyTargetMinutes / 60)}h ${dailyTargetMinutes % 60}m`,
        });
        if (user) setUser({ ...user, activeStageId: course.id });
      }
      onComplete();
    } catch (error: unknown) {
      setRequestError(getAuthErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => undefined}>
    <View style={styles.backdrop}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboard}>
          <View style={styles.sheet}>
            <LinearGradient pointerEvents="none" colors={['#22150E', '#111014', '#090A0D']} locations={[0, 0.22, 0.62]} style={StyleSheet.absoluteFill} />
            <View pointerEvents="none" style={styles.artwork}>
              <View style={styles.warmGlow} />
              <View style={styles.orbit} />
              <View style={styles.starOne} />
              <View style={styles.starTwo} />
            </View>
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerTop}>
                <Text style={styles.stepText}>PERSONALISE YOUR PLAN</Text>
                <Text style={styles.stepCount}>2 OF 2</Text>
              </View>
              <View style={styles.progressTrack}><LinearGradient colors={[palette.orange, palette.gold]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.progressFill} /></View>
              <Text style={styles.title}>What are you preparing for?</Text>
              <Text style={styles.description}>Choose your goal and exam date. We’ll organise your notes, countdown and practice around it.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                <View style={styles.sectionHeading}><Text style={styles.sectionNumber}>01</Text><View><Text style={styles.label}>Choose your course</Text><Text style={styles.labelHint}>Required</Text></View></View>
                {loadingCourses ? <View style={styles.loadingCourses}><ActivityIndicator color={palette.gold} /><Text style={styles.loadingText}>Loading your available courses…</Text></View> : <View style={styles.courseGrid}>{courses.map((entry) => {
                  const selected = courseId === entry.id;
                  return <Pressable key={entry.id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setCourseId(entry.id)} style={({ pressed }) => [styles.course, selected && styles.courseSelected, pressed && styles.pressed]}>
                    <View style={[styles.courseMark, selected && styles.courseMarkSelected]}>{selected ? <Check size={16} color="#17120B" strokeWidth={3} /> : <GraduationCap size={17} color={palette.muted} />}</View>
                    <Text numberOfLines={1} style={[styles.courseName, selected && styles.courseNameSelected]}>{entry.name}</Text>
                    <Text numberOfLines={2} style={styles.courseMeta}>{entry.academy?.name ?? entry.description ?? entry.code}</Text>
                  </Pressable>;
                })}</View>}
                {!loadingCourses && courses.length === 0 ? <Text style={styles.error}>No active course is available for this account yet.</Text> : null}
                {submitted && !course ? <Text style={styles.error}>Select the course you are preparing for.</Text> : null}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeading}><Text style={styles.sectionNumber}>02</Text><View><Text style={styles.label}>When is your exam?</Text><Text style={styles.labelHint}>Select from one calendar · the 1st is used by default</Text></View></View>

                <View style={styles.calendarCard}>
                  <View style={styles.calendarHeader}>
                    <Pressable accessibilityRole="button" accessibilityLabel="Previous month" disabled={!canMoveBack} onPress={() => moveMonth(-1)} style={[styles.calendarArrow, !canMoveBack && styles.calendarArrowDisabled]}>
                      <ChevronLeft size={18} color={canMoveBack ? palette.text : palette.faint} />
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel="Choose calendar year" onPress={() => setShowYearPicker((value) => !value)} style={styles.calendarTitleButton}>
                      <CalendarDays size={16} color={palette.gold} />
                      <View style={styles.calendarTitleCopy}>
                        <Text style={styles.calendarTitle}>{months[calendarMonth]![1]} {calendarYear}</Text>
                        <Text style={styles.calendarTitleHint}>{showYearPicker ? 'Select a year' : 'Tap to change year'}</Text>
                      </View>
                      <ChevronDown size={14} color={palette.faint} style={{ transform: [{ rotate: showYearPicker ? '180deg' : '0deg' }] }} />
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel="Next month" disabled={!canMoveForward} onPress={() => moveMonth(1)} style={[styles.calendarArrow, !canMoveForward && styles.calendarArrowDisabled]}>
                      <ChevronRight size={18} color={canMoveForward ? palette.text : palette.faint} />
                    </Pressable>
                  </View>

                  {showYearPicker ? <View style={styles.calendarYearGrid}>{years.map((entry) => {
                    const selected = calendarYear === entry;
                    return <Pressable key={entry} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => {
                      setCalendarYear(entry);
                      setSelectedDay(1);
                      setExactDaySelected(false);
                      setShowYearPicker(false);
                      setRequestError('');
                    }} style={[styles.calendarYearChoice, selected && styles.calendarYearSelected]}>
                      <Text style={[styles.calendarYearText, selected && styles.calendarYearTextSelected]}>{entry}</Text>
                    </Pressable>;
                  })}</View> : <>
                    <View style={styles.weekRow}>{weekDays.map((entry) => <Text key={entry} style={styles.weekDay}>{entry}</Text>)}</View>
                    <View style={styles.dayGrid}>{calendarDays.map((entry, index) => entry === null
                      ? <View key={`empty-${index}`} style={styles.dayCell} />
                      : <Pressable key={entry} accessibilityRole="radio" accessibilityState={{ selected: selectedDay === entry }} onPress={() => {
                        setSelectedDay(entry);
                        setExactDaySelected(true);
                        setRequestError('');
                      }} style={styles.dayCell}>
                        <View style={[styles.dayBubble, selectedDay === entry && styles.dayBubbleSelected]}>
                          <Text style={[styles.dayText, selectedDay === entry && styles.dayTextSelected]}>{entry}</Text>
                        </View>
                      </Pressable>)}</View>
                  </>}

                  <View style={styles.selectedDateRow}>
                    <View style={styles.selectedDateIcon}><Check size={14} color="#17120B" strokeWidth={3} /></View>
                    <View style={styles.selectedDateCopy}><Text style={styles.selectedDateLabel}>EXAM DATE</Text><Text style={styles.selectedDateValue}>{selectedDay} {months[calendarMonth]![1]} {calendarYear}</Text></View>
                    <Text style={styles.selectedDateMeta}>{exactDaySelected ? 'Exact date' : 'Month default'}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeading}><Text style={styles.sectionNumber}>03</Text><View><Text style={styles.label}>Daily study target</Text><Text style={styles.labelHint}>Choose a realistic focus target for your plan</Text></View></View>
                <View style={styles.targetRail}>{[60, 90, 120, 180].map((minutes) => {
                  const selected = dailyTargetMinutes === minutes;
                  const targetLabel = minutes % 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes / 60}h`;
                  return <Pressable key={minutes} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setDailyTargetMinutes(minutes)} style={[styles.targetChoice, selected && styles.choiceSelected]}><Clock3 size={14} color={selected ? palette.gold : palette.faint} /><Text style={[styles.yearText, selected && styles.choiceTextSelected]}>{targetLabel}</Text></Pressable>;
                })}</View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeading}><Text style={styles.sectionNumber}>04</Text><View><Text style={styles.label}>Academy ID</Text><Text style={styles.labelHint}>Optional · only if your institute provided one</Text></View></View>
                <View style={[styles.inputShell, focusedInput === 'academy' && styles.inputFocused]}>
                  <Building2 size={17} color={focusedInput === 'academy' ? palette.gold : palette.faint} />
                  <View style={styles.inputCopy}><Text style={styles.inputLabel}>ACADEMY OR INSTITUTE CODE</Text><TextInput value={academyId} onChangeText={setAcademyId} onFocus={() => setFocusedInput('academy')} onBlur={() => setFocusedInput(null)} placeholder="Enter your academy ID" placeholderTextColor={palette.faint} autoCapitalize="characters" returnKeyType="done" style={styles.input} /></View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.actions}>
              {requestError ? <Text style={styles.requestError}>{requestError}</Text> : null}
              <Pressable accessibilityRole="button" disabled={saving || loadingCourses} onPress={() => void finish()} style={({ pressed }) => [styles.finishShell, (saving || loadingCourses) && styles.disabled, pressed && styles.pressed]}>
                <LinearGradient colors={['#FF763B', '#FFAE48', '#F7DF59']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.finish}>
                  <Text style={styles.finishText}>{saving ? 'Saving your plan…' : 'Finish setup'}</Text><View style={styles.arrowWell}>{saving ? <ActivityIndicator color="#17120B" size="small" /> : <ArrowRight size={18} color="#17120B" />}</View>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', justifyContent: 'flex-end' },
  safe: { flex: 1, justifyContent: 'flex-end' }, keyboard: { maxHeight: '96%', width: '100%', maxWidth: 520, alignSelf: 'center' },
  sheet: { maxHeight: '100%', borderTopLeftRadius: 27, borderTopRightRadius: 27, borderWidth: 1, borderBottomWidth: 0, borderColor: palette.lineStrong, backgroundColor: palette.canvas, overflow: 'hidden' },
  artwork: { position: 'absolute', top: 0, right: 0, left: 0, height: 220, overflow: 'hidden' }, warmGlow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, top: -145, right: -40, backgroundColor: 'rgba(244,197,93,0.10)' }, orbit: { position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: 'rgba(244,197,93,0.09)', top: -100, right: -62 }, starOne: { position: 'absolute', width: 3, height: 3, borderRadius: 2, top: 61, right: 58, backgroundColor: palette.gold }, starTwo: { position: 'absolute', width: 2, height: 2, borderRadius: 1, top: 112, right: 112, backgroundColor: 'rgba(244,197,93,0.45)' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 9, backgroundColor: 'rgba(255,255,255,0.20)' },
  header: { paddingHorizontal: spacing.lg, paddingTop: 14, paddingBottom: 16 }, headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, stepText: { color: palette.gold, fontFamily: font.bold, fontSize: 8, letterSpacing: 1.35 }, stepCount: { color: palette.muted, fontFamily: font.bold, fontSize: 8, letterSpacing: 0.7 }, progressTrack: { height: 3, marginTop: 9, borderRadius: 2, backgroundColor: palette.line, overflow: 'hidden' }, progressFill: { width: '100%', height: '100%' },
  title: { marginTop: 18, color: palette.text, fontFamily: font.extraBold, fontSize: 24, lineHeight: 30, letterSpacing: -0.65 }, description: { maxWidth: 430, marginTop: 5, color: palette.muted, fontFamily: font.regular, fontSize: 11, lineHeight: 17 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }, section: { marginTop: 18 }, sectionHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 }, sectionNumber: { width: 25, paddingTop: 1, color: palette.gold, fontFamily: font.extraBold, fontSize: 10 }, label: { color: palette.text, fontFamily: font.bold, fontSize: 12 }, labelHint: { marginTop: 2, color: palette.faint, fontFamily: font.medium, fontSize: 8, lineHeight: 12 },
  courseGrid: { marginTop: 11, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, course: { flexGrow: 1, flexBasis: '29%', maxWidth: '32%', minHeight: 91, borderWidth: 1, borderColor: palette.line, borderRadius: 15, padding: 10, backgroundColor: palette.panel }, courseSelected: { borderColor: palette.gold, backgroundColor: '#1A160E' }, courseMark: { width: 31, height: 31, borderRadius: 10, backgroundColor: '#15171C', alignItems: 'center', justifyContent: 'center' }, courseMarkSelected: { backgroundColor: palette.gold }, courseName: { marginTop: 8, color: palette.text, fontFamily: font.extraBold, fontSize: 12 }, courseNameSelected: { color: palette.gold }, courseMeta: { marginTop: 2, color: palette.muted, fontFamily: font.regular, fontSize: 7, lineHeight: 10 },
  loadingCourses: { minHeight: 91, marginTop: 11, borderWidth: 1, borderColor: palette.line, borderRadius: 15, backgroundColor: palette.panel, alignItems: 'center', justifyContent: 'center', gap: 8 }, loadingText: { color: palette.muted, fontFamily: font.medium, fontSize: 9 },
  calendarCard: { marginTop: 12, borderWidth: 1, borderColor: palette.lineStrong, borderRadius: 20, padding: 12, backgroundColor: 'rgba(13,14,18,0.94)', overflow: 'hidden' },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calendarArrow: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: '#111319', alignItems: 'center', justifyContent: 'center' }, calendarArrowDisabled: { opacity: 0.3 },
  calendarTitleButton: { flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 }, calendarTitleCopy: { minWidth: 100 }, calendarTitle: { color: palette.text, fontFamily: font.extraBold, fontSize: 14, textAlign: 'center' }, calendarTitleHint: { marginTop: 2, color: palette.faint, fontFamily: font.medium, fontSize: 7, textAlign: 'center' },
  weekRow: { marginTop: 14, flexDirection: 'row' }, weekDay: { width: '14.2857%', color: palette.faint, fontFamily: font.bold, fontSize: 7, letterSpacing: 0.35, textAlign: 'center' },
  dayGrid: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap' }, dayCell: { width: '14.2857%', height: 38, alignItems: 'center', justifyContent: 'center' }, dayBubble: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }, dayBubbleSelected: { backgroundColor: palette.gold, shadowColor: palette.gold, shadowOpacity: 0.28, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 3 }, dayText: { color: palette.muted, fontFamily: font.semibold, fontSize: 10 }, dayTextSelected: { color: '#17120B', fontFamily: font.extraBold },
  calendarYearGrid: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, calendarYearChoice: { flexGrow: 1, flexBasis: '46%', minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: palette.line, backgroundColor: '#101217', alignItems: 'center', justifyContent: 'center' }, calendarYearSelected: { borderColor: palette.gold, backgroundColor: '#231A0D' }, calendarYearText: { color: palette.muted, fontFamily: font.bold, fontSize: 11 }, calendarYearTextSelected: { color: palette.gold },
  selectedDateRow: { minHeight: 56, marginTop: 12, borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }, selectedDateIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: palette.gold, alignItems: 'center', justifyContent: 'center' }, selectedDateCopy: { flex: 1 }, selectedDateLabel: { color: palette.faint, fontFamily: font.bold, fontSize: 7, letterSpacing: 0.9 }, selectedDateValue: { marginTop: 2, color: palette.text, fontFamily: font.extraBold, fontSize: 12 }, selectedDateMeta: { color: palette.gold, fontFamily: font.bold, fontSize: 8 },
  yearText: { color: palette.muted, fontFamily: font.bold, fontSize: 9 }, choiceSelected: { borderColor: palette.gold, backgroundColor: '#231A0D' }, choiceTextSelected: { color: palette.gold },
  targetRail: { marginTop: 11, flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, targetChoice: { flexGrow: 1, minWidth: 74, minHeight: 40, paddingHorizontal: 11, borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.panel, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  inputShell: { minHeight: 53, marginTop: 11, paddingHorizontal: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: palette.panel, flexDirection: 'row', alignItems: 'center', gap: 10 }, inputFocused: { borderColor: palette.gold, backgroundColor: palette.panelRaised }, inputError: { borderColor: palette.danger }, inputCopy: { flex: 1, minWidth: 0, paddingVertical: 7 }, inputLabel: { color: palette.faint, fontFamily: font.bold, fontSize: 7, letterSpacing: 0.75 }, input: { minHeight: 29, paddingVertical: 0, color: palette.text, fontFamily: font.semibold, fontSize: 11 }, error: { marginTop: 6, color: palette.danger, fontFamily: font.semibold, fontSize: 9 },
  actions: { paddingHorizontal: spacing.lg, paddingTop: 10, paddingBottom: 14, borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: 'rgba(6,7,10,0.96)' }, requestError: { marginBottom: 8, color: palette.danger, fontFamily: font.semibold, fontSize: 9, lineHeight: 13, textAlign: 'center' }, finishShell: { borderRadius: 15, shadowColor: '#FF9A3D', shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 }, finish: { minHeight: 52, borderRadius: 15, paddingLeft: 17, paddingRight: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, finishText: { color: '#17120B', fontFamily: font.extraBold, fontSize: 13 }, arrowWell: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.55 }, pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
