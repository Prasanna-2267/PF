import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Building2, CalendarDays, Check, GraduationCap } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { font, spacing } from '@/constants/theme';
import { useAdminCourseStore } from '@/lib/admin-course-store';
import { useLearnerProfileStore } from '@/lib/learner-profile-store';

const months = [
  ['Jan', 'January'], ['Feb', 'February'], ['Mar', 'March'], ['Apr', 'April'],
  ['May', 'May'], ['Jun', 'June'], ['Jul', 'July'], ['Aug', 'August'],
  ['Sep', 'September'], ['Oct', 'October'], ['Nov', 'November'], ['Dec', 'December'],
] as const;

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
  onSkip: () => void;
};

export function LearnerOnboardingModal({ visible, onComplete, onSkip }: LearnerOnboardingModalProps) {
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
  const [focusedInput, setFocusedInput] = useState<'day' | 'academy' | null>(null);

  const course = courses.find((entry) => entry.id === courseId);
  const monthEntry = months.find(([short]) => short === month);
  const invalidDay = day.length > 0 && (Number(day) < 1 || Number(day) > 31);
  const ready = Boolean(course && month && year && !invalidDay);

  const finish = () => {
    setSubmitted(true);
    if (!ready || !course || !monthEntry) return;
    const examDate = `${day ? Number(day) : 1} ${monthEntry[0]} ${year}`;
    updateProfile({
      ...savedProfile,
      examName: course.name,
      category: course.categories[0]?.name ?? 'General',
      examDate,
      academyId: academyId.trim(),
    });
    onComplete();
  };

  return <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onSkip}>
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
              <Text style={styles.description}>Choose your goal and exam month. We’ll organise your notes, countdown and practice around it.</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.section}>
                <View style={styles.sectionHeading}><Text style={styles.sectionNumber}>01</Text><View><Text style={styles.label}>Choose your course</Text><Text style={styles.labelHint}>Required</Text></View></View>
                <View style={styles.courseGrid}>{courses.map((entry) => {
                  const selected = courseId === entry.id;
                  const categoryNames = entry.categories.slice(0, 2).map((item) => item.name).join(' · ');
                  return <Pressable key={entry.id} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setCourseId(entry.id)} style={({ pressed }) => [styles.course, selected && styles.courseSelected, pressed && styles.pressed]}>
                    <View style={[styles.courseMark, selected && styles.courseMarkSelected]}>{selected ? <Check size={16} color="#17120B" strokeWidth={3} /> : <GraduationCap size={17} color={palette.muted} />}</View>
                    <Text numberOfLines={1} style={[styles.courseName, selected && styles.courseNameSelected]}>{entry.name}</Text>
                    <Text numberOfLines={2} style={styles.courseMeta}>{categoryNames || 'Course structure coming soon'}</Text>
                  </Pressable>;
                })}</View>
                {submitted && !course ? <Text style={styles.error}>Select the course you are preparing for.</Text> : null}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeading}><Text style={styles.sectionNumber}>02</Text><View><Text style={styles.label}>When is your exam?</Text><Text style={styles.labelHint}>Month and year required · exact day optional</Text></View></View>

                <Text style={styles.controlLabel}>MONTH</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRail}>{months.map(([short, full]) => {
                  const selected = month === short;
                  return <Pressable key={short} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setMonth(short)} style={[styles.month, selected && styles.choiceSelected]}><Text style={[styles.monthText, selected && styles.choiceTextSelected]}>{full.slice(0, 3)}</Text></Pressable>;
                })}</ScrollView>

                <Text style={styles.controlLabel}>YEAR</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRail}>{years.map((entry) => {
                  const selected = year === String(entry);
                  return <Pressable key={entry} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setYear(String(entry))} style={[styles.year, selected && styles.choiceSelected]}><Text style={[styles.yearText, selected && styles.choiceTextSelected]}>{entry}</Text></Pressable>;
                })}</ScrollView>

                <View style={[styles.inputShell, focusedInput === 'day' && styles.inputFocused, invalidDay && styles.inputError]}>
                  <CalendarDays size={17} color={invalidDay ? palette.danger : focusedInput === 'day' ? palette.gold : palette.faint} />
                  <View style={styles.inputCopy}><Text style={styles.inputLabel}>EXACT DAY · OPTIONAL</Text><TextInput value={day} onChangeText={(value) => setDay(value.replace(/[^0-9]/g, '').slice(0, 2))} onFocus={() => setFocusedInput('day')} onBlur={() => setFocusedInput(null)} placeholder="For example, 14" placeholderTextColor={palette.faint} keyboardType="number-pad" returnKeyType="done" style={styles.input} /></View>
                </View>
                {invalidDay ? <Text style={styles.error}>Enter a day between 1 and 31.</Text> : submitted && (!month || !year) ? <Text style={styles.error}>Select both an exam month and year.</Text> : null}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeading}><Text style={styles.sectionNumber}>03</Text><View><Text style={styles.label}>Academy ID</Text><Text style={styles.labelHint}>Optional · only if your institute provided one</Text></View></View>
                <View style={[styles.inputShell, focusedInput === 'academy' && styles.inputFocused]}>
                  <Building2 size={17} color={focusedInput === 'academy' ? palette.gold : palette.faint} />
                  <View style={styles.inputCopy}><Text style={styles.inputLabel}>ACADEMY OR INSTITUTE CODE</Text><TextInput value={academyId} onChangeText={setAcademyId} onFocus={() => setFocusedInput('academy')} onBlur={() => setFocusedInput(null)} placeholder="Enter your academy ID" placeholderTextColor={palette.faint} autoCapitalize="characters" returnKeyType="done" style={styles.input} /></View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={finish} style={({ pressed }) => [styles.finishShell, pressed && styles.pressed]}>
                <LinearGradient colors={['#FF763B', '#FFAE48', '#F7DF59']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.finish}>
                  <Text style={styles.finishText}>Finish setup</Text><View style={styles.arrowWell}><ArrowRight size={18} color="#17120B" /></View>
                </LinearGradient>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}><Text style={styles.skipText}>Skip for now</Text></Pressable>
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
  controlLabel: { marginTop: 14, marginBottom: 7, color: palette.faint, fontFamily: font.bold, fontSize: 7, letterSpacing: 1.15 }, choiceRail: { gap: 7, paddingRight: spacing.lg }, month: { minWidth: 61, minHeight: 36, paddingHorizontal: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.panel, alignItems: 'center', justifyContent: 'center' }, monthText: { color: palette.muted, fontFamily: font.bold, fontSize: 9 }, year: { minWidth: 69, minHeight: 36, paddingHorizontal: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.panel, alignItems: 'center', justifyContent: 'center' }, yearText: { color: palette.muted, fontFamily: font.bold, fontSize: 9 }, choiceSelected: { borderColor: palette.gold, backgroundColor: '#231A0D' }, choiceTextSelected: { color: palette.gold },
  inputShell: { minHeight: 53, marginTop: 11, paddingHorizontal: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: palette.panel, flexDirection: 'row', alignItems: 'center', gap: 10 }, inputFocused: { borderColor: palette.gold, backgroundColor: palette.panelRaised }, inputError: { borderColor: palette.danger }, inputCopy: { flex: 1, minWidth: 0, paddingVertical: 7 }, inputLabel: { color: palette.faint, fontFamily: font.bold, fontSize: 7, letterSpacing: 0.75 }, input: { minHeight: 29, paddingVertical: 0, color: palette.text, fontFamily: font.semibold, fontSize: 11 }, error: { marginTop: 6, color: palette.danger, fontFamily: font.semibold, fontSize: 9 },
  actions: { paddingHorizontal: spacing.lg, paddingTop: 10, paddingBottom: 7, borderTopWidth: 1, borderTopColor: palette.line, backgroundColor: 'rgba(6,7,10,0.96)' }, finishShell: { borderRadius: 15, shadowColor: '#FF9A3D', shadowOpacity: 0.2, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 5 }, finish: { minHeight: 52, borderRadius: 15, paddingLeft: 17, paddingRight: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, finishText: { color: '#17120B', fontFamily: font.extraBold, fontSize: 13 }, arrowWell: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' }, skip: { minHeight: 38, alignItems: 'center', justifyContent: 'center' }, skipText: { color: palette.muted, fontFamily: font.bold, fontSize: 10 }, pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
});
