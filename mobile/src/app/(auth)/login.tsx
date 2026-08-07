import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, BookOpenCheck, KeyRound, ShieldCheck, Target, UserPlus } from 'lucide-react-native';

import { AuthLink, AuthShell } from '@/components/auth-shell';
import { AppButton, AppTextField, Card } from '@/components/ui';
import { font, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { useAppTheme } from '@/providers/app-providers';

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useAppTheme();
  const beginDemoSession = useAuthStore((state) => state.beginDemoSession);
  const beginAdminDemoSession = useAuthStore((state) => state.beginAdminDemoSession);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('demo-password');

  const signIn = () => {
    if (identifier.trim().toLowerCase() === 'mockadmin') {
      beginAdminDemoSession();
      router.replace('/admin' as never);
      return;
    }
    beginDemoSession();
    router.replace('/home');
  };

  const signInWithGoogle = () => {
    beginDemoSession();
    router.replace('/home');
  };

  return <AuthShell
    eyebrow="WELCOME BACK"
    title="Step back into your momentum."
    description="Sign in to continue your study plan, protected notes and daily progress from exactly where you paused."
    footer={<View style={styles.switchRow}><View style={[styles.switchIcon, { backgroundColor: theme.goldSoft }]}><UserPlus size={17} color={theme.goldStrong} /></View><View style={styles.switchCopy}><Text style={[styles.switchTitle, { color: theme.fg }]}>New to Parallax Flow?</Text><Text style={[styles.switchText, { color: theme.muted }]}>Create your learner identity in a few steps.</Text></View><AuthLink onPress={() => router.push('/signup')}>Create account</AuthLink></View>}
  >
    <View style={[styles.returnStrip, { backgroundColor: theme.primarySoft, borderColor: theme.lineStrong }]}>
      <View style={[styles.returnIcon, { backgroundColor: theme.primary }]}><Target size={18} color={theme.primaryFg} /></View>
      <View style={styles.returnCopy}><Text style={[styles.returnLabel, { color: theme.primaryStrong }]}>YOUR LEARNING SPACE</Text><Text style={[styles.returnTitle, { color: theme.fg }]}>Your plan is ready when you are.</Text></View>
      <ShieldCheck size={18} color={theme.success} />
    </View>

    <Card style={styles.loginCard}>
      <View style={[styles.topAccent, { backgroundColor: theme.primary }]} />
      <View style={styles.cardHeading}>
        <View style={[styles.cardIcon, { backgroundColor: theme.primarySoft, borderColor: theme.lineStrong }]}><KeyRound size={22} color={theme.primaryStrong} strokeWidth={2.2} /></View>
        <View style={styles.cardHeadingCopy}><Text style={[styles.cardTitle, { color: theme.fg }]}>Sign in securely</Text><Text style={[styles.cardSubtitle, { color: theme.muted }]}>Use your registered learning account.</Text></View>
        <View style={[styles.verifiedMark, { backgroundColor: theme.successSoft }]}><ShieldCheck size={16} color={theme.success} /></View>
      </View>

      <View style={styles.fields}>
        <AppTextField label="Email or demo name" value={identifier} onChangeText={setIdentifier} placeholder="you@example.com, mockuser or mockadmin" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" />
        <AppTextField label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry autoComplete="current-password" textContentType="password" />
      </View>

      <View style={styles.utilityRow}><View style={styles.secureSession}><ShieldCheck size={13} color={theme.success} /><Text style={[styles.secureSessionText, { color: theme.muted }]}>Encrypted session</Text></View><AuthLink onPress={() => router.push('/forgot-password')}>Forgot password?</AuthLink></View>
      <AppButton label="Sign in to continue" onPress={signIn} />

      <View style={styles.divider}><View style={[styles.dividerLine, { backgroundColor: theme.line }]} /><Text style={[styles.dividerText, { color: theme.faint }]}>OR CONTINUE WITH</Text><View style={[styles.dividerLine, { backgroundColor: theme.line }]} /></View>
      <Pressable accessibilityRole="button" onPress={signInWithGoogle} style={({ pressed }) => [styles.googleButton, { backgroundColor: theme.surface, borderColor: theme.lineStrong }, pressed && styles.pressed]}><View style={styles.googleMark}><Text style={styles.googleLetter}>G</Text></View><Text style={[styles.googleButtonText, { color: theme.fg }]}>Sign in with Google</Text><ArrowRight size={16} color={theme.muted} /></Pressable>
    </Card>

    <View style={styles.valueRow}><ValueItem icon={<Target size={15} color={theme.primaryStrong} />} label="Focused plan" /><View style={[styles.valueDivider, { backgroundColor: theme.line }]} /><ValueItem icon={<BookOpenCheck size={15} color={theme.goldStrong} />} label="Protected notes" /><View style={[styles.valueDivider, { backgroundColor: theme.line }]} /><ValueItem icon={<ShieldCheck size={15} color={theme.success} />} label="Private progress" /></View>
  </AuthShell>;
}

function ValueItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { theme } = useAppTheme();
  return <View style={styles.valueItem}>{icon}<Text numberOfLines={1} adjustsFontSizeToFit style={[styles.valueLabel, { color: theme.muted }]}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  returnStrip: { minHeight: 66, borderWidth: 1, borderRadius: 18, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  returnIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, returnCopy: { flex: 1, minWidth: 0 }, returnLabel: { fontFamily: font.bold, fontSize: 7, letterSpacing: 1.05 }, returnTitle: { marginTop: 3, fontFamily: font.bold, fontSize: 12 },
  loginCard: { position: 'relative', borderRadius: 22, padding: spacing.lg, gap: spacing.lg, overflow: 'hidden' }, topAccent: { position: 'absolute', top: 0, left: 24, right: 24, height: 2, borderRadius: 1 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 }, cardIcon: { width: 46, height: 46, borderWidth: 1, borderRadius: 15, alignItems: 'center', justifyContent: 'center' }, cardHeadingCopy: { flex: 1, minWidth: 0 }, cardTitle: { fontFamily: font.extraBold, fontSize: 17, letterSpacing: -.25 }, cardSubtitle: { marginTop: 3, fontFamily: font.regular, fontSize: 10 }, verifiedMark: { width: 33, height: 33, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  fields: { gap: spacing.md }, utilityRow: { minHeight: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, secureSession: { flexDirection: 'row', alignItems: 'center', gap: 5 }, secureSessionText: { fontFamily: font.medium, fontSize: 9 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8 }, dividerLine: { flex: 1, height: 1 }, dividerText: { fontFamily: font.bold, fontSize: 6, letterSpacing: .7 },
  googleButton: { minHeight: 49, borderWidth: 1, borderRadius: radius.field, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 }, googleMark: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, googleLetter: { color: '#4285F4', fontFamily: font.extraBold, fontSize: 14 }, googleButtonText: { flex: 1, fontFamily: font.bold, fontSize: 12, textAlign: 'center' },
  valueRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center' }, valueItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 4 }, valueLabel: { maxWidth: '100%', fontFamily: font.semibold, fontSize: 8, textAlign: 'center' }, valueDivider: { width: 1, height: 24 },
  switchRow: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 9 }, switchIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, switchCopy: { flex: 1, minWidth: 0 }, switchTitle: { fontFamily: font.bold, fontSize: 10 }, switchText: { marginTop: 2, fontFamily: font.regular, fontSize: 8 }, pressed: { opacity: .76, transform: [{ scale: .99 }] },
});
