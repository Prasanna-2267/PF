import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BookOpenCheck, Building2, CalendarDays, Check, GraduationCap, Sparkles } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { font, radius, spacing } from '@/constants/theme';
import { useAdminCourseStore } from '@/lib/admin-course-store';
import { useLearnerProfileStore } from '@/lib/learner-profile-store';
import { useAppTheme } from '@/providers/app-providers';

const months = [
  ['Jan', 'January'], ['Feb', 'February'], ['Mar', 'March'], ['Apr', 'April'],
  ['May', 'May'], ['Jun', 'June'], ['Jul', 'July'], ['Aug', 'August'],
  ['Sep', 'September'], ['Oct', 'October'], ['Nov', 'November'], ['Dec', 'December'],
] as const;

type LearnerOnboardingModalProps = {
  visible: boolean;
  onComplete: () => void;
  onSkip: () => void;
};

export function LearnerOnboardingModal({ visible, onComplete, onSkip }: LearnerOnboardingModalProps) {
  const { theme } = useAppTheme();
  const courses = useAdminCourseStore((state) => state.courses);
  const savedProfile = useLearnerProfileStore((state) => state.profile);
  const updateProfile = useLearnerProfileStore((state) => state.updateProfile);
  const years = useMemo(() => Array.from({ length: 8 }, (_, index) => new Date().getFullYear() + index), []);
  const [courseId, setCourseId] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [day, setDay] = useState('');
  const [academyId, setAcademyId] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const course = courses.find((entry) => entry.id === courseId);
  const monthEntry = months.find(([short]) => short === month);
  const invalidDay = day.length > 0 && (Number(day) < 1 || Number(day) > 31);
  const ready = Boolean(course && month && year && !invalidDay);

  const finish = () => {
    setSubmitted(true);
    if (!ready || !course || !monthEntry) return;
    const examDate = `${day ? `${Number(day)} ` : ''}${monthEntry[0]} ${year}`;
    updateProfile({
      ...savedProfile,
      examName: course.name,
      category: course.categories[0]?.name ?? 'General',
      examDate,
      academyId: academyId.trim(),
    });
    onComplete();
  };

  return <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onSkip}>
    <View style={styles.backdrop}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
          <View style={[styles.sheet, { backgroundColor: theme.elevated, borderColor: theme.lineStrong }]}>
            <View style={[styles.handle, { backgroundColor: theme.lineStrong }]} />
            <View style={styles.topline}>
              <View style={[styles.stepBadge, { backgroundColor: theme.primarySoft }]}><Sparkles size={14} color={theme.primaryStrong} /><Text style={[styles.stepText, { color: theme.primaryStrong }]}>STEP 2 OF 2</Text></View>
              <Text style={[styles.optional, { color: theme.muted }]}>About 30 seconds</Text>
            </View>
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={[styles.heroIcon, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}><GraduationCap size={29} color={theme.goldStrong} strokeWidth={2.1} /></View>
              <Text style={[styles.title, { color: theme.fg }]}>Shape your study space.</Text>
              <Text style={[styles.description, { color: theme.muted }]}>Tell us what you are preparing for. We’ll personalise your notes, countdown and practice experience.</Text>

              <View style={styles.section}>
                <View style={styles.labelRow}><BookOpenCheck size={16} color={theme.primary} /><Text style={[styles.label, { color: theme.fg }]}>Choose your course</Text><Text style={[styles.required, { color: theme.danger }]}>REQUIRED</Text></View>
                <View style={styles.courseList}>{courses.map((entry) => {
                  const selected = courseId === entry.id;
                  const categoryNames = entry.categories.slice(0, 2).map((item) => item.name).join(' · ');
                  return <Pressable key={entry.id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setCourseId(entry.id)} style={({ pressed }) => [styles.course, { backgroundColor: selected ? theme.primarySoft : theme.surface, borderColor: selected ? theme.primary : theme.line }, pressed && styles.pressed]}>
                    <View style={[styles.courseMark, { backgroundColor: selected ? theme.primary : theme.sunken }]}>{selected ? <Check size={17} color={theme.primaryFg} strokeWidth={3} /> : <GraduationCap size={17} color={theme.muted} />}</View>
                    <View style={styles.courseCopy}><Text numberOfLines={1} style={[styles.courseName, { color: theme.fg }]}>{entry.name}</Text><Text numberOfLines={1} style={[styles.courseMeta, { color: theme.muted }]}>{categoryNames || 'Course structure will be added soon'}</Text></View>
                  </Pressable>;
                })}</View>
                {submitted && !course ? <Text style={[styles.error, { color: theme.danger }]}>Select the course you are preparing for.</Text> : null}
              </View>

              <View style={styles.section}>
                <View style={styles.labelRow}><CalendarDays size={16} color={theme.goldStrong} /><Text style={[styles.label, { color: theme.fg }]}>When is your exam?</Text><Text style={[styles.required, { color: theme.danger }]}>MONTH + YEAR</Text></View>
                <Text style={[styles.hint, { color: theme.muted }]}>The exact date is optional. Month and year power your countdown.</Text>
                <View style={styles.monthGrid}>{months.map(([short]) => {
                  const selected = month === short;
                  return <Pressable key={short} onPress={() => setMonth(short)} style={[styles.month, { backgroundColor: selected ? theme.goldSoft : theme.surface, borderColor: selected ? theme.gold : theme.line }]}><Text style={[styles.monthText, { color: selected ? theme.goldStrong : theme.muted }]}>{short}</Text></Pressable>;
                })}</View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearList}>{years.map((entry) => {
                  const selected = year === String(entry);
                  return <Pressable key={entry} onPress={() => setYear(String(entry))} style={[styles.year, { backgroundColor: selected ? theme.primarySoft : theme.surface, borderColor: selected ? theme.primary : theme.line }]}><Text style={[styles.yearText, { color: selected ? theme.primaryStrong : theme.muted }]}>{entry}</Text></Pressable>;
                })}</ScrollView>
                <View style={[styles.inputShell, { backgroundColor: theme.surface, borderColor: invalidDay ? theme.danger : theme.line }]}><Text style={[styles.inputLabel, { color: theme.faint }]}>DAY · OPTIONAL</Text><TextInput value={day} onChangeText={(value) => setDay(value.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="For example, 14" placeholderTextColor={theme.faint} keyboardType="number-pad" style={[styles.input, { color: theme.fg }]} /></View>
                {invalidDay ? <Text style={[styles.error, { color: theme.danger }]}>Enter a day between 1 and 31.</Text> : submitted && (!month || !year) ? <Text style={[styles.error, { color: theme.danger }]}>Select both an exam month and year.</Text> : null}
              </View>

              <View style={styles.section}>
                <View style={styles.labelRow}><Building2 size={16} color={theme.success} /><Text style={[styles.label, { color: theme.fg }]}>Academy ID</Text><Text style={[styles.optionalTag, { color: theme.muted, borderColor: theme.line }]}>OPTIONAL</Text></View>
                <View style={[styles.inputShell, { backgroundColor: theme.surface, borderColor: theme.line }]}><Text style={[styles.inputLabel, { color: theme.faint }]}>ACADEMY OR INSTITUTE CODE</Text><TextInput value={academyId} onChangeText={setAcademyId} placeholder="Enter ID if your academy provided one" placeholderTextColor={theme.faint} autoCapitalize="characters" style={[styles.input, { color: theme.fg }]} /></View>
              </View>
            </ScrollView>

            <View style={[styles.actions, { borderTopColor: theme.line }]}>
              <Pressable accessibilityRole="button" onPress={finish} style={({ pressed }) => [styles.finish, { backgroundColor: theme.primary }, pressed && styles.pressed]}><Text style={[styles.finishText, { color: theme.primaryFg }]}>Finish setup</Text><Check size={18} color={theme.primaryFg} strokeWidth={2.8} /></Pressable>
              <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}><Text style={[styles.skipText, { color: theme.muted }]}>Skip for now</Text></Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4,10,20,.72)', justifyContent: 'flex-end' },
  safe: { flex: 1, justifyContent: 'flex-end' }, keyboard: { maxHeight: '94%' },
  sheet: { maxHeight: '100%', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, overflow: 'hidden' },
  handle: { width: 42, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 9, opacity: .75 },
  topline: { minHeight: 44, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBadge: { minHeight: 25, borderRadius: radius.pill, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', gap: 5 }, stepText: { fontFamily: font.bold, fontSize: 8, letterSpacing: .8 }, optional: { fontFamily: font.medium, fontSize: 9 },
  content: { paddingHorizontal: spacing.lg, paddingTop: 4, paddingBottom: spacing.xl },
  heroIcon: { width: 52, height: 52, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 12, fontFamily: font.extraBold, fontSize: 25, letterSpacing: -.65 }, description: { marginTop: 5, maxWidth: 430, fontFamily: font.regular, fontSize: 12, lineHeight: 18 },
  section: { marginTop: 22 }, labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, label: { flexShrink: 1, fontFamily: font.bold, fontSize: 13 }, required: { marginLeft: 'auto', fontFamily: font.bold, fontSize: 7, letterSpacing: .75 }, optionalTag: { marginLeft: 'auto', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3, fontFamily: font.bold, fontSize: 7, letterSpacing: .7 }, hint: { marginTop: 4, fontFamily: font.regular, fontSize: 9, lineHeight: 14 },
  courseList: { marginTop: 10, gap: 7 }, course: { minHeight: 58, borderWidth: 1, borderRadius: 15, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 10 }, courseMark: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, courseCopy: { flex: 1, minWidth: 0 }, courseName: { fontFamily: font.bold, fontSize: 13 }, courseMeta: { marginTop: 2, fontFamily: font.regular, fontSize: 9 },
  monthGrid: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }, month: { width: '23%', minHeight: 35, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, monthText: { fontFamily: font.bold, fontSize: 10 },
  yearList: { paddingTop: 8, paddingBottom: 2, gap: 6 }, year: { minWidth: 65, minHeight: 35, paddingHorizontal: 11, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, yearText: { fontFamily: font.bold, fontSize: 10 },
  inputShell: { minHeight: 54, marginTop: 8, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingTop: 7, paddingBottom: 4 }, inputLabel: { fontFamily: font.bold, fontSize: 7, letterSpacing: .8 }, input: { flex: 1, minHeight: 29, paddingVertical: 0, fontFamily: font.semibold, fontSize: 12 },
  error: { marginTop: 6, fontFamily: font.semibold, fontSize: 9 },
  actions: { paddingHorizontal: spacing.lg, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1 }, finish: { minHeight: 49, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, finishText: { fontFamily: font.extraBold, fontSize: 13 }, skip: { minHeight: 38, alignItems: 'center', justifyContent: 'center' }, skipText: { fontFamily: font.bold, fontSize: 11 }, pressed: { opacity: .78, transform: [{ scale: .99 }] },
});
