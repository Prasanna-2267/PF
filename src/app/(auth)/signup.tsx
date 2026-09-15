import { useState, type ComponentType } from 'react';
import {
  ActivityIndicator,
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
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail, Phone, QrCode, UserRound } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { font, spacing } from '@/constants/theme';
import { beginStudentRegistration, getAuthErrorMessage, validateAcademyCode } from '@/lib/auth-session';
import { useSignupDraftStore } from '@/lib/signup-draft-store';

type FormErrors = Partial<Record<'name' | 'phone' | 'email' | 'password' | 'devicePolicy', string>>;
type SignupFieldProps = TextInputProps & {
  label: string;
  error?: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  fieldKey: 'name' | 'phone' | 'email' | 'password';
  focusedField: string | null;
  setFocusedField: (field: string | null) => void;
  trailing?: React.ReactNode;
};

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
  const name = useSignupDraftStore((state) => state.name);
  const phone = useSignupDraftStore((state) => state.phone);
  const email = useSignupDraftStore((state) => state.email);
  const password = useSignupDraftStore((state) => state.password);
  const admissionCode = useSignupDraftStore((state) => state.admissionCode);
  const admissionProof = useSignupDraftStore((state) => state.admissionProof);
  const academyName = useSignupDraftStore((state) => state.academyName);
  const devicePolicyAccepted = useSignupDraftStore((state) => state.devicePolicyAccepted);
  const updateDraft = useSignupDraftStore((state) => state.update);
  const setName = (value: string) => updateDraft({ name: value });
  const setPhone = (value: string) => updateDraft({ phone: value });
  const setEmail = (value: string) => updateDraft({ email: value });
  const setPassword = (value: string) => updateDraft({ password: value });
  const setAdmissionCode = (value: string) => updateDraft({ admissionCode: value });
  const setAdmissionProof = (value: string) => updateDraft({ admissionProof: value });
  const setAcademyName = (value: string) => updateDraft({ academyName: value });
  const setDevicePolicyAccepted = (next: boolean | ((value: boolean) => boolean)) =>
    updateDraft({ devicePolicyAccepted: typeof next === 'function' ? next(devicePolicyAccepted) : next });
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [validatingAcademy, setValidatingAcademy] = useState(false);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const applyAdmissionCode = async () => {
    if (validatingAcademy || admissionCode.trim().length !== 8) return;
    setSubmitError(''); setValidatingAcademy(true);
    try { const result = await validateAcademyCode(admissionCode); updateDraft({ admissionProof: result.admissionProof, academyName: result.academy.name, academyId: result.academy.id }); }
    catch (error) { updateDraft({ admissionProof: '', academyName: '', academyId: '' }); setSubmitError(getAuthErrorMessage(error)); }
    finally { setValidatingAcademy(false); }
  };

  const submitSignup = async () => {
    if (submitting) return;
    setSubmitError('');
    const nextErrors: FormErrors = {};
    if (name.trim().length < 2) nextErrors.name = 'Enter your full name.';
    if (phone.replace(/[^0-9]/g, '').length < 10) nextErrors.phone = 'Enter a valid mobile number.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Enter a valid email address.';
    if (password.length < 8) nextErrors.password = 'Use at least 8 characters.';
    if (!devicePolicyAccepted) nextErrors.devicePolicy = 'Confirm the device access policy to continue.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSubmitting(true);
      const registration = await beginStudentRegistration({ fullName: name.trim(), phone: phone.trim(), email: email.trim().toLowerCase(), password, devicePolicyAccepted: true });
      router.push({
        pathname: '/verify-otp',
        params: {
          registrationId: registration.registrationId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          demoRole: 'student',
          ...(registration.developmentCode ? { developmentCode: registration.developmentCode } : {}),
          resendAfter: registration.email.resendAfter,
          ...(admissionProof ? { admissionProof } : {}),
          ...(academyName ? { academyName } : {}),
        },
      });
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return <View style={styles.canvas}>
      <StatusBar style="light" />
      <LinearGradient colors={['#D99535', '#9D5427', '#44241C', '#111014', '#06070A']} locations={[0, 0.14, 0.28, 0.43, 0.63]} style={StyleSheet.absoluteFill} />
      <View style={styles.artwork}>
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
              <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={8} onPress={goBack} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
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

              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: devicePolicyAccepted }} onPress={() => { setDevicePolicyAccepted((value) => !value); setErrors((current) => ({ ...current, devicePolicy: undefined })); }} style={[styles.devicePolicy, errors.devicePolicy && styles.devicePolicyError]}>
                <View style={[styles.policyCheck, devicePolicyAccepted && styles.policyCheckActive]}>{devicePolicyAccepted ? <Check size={14} color="#17120B" strokeWidth={3} /> : null}</View>
                <View style={styles.policyCopy}><Text style={styles.policyTitle}>Use this account on this device</Text><Text style={styles.policyText}>For content security, this student account is permanently linked to this device. An administrator must approve a future device change.</Text></View>
              </Pressable>
              {errors.devicePolicy ? <Text style={styles.errorText}>{errors.devicePolicy}</Text> : null}

              <View style={styles.academyBlock}>
                <View style={styles.academyHeading}><Building2 size={15} color={palette.gold} /><View style={styles.academyCopy}><Text style={styles.academyTitle}>Join an Academy</Text><Text style={styles.academyHint}>Optional · enter the code supplied by your Academy</Text></View></View>
                {academyName ? <View style={styles.academyVerified}><CheckCircle2 size={18} color={palette.success} /><View style={styles.academyCopy}><Text style={styles.academyVerifiedTitle}>{academyName}</Text><Text style={styles.academyVerifiedText}>Verified · membership activates after OTP verification</Text></View><Pressable onPress={() => { setAcademyName(''); setAdmissionProof(''); setAdmissionCode(''); }}><Text style={styles.changeAcademy}>Change</Text></Pressable></View>
                  : <View style={styles.academyCodeRow}><TextInput value={admissionCode} onChangeText={(value) => setAdmissionCode(value.toUpperCase().replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, '').slice(0, 8))} autoCapitalize="characters" autoCorrect={false} placeholder="8-character code" placeholderTextColor={palette.faint} style={styles.academyInput} /><Pressable disabled={admissionCode.length !== 8 || validatingAcademy} onPress={() => void applyAdmissionCode()} style={[styles.applyCode, (admissionCode.length !== 8 || validatingAcademy) && styles.applyDisabled]}>{validatingAcademy ? <ActivityIndicator size="small" color="#17120B" /> : <Text style={styles.applyCodeText}>Apply</Text>}</Pressable></View>}
                {!academyName ? <Pressable accessibilityRole="button" accessibilityLabel="Scan Academy QR code" onPress={() => router.push('/academy-qr')} style={({ pressed }) => [styles.scanAcademy, pressed && styles.pressed]}><View style={styles.scanAcademyIcon}><QrCode size={23} color={palette.gold} /></View><View style={styles.scanAcademyCopy}><Text style={styles.scanAcademyText}>Scan Academy QR</Text><Text style={styles.scanAcademyHint}>Use your camera to join an Academy</Text></View><ArrowRight size={18} color={palette.gold} /></Pressable> : null}
              </View>

              {submitError ? <Text accessibilityLiveRegion="polite" style={styles.submitError}>{submitError}</Text> : null}

              <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submitSignup()} style={({ pressed }) => [styles.primaryShell, (pressed || submitting) && styles.pressed]}>
                <LinearGradient colors={['#FF763B', '#FFAE48', '#F7DF59']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.primaryButton}>
                  <Text style={styles.primaryText}>{submitting ? 'Creating secure account…' : 'Create account'}</Text>
                  <View style={styles.arrowWell}>{submitting ? <ActivityIndicator size="small" color="#17120B" /> : <ArrowRight size={18} color="#17120B" />}</View>
                </LinearGradient>
              </Pressable>

            </View>

            <View style={styles.signinRow}><Text style={styles.signinText}>Already have an account?</Text><Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push('/login')}><Text style={styles.signinLink}>Sign in</Text></Pressable></View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>;
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
  artwork: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', pointerEvents: 'none' },
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
  submitError: { marginTop: 13, color: palette.danger, fontFamily: font.semibold, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  strength: { marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 8 }, strengthBars: { flex: 1, flexDirection: 'row', gap: 4 }, strengthBar: { flex: 1, height: 3, borderRadius: 2 }, strengthStatus: { flexDirection: 'row', alignItems: 'center', gap: 3 }, strengthText: { fontFamily: font.semibold, fontSize: 8 },
  devicePolicy: { marginTop: 15, padding: 13, borderWidth: 1, borderColor: 'rgba(244,197,93,.24)', borderRadius: 15, backgroundColor: 'rgba(13,14,18,.9)', flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  devicePolicyError: { borderColor: palette.danger }, policyCheck: { width: 23, height: 23, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(244,197,93,.5)', alignItems: 'center', justifyContent: 'center' }, policyCheckActive: { backgroundColor: palette.gold, borderColor: palette.gold }, policyCopy: { flex: 1, minWidth: 0 }, policyTitle: { color: palette.text, fontFamily: font.bold, fontSize: 10.5 }, policyText: { marginTop: 4, color: palette.muted, fontFamily: font.regular, fontSize: 8.5, lineHeight: 13 },
  academyBlock: { marginTop: 15, padding: 13, borderWidth: 1, borderColor: 'rgba(244,197,93,.22)', borderRadius: 15, backgroundColor: 'rgba(13,14,18,.88)' }, academyHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 }, academyCopy: { flex: 1, minWidth: 0 }, academyTitle: { color: palette.text, fontFamily: font.bold, fontSize: 11 }, academyHint: { marginTop: 2, color: palette.faint, fontFamily: font.regular, fontSize: 8.5 }, academyCodeRow: { marginTop: 11, flexDirection: 'row', gap: 8 }, academyInput: { flex: 1, minHeight: 43, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: palette.line, color: palette.text, fontFamily: font.bold, fontSize: 11, letterSpacing: 1.1 }, applyCode: { minWidth: 72, borderRadius: 12, backgroundColor: palette.gold, alignItems: 'center', justifyContent: 'center' }, applyCodeText: { color: '#17120B', fontFamily: font.extraBold, fontSize: 10 }, applyDisabled: { opacity: .38 }, scanAcademy: { minHeight: 62, marginTop: 12, paddingHorizontal: 11, borderWidth: 1, borderColor: 'rgba(244,197,93,.28)', borderRadius: 14, backgroundColor: 'rgba(244,197,93,.07)', flexDirection: 'row', alignItems: 'center', gap: 10 }, scanAcademyIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: 'rgba(244,197,93,.12)', alignItems: 'center', justifyContent: 'center' }, scanAcademyCopy: { flex: 1, minWidth: 0 }, scanAcademyText: { color: palette.text, fontFamily: font.bold, fontSize: 11 }, scanAcademyHint: { marginTop: 3, color: palette.muted, fontFamily: font.regular, fontSize: 8.5 }, academyVerified: { minHeight: 52, marginTop: 10, paddingHorizontal: 10, borderRadius: 12, backgroundColor: 'rgba(121,214,169,.08)', flexDirection: 'row', alignItems: 'center', gap: 9 }, academyVerifiedTitle: { color: palette.text, fontFamily: font.bold, fontSize: 11 }, academyVerifiedText: { marginTop: 2, color: palette.success, fontFamily: font.regular, fontSize: 8 }, changeAcademy: { color: palette.gold, fontFamily: font.bold, fontSize: 9 },
  primaryShell: { marginTop: 16, borderRadius: 15, ...Platform.select({ web: { boxShadow: '0 7px 16px rgba(255, 154, 61, 0.22)' }, default: { shadowColor: '#FF9A3D', shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 5 } }) },
  primaryButton: { minHeight: 53, borderRadius: 15, paddingLeft: 17, paddingRight: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, primaryText: { color: '#17120B', fontFamily: font.extraBold, fontSize: 13 }, arrowWell: { width: 39, height: 39, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.36)', alignItems: 'center', justifyContent: 'center' },
  signinRow: { minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6 }, signinText: { color: palette.muted, fontFamily: font.regular, fontSize: 10 }, signinLink: { color: palette.gold, fontFamily: font.bold, fontSize: 10 }, pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
