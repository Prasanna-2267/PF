import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Check, Mail, ShieldCheck, Sparkles, UserRoundCheck } from 'lucide-react-native';

import { AuthLink, AuthShell } from '@/components/auth-shell';
import { LearnerOnboardingModal } from '@/components/learner-onboarding-modal';
import { AppButton, AppTextField, Card } from '@/components/ui';
import { font, radius, spacing } from '@/constants/theme';
import { type StudentSignupIdentity, useAuthStore } from '@/lib/auth-store';
import { useAppTheme } from '@/providers/app-providers';
import { useRocketLaunch } from '@/providers/rocket-launch-provider';

type FormErrors = Partial<Record<'name' | 'phone' | 'email' | 'password', string>>;
const googleDemoEmail = 'student@gmail.com';

export default function SignupScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const { launchTo } = useRocketLaunch();
  const completeStudentSignup = useAuthStore((state) => state.completeStudentSignup);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <AuthShell
      eyebrow="BEGIN YOUR JOURNEY"
      title="Create a learning identity that grows with you."
      description="One secure account connects your course, exam target, verified notes and daily momentum."
      footer={<View style={styles.switchRow}><View style={[styles.switchIcon, { backgroundColor: theme.successSoft }]}><UserRoundCheck size={17} color={theme.success} /></View><View style={styles.switchCopy}><Text style={[styles.switchTitle, { color: theme.fg }]}>Already learning with us?</Text><Text style={[styles.switchText, { color: theme.muted }]}>Return to your existing plan and progress.</Text></View><AuthLink onPress={() => router.push('/login')}>Sign in</AuthLink></View>}
    >
      <View style={[styles.journeyCard, { backgroundColor: theme.goldSoft, borderColor: theme.goldStrong }]}>
        <View style={[styles.journeyOrb, { backgroundColor: theme.gold }]}><Sparkles size={20} color="#FFFFFF" /></View>
        <View style={styles.journeyCopy}><Text style={[styles.journeyLabel, { color: theme.goldStrong }]}>YOUR STARTING LINE</Text><Text style={[styles.journeyTitle, { color: theme.fg }]}>Account → verification → personal plan</Text><Text style={[styles.journeyText, { color: theme.muted }]}>A focused setup designed around your exam.</Text></View>
      </View>

      <Card style={styles.signupCard}>
        <View style={[styles.topAccent, { backgroundColor: theme.gold }]} />
        <View style={styles.cardHeading}>
          <View style={[styles.cardIcon, { backgroundColor: theme.goldSoft, borderColor: theme.lineStrong }]}><Mail size={21} color={theme.goldStrong} /></View>
          <View style={styles.cardHeadingCopy}><Text style={[styles.accountStep, { color: theme.goldStrong }]}>SECURE ACCOUNT</Text><Text style={[styles.cardTitle, { color: theme.fg }]}>Tell us who is learning</Text><Text style={[styles.cardSubtitle, { color: theme.muted }]}>Email and mobile receive separate OTPs.</Text></View>
        </View>

        <View style={styles.fields}>
          <AppTextField label="Full name" value={name} onChangeText={setName} placeholder="Your full name" autoComplete="name" textContentType="name" error={errors.name} />
          <AppTextField label="Mobile number" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" error={errors.phone} />
          <AppTextField label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" error={errors.email} />
          <AppTextField label="Create password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry autoComplete="new-password" textContentType="newPassword" error={errors.password} />
        </View>

        <PasswordStrength length={password.length} />
        <AppButton label="Create account securely" variant="gold" onPress={submitSignup} />
        <View style={styles.divider}><View style={[styles.dividerLine, { backgroundColor: theme.line }]} /><Text style={[styles.dividerText, { color: theme.faint }]}>OR SIGN UP WITH</Text><View style={[styles.dividerLine, { backgroundColor: theme.line }]} /></View>
        <Pressable accessibilityRole="button" onPress={signupWithGoogle} style={({ pressed }) => [styles.googleButton, { backgroundColor: theme.surface, borderColor: theme.lineStrong }, pressed && styles.pressed]}><View style={styles.googleMark}><Text style={styles.googleLetter}>G</Text></View><Text style={[styles.googleButtonText, { color: theme.fg }]}>Sign up with Google</Text><ArrowRight size={16} color={theme.muted} /></Pressable>
      </Card>

      <View style={[styles.verificationNote, { backgroundColor: theme.successSoft, borderColor: theme.line }]}><View style={[styles.noteIcon, { backgroundColor: theme.surface }]}><ShieldCheck size={16} color={theme.success} /></View><View style={styles.noteCopy}><Text style={[styles.noteTitle, { color: theme.fg }]}>Two-step verification</Text><Text style={[styles.noteText, { color: theme.muted }]}>Your email and mobile are verified before personalization begins.</Text></View></View>
    </AuthShell>
    <LearnerOnboardingModal visible={showOnboarding} onComplete={() => enterDashboard(googleIdentity)} onSkip={() => enterDashboard(googleIdentity)} />
  </>;
}

function PasswordStrength({ length }: { length: number }) {
  const { theme } = useAppTheme();
  const strength = length === 0 ? 0 : length < 8 ? 1 : length < 12 ? 2 : 3;
  const color = strength === 1 ? theme.danger : strength === 2 ? theme.warn : theme.success;
  const label = strength === 0 ? 'Use 8+ characters' : strength === 1 ? 'Too short' : strength === 2 ? 'Good password' : 'Strong password';
  return <View style={styles.strength}><View style={styles.strengthBars}>{[1, 2, 3].map((entry) => <View key={entry} style={[styles.strengthBar, { backgroundColor: entry <= strength ? color : theme.line }]} />)}</View><View style={styles.strengthStatus}>{strength >= 2 ? <Check size={11} color={color} /> : null}<Text style={[styles.strengthText, { color: strength ? color : theme.faint }]}>{label}</Text></View></View>;
}

const styles = StyleSheet.create({
  journeyCard: { minHeight: 82, borderWidth: 1, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11, overflow: 'hidden' }, journeyOrb: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }] }, journeyCopy: { flex: 1, minWidth: 0 }, journeyLabel: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1.1 }, journeyTitle: { marginTop: 3, fontFamily: font.extraBold, fontSize: 13 }, journeyText: { marginTop: 3, fontFamily: font.regular, fontSize: 9 },
  signupCard: { position: 'relative', borderRadius: 22, padding: spacing.lg, gap: spacing.md, overflow: 'hidden' }, topAccent: { position: 'absolute', top: 0, left: 24, right: 24, height: 2, borderRadius: 1 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 }, cardIcon: { width: 46, height: 46, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, cardHeadingCopy: { flex: 1, minWidth: 0 }, accountStep: { marginBottom: 2, fontFamily: font.bold, fontSize: 7, letterSpacing: 1 }, cardTitle: { fontFamily: font.extraBold, fontSize: 17, letterSpacing: -.25 }, cardSubtitle: { marginTop: 3, fontFamily: font.regular, fontSize: 10 }, fields: { gap: spacing.md },
  strength: { marginTop: -3, flexDirection: 'row', alignItems: 'center', gap: 8 }, strengthBars: { flex: 1, flexDirection: 'row', gap: 4 }, strengthBar: { flex: 1, height: 3, borderRadius: 2 }, strengthStatus: { flexDirection: 'row', alignItems: 'center', gap: 3 }, strengthText: { fontFamily: font.semibold, fontSize: 8 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8 }, dividerLine: { flex: 1, height: 1 }, dividerText: { fontFamily: font.bold, fontSize: 6, letterSpacing: .7 }, googleButton: { minHeight: 49, borderWidth: 1, borderRadius: radius.field, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }, googleMark: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, googleLetter: { color: '#4285F4', fontFamily: font.extraBold, fontSize: 14 }, googleButtonText: { flex: 1, fontFamily: font.bold, fontSize: 12, textAlign: 'center' },
  verificationNote: { minHeight: 62, borderWidth: 1, borderRadius: 17, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 9 }, noteIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, noteCopy: { flex: 1, minWidth: 0 }, noteTitle: { fontFamily: font.bold, fontSize: 10 }, noteText: { marginTop: 2, fontFamily: font.regular, fontSize: 8, lineHeight: 12 },
  switchRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 9 }, switchIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, switchCopy: { flex: 1, minWidth: 0 }, switchTitle: { fontFamily: font.bold, fontSize: 10 }, switchText: { marginTop: 2, fontFamily: font.regular, fontSize: 8 }, pressed: { opacity: .76, transform: [{ scale: .99 }] },
});
