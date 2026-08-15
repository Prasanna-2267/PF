import { useState, type ComponentType } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, Phone, UserRound } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LearnerOnboardingModal } from '@/components/learner-onboarding-modal';
import { font, spacing } from '@/constants/theme';
import { type StudentSignupIdentity, useAuthStore } from '@/lib/auth-store';
import { useRocketLaunch } from '@/providers/rocket-launch-provider';

type FormErrors = Partial<Record<'name' | 'phone' | 'email' | 'password', string>>;
type SignupFieldProps = TextInputProps & {
  label: string;
  error?: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  fieldKey: 'name' | 'phone' | 'email' | 'password';
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;
  trailing?: React.ReactNode;
};

const googleDemoEmail = 'student@gmail.com';
const palette = {
  canvas: '#06070A',
  panel: '#0D0E12',
  line: 'rgba(255,255,255,0.11)',
  text: '#F8F8FA',
  muted: '#A9ADB6',
  faint: '#6F747E',
  gold: '#F4C55D',
  orange: '#FF783B',
  danger: '#FF7A80',
  success: '#79D6A9',
} as const;

export default function SignupScreen() {
  const router = useRouter();
  const { launchTo } = useRocketLaunch();
  const completeStudentSignup = useAuthStore((state) => state.completeStudentSignup);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showOnboarding, setShowOnboarding] = useState(false);

  const submitSignup = () => {
    const demoHandle = name.trim().toLowerCase();
    if (demoHandle === 'mockuser' || demoHandle === 'mockadmin') {
      router.push({ pathname: '/verify-otp', params: { name: demoHandle, email: demoHandle === 'mockadmin' ? 'admin@parallaxflow.demo' : 'student@parallaxflow.demo', phone: demoHandle === 'mockadmin' ? '+91 90000 00002' : '+91 90000 00001', demoRole: demoHandle === 'mockadmin' ? 'admin' : 'student' } });
      return;
    }

    const nextErrors: FormErrors = {};
    if (name.trim().length < 2) nextErrors.name = 'Enter your full name.';
    if (phone.replace(/[^0-9]/g, '').length < 10) nextErrors.phone = 'Enter a valid mobile number.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    router.push({ pathname: '/verify-otp', params: { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), demoRole: 'student' } });
  };

  const googleIdentity: StudentSignupIdentity = { name: name.trim() || 'Google learner', email: googleDemoEmail, phone: null };
  const signupWithGoogle = () => { setErrors({}); setShowOnboarding(true); };
  const enterDashboard = (identity: StudentSignupIdentity) => {
    completeStudentSignup(identity);
    setShowOnboarding(false);
    requestAnimationFrame(() => launchTo('/home'));
  };

  return <>
    <View style={styles.canvas}>
      <StatusBar style="light" />
      <LinearGradient colors={['#D99535', '#9D5427', '#44241C', '#111014', '#06070A']} locations={[0, 0.14, 0.28, 0.43, 0.63]} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.artwork}>
        <View style={styles.warmGlow} />
        <View style={[styles.glassTile, styles.tileOne]} />
        <View style={[styles.glassTile, styles.tileTwo]} />
        <View style={styles.horizon} />
        <View style={styles.starOne} />
        <View style={styles.starTwo} />
      </View>

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.topBar}>
              <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                <ArrowLeft size={18} color={palette.text} />
              </Pressable>
              <View style={styles.brandLockup}>
                <View style={styles.brandMark}><View style={styles.brandPupil} /></View>
                <Text style={styles.wordmark}>PARALLAX FLOW</Text>
              </View>
            </View>

            <View style={styles.heading}>
              <Text style={styles.eyebrow}>START LEARNING</Text>
              <Text style={styles.title}>Build a plan around{`\n`}your ambition.</Text>
              <Text style={styles.description}>Create one account for protected notes, focused practice and visible progress.</Text>
            </View>

            <View style={styles.progressBlock}>
              <View style={styles.progressTop}><Text style={styles.progressTitle}>Account setup</Text><Text style={styles.progressCount}>1 / 3</Text></View>
              <View style={styles.progressTrack}><LinearGradient colors={[palette.orange, palette.gold]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.progressFill} /></View>
              <View style={styles.progressLabels}><Text style={styles.progressActive}>Account</Text><Text style={styles.progressLabel}>Verify</Text><Text style={styles.progressLabel}>Personalise</Text></View>
            </View>

            <View style={styles.formArea}>
              <Text style={styles.formTitle}>Create your account</Text>
              <Text style={styles.formSubtitle}>Email and mobile will be verified separately.</Text>

              <View style={styles.fields}>
                <SignupField label="Full name" fieldKey="name" icon={UserRound} value={name} onChangeText={setName} placeholder="Your full name" autoComplete="name" textContentType="name" returnKeyType="next" error={errors.name} focusedField={focusedField} setFocusedField={setFocusedField} />
                <SignupField label="Mobile number" fieldKey="phone" icon={Phone} value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" returnKeyType="next" error={errors.phone} focusedField={focusedField} setFocusedField={setFocusedField} />
                <SignupField label="Email address" fieldKey="email" icon={Mail} value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" returnKeyType="next" error={errors.email} focusedField={focusedField} setFocusedField={setFocusedField} />
                <SignupField label="Create password" fieldKey="password" icon={LockKeyhole} value={password} onChangeText={setPassword} onSubmitEditing={submitSignup} placeholder="At least 8 characters" secureTextEntry={!showPassword} autoComplete="new-password" textContentType="newPassword" returnKeyType="done" error={errors.password} focusedField={focusedField} setFocusedField={setFocusedField} trailing={<Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} hitSlop={8} onPress={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} color={palette.muted} /> : <Eye size={17} color={palette.muted} />}</Pressable>} />
              </View>

              <PasswordStrength length={password.length} />

              <Pressable accessibilityRole="button" onPress={submitSignup} style={({ pressed }) => [styles.primaryShell, pressed && styles.pressed]}>
                <LinearGradient colors={['#FF763B', '#FFAE48', '#F7DF59']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.primaryButton}>
                  <Text style={styles.primaryText}>Create account</Text>
                  <View style={styles.arrowWell}><ArrowRight size={18} color="#17120B" /></View>
                </LinearGradient>
              </Pressable>

              <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>

              <Pressable accessibilityRole="button" onPress={signupWithGoogle} style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}>
                <View style={styles.googleMark}><Text style={styles.googleLetter}>G</Text></View>
                <Text style={styles.googleText}>Sign up with Google</Text>
                <ArrowRight size={16} color={palette.faint} />
              </Pressable>
            </View>

            <View style={styles.signinRow}><Text style={styles.signinText}>Already have an account?</Text><Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push('/login')}><Text style={styles.signinLink}>Sign in</Text></Pressable></View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
    <LearnerOnboardingModal visible={showOnboarding} onComplete={() => enterDashboard(googleIdentity)} onSkip={() => enterDashboard(googleIdentity)} />
  </>;
}

function SignupField({ label, error, icon: Icon, fieldKey, focusedField, setFocusedField, trailing, ...props }: SignupFieldProps) {
  const focused = focusedField === fieldKey;
  return <View style={styles.fieldGroup}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputShell, focused && styles.inputShellFocused, error && styles.inputShellError]}>
      <Icon size={17} color={error ? palette.danger : focused ? palette.gold : palette.faint} />
      <TextInput {...props} onFocus={(event) => { setFocusedField(fieldKey); props.onFocus?.(event); }} onBlur={(event) => { setFocusedField(null); props.onBlur?.(event); }} placeholderTextColor={palette.faint} style={styles.input} />
      {trailing}
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>;
}

function PasswordStrength({ length }: { length: number }) {
  const strength = length === 0 ? 0 : length < 8 ? 1 : length < 12 ? 2 : 3;
  const color = strength === 1 ? palette.danger : strength === 2 ? palette.gold : palette.success;
  const label = strength === 0 ? 'Use 8+ characters' : strength === 1 ? 'Too short' : strength === 2 ? 'Good password' : 'Strong password';
  return <View style={styles.strength}>
    <View style={styles.strengthBars}>{[1, 2, 3].map((entry) => <View key={entry} style={[styles.strengthBar, { backgroundColor: entry <= strength ? color : palette.line }]} />)}</View>
    <View style={styles.strengthStatus}>{strength >= 2 ? <Check size={11} color={color} /> : null}<Text style={[styles.strengthText, { color: strength ? color : palette.faint }]}>{label}</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: palette.canvas }, safe: { flex: 1 }, flex: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  artwork: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
  warmGlow: { position: 'absolute', width: 330, height: 330, borderRadius: 165, top: -150, left: -85, backgroundColor: 'rgba(255,211,113,0.16)' },
  glassTile: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(55,25,18,0.24)', backgroundColor: 'rgba(255,221,151,0.025)', borderRadius: 38 },
  tileOne: { width: 280, height: 160, top: -62, left: -65, transform: [{ rotate: '-18deg' }] },
  tileTwo: { width: 260, height: 178, top: 25, right: -108, transform: [{ rotate: '23deg' }] },
  horizon: { position: 'absolute', width: 620, height: 180, borderRadius: 310, borderWidth: 1, borderColor: 'rgba(246,190,83,0.10)', top: 300, left: -120, transform: [{ rotate: '-5deg' }] },
  starOne: { position: 'absolute', width: 3, height: 3, borderRadius: 2, top: 276, right: 38, backgroundColor: '#F9D274' },
  starTwo: { position: 'absolute', width: 2, height: 2, borderRadius: 1, top: 332, right: 78, backgroundColor: 'rgba(249,210,116,0.5)' },
  topBar: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11 },
  backButton: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(8,9,12,0.22)', alignItems: 'center', justifyContent: 'center' },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandMark: { width: 24, height: 15, borderWidth: 1.8, borderColor: 'rgba(255,255,255,0.92)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandPupil: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.gold },
  wordmark: { color: 'rgba(255,255,255,0.92)', fontFamily: font.bold, fontSize: 8, letterSpacing: 1.15 },
  heading: { marginTop: 24, maxWidth: 405 }, eyebrow: { color: palette.gold, fontFamily: font.bold, fontSize: 8, letterSpacing: 1.55 },
  title: { marginTop: 8, color: palette.text, fontFamily: font.extraBold, fontSize: 30, lineHeight: 36, letterSpacing: -1 },
  description: { maxWidth: 380, marginTop: 8, color: '#D0C8C2', fontFamily: font.regular, fontSize: 11, lineHeight: 17 },
  progressBlock: { marginTop: 22 }, progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progressTitle: { color: palette.text, fontFamily: font.bold, fontSize: 10 }, progressCount: { color: palette.gold, fontFamily: font.bold, fontSize: 8, letterSpacing: 0.8 },
  progressTrack: { height: 4, marginTop: 9, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', overflow: 'hidden' }, progressFill: { width: '33.333%', height: '100%', borderRadius: 2 },
  progressLabels: { marginTop: 7, flexDirection: 'row', justifyContent: 'space-between' }, progressActive: { color: palette.gold, fontFamily: font.bold, fontSize: 8 }, progressLabel: { color: palette.faint, fontFamily: font.semibold, fontSize: 8 },
  formArea: { marginTop: 23 }, formTitle: { color: palette.text, fontFamily: font.extraBold, fontSize: 17, letterSpacing: -0.25 }, formSubtitle: { marginTop: 3, color: palette.muted, fontFamily: font.regular, fontSize: 10 },
  fields: { marginTop: 16, gap: 12 }, fieldGroup: { gap: 6 }, fieldLabel: { color: '#D6D7DB', fontFamily: font.semibold, fontSize: 10 },
  inputShell: { minHeight: 49, paddingHorizontal: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: palette.panel, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputShellFocused: { borderColor: palette.gold, backgroundColor: '#111014' }, inputShellError: { borderColor: palette.danger },
  input: { flex: 1, minWidth: 0, paddingVertical: 12, color: palette.text, fontFamily: font.regular, fontSize: 13 }, errorText: { color: palette.danger, fontFamily: font.medium, fontSize: 9 },
  strength: { marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 8 }, strengthBars: { flex: 1, flexDirection: 'row', gap: 4 }, strengthBar: { flex: 1, height: 3, borderRadius: 2 }, strengthStatus: { flexDirection: 'row', alignItems: 'center', gap: 3 }, strengthText: { fontFamily: font.semibold, fontSize: 8 },
  primaryShell: { marginTop: 16, borderRadius: 15, shadowColor: '#FF9A3D', shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  primaryButton: { minHeight: 53, borderRadius: 15, paddingLeft: 17, paddingRight: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, primaryText: { color: '#17120B', fontFamily: font.extraBold, fontSize: 13 }, arrowWell: { width: 39, height: 39, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.36)', alignItems: 'center', justifyContent: 'center' },
  divider: { marginVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, dividerLine: { flex: 1, height: 1, backgroundColor: palette.line }, dividerText: { color: palette.faint, fontFamily: font.bold, fontSize: 7, letterSpacing: 1 },
  googleButton: { minHeight: 49, paddingHorizontal: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: '#0B0C10', flexDirection: 'row', alignItems: 'center', gap: 10 }, googleMark: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, googleLetter: { color: '#4285F4', fontFamily: font.extraBold, fontSize: 14 }, googleText: { flex: 1, color: palette.text, fontFamily: font.bold, fontSize: 11, textAlign: 'center' },
  signinRow: { minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6 }, signinText: { color: palette.muted, fontFamily: font.regular, fontSize: 10 }, signinLink: { color: palette.gold, fontFamily: font.bold, fontSize: 10 }, pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
