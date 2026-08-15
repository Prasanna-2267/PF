import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { font, radius, spacing } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';

const palette = {
  canvas: '#06070A',
  panel: 'rgba(8, 9, 12, 0.90)',
  panelStrong: '#0D0E12',
  line: 'rgba(255, 255, 255, 0.11)',
  lineWarm: 'rgba(247, 192, 91, 0.34)',
  text: '#F8F8FA',
  muted: '#A9ADB6',
  faint: '#6F747E',
  gold: '#F4C55D',
} as const;

export default function LoginScreen() {
  const router = useRouter();
  const beginDemoSession = useAuthStore((state) => state.beginDemoSession);
  const beginPaidDemoSession = useAuthStore((state) => state.beginPaidDemoSession);
  const beginAdminDemoSession = useAuthStore((state) => state.beginAdminDemoSession);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('demo-password');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const signIn = () => {
    const handle = identifier.trim().toLowerCase();
    if (handle === 'mockadmin') {
      beginAdminDemoSession();
      router.replace('/admin' as never);
      return;
    }
    if (handle === 'mockpaid') {
      beginPaidDemoSession();
      router.replace('/home');
      return;
    }
    beginDemoSession();
    router.replace('/home');
  };

  const signInWithGoogle = () => {
    beginDemoSession();
    router.replace('/home');
  };

  return <View style={styles.canvas}>
    <StatusBar style="light" />
    <LinearGradient colors={['#D99535', '#9D5427', '#44241C', '#111014', '#06070A']} locations={[0, 0.18, 0.34, 0.53, 0.74]} style={StyleSheet.absoluteFill} />
    <View pointerEvents="none" style={styles.artwork}>
      <View style={styles.warmGlow} />
      <View style={[styles.glassTile, styles.tileOne]} />
      <View style={[styles.glassTile, styles.tileTwo]} />
      <View style={[styles.glassTile, styles.tileThree]} />
      <View style={styles.horizon} />
      <View style={styles.starOne} />
      <View style={styles.starTwo} />
      <View style={styles.starThree} />
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
            <View style={styles.securePill}><ShieldCheck size={12} color={palette.gold} /><Text style={styles.secureText}>SECURE</Text></View>
          </View>

          <View style={styles.heading}>
            <Text style={styles.eyebrow}>WELCOME BACK</Text>
            <Text style={styles.title}>Step back into{`\n`}your momentum.</Text>
            <Text style={styles.description}>Your notes, practice and progress are waiting exactly where you left them.</Text>
          </View>

          <View style={styles.formPanel}>
            <View style={styles.formHeadingRow}>
              <View>
                <Text style={styles.formEyebrow}>MEMBER ACCESS</Text>
                <Text style={styles.formTitle}>Sign in to continue</Text>
              </View>
              <View style={styles.lockBadge}><LockKeyhole size={18} color={palette.gold} /></View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Email address</Text>
              <View style={[styles.inputShell, focusedField === 'email' && styles.inputShellFocused]}>
                <Mail size={17} color={focusedField === 'email' ? palette.gold : palette.faint} />
                <TextInput value={identifier} onChangeText={setIdentifier} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} placeholder="you@example.com" placeholderTextColor={palette.faint} autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" keyboardType="email-address" returnKeyType="next" style={styles.input} />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.fieldLabel}>Password</Text>
                <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push('/forgot-password')}><Text style={styles.forgotText}>Forgot password?</Text></Pressable>
              </View>
              <View style={[styles.inputShell, focusedField === 'password' && styles.inputShellFocused]}>
                <LockKeyhole size={17} color={focusedField === 'password' ? palette.gold : palette.faint} />
                <TextInput value={password} onChangeText={setPassword} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} onSubmitEditing={signIn} placeholder="Enter your password" placeholderTextColor={palette.faint} secureTextEntry={!showPassword} autoComplete="current-password" textContentType="password" returnKeyType="done" style={styles.input} />
                <Pressable accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'} hitSlop={8} onPress={() => setShowPassword((value) => !value)}>
                  {showPassword ? <EyeOff size={17} color={palette.muted} /> : <Eye size={17} color={palette.muted} />}
                </Pressable>
              </View>
            </View>

            <Pressable accessibilityRole="button" onPress={signIn} style={({ pressed }) => [styles.primaryShell, pressed && styles.pressed]}>
              <LinearGradient colors={['#FF763B', '#FFAE48', '#F7DF59']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.primaryButton}>
                <Text style={styles.primaryText}>Sign in</Text>
                <View style={styles.arrowWell}><ArrowRight size={18} color="#17120B" /></View>
              </LinearGradient>
            </Pressable>

            <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>OR</Text><View style={styles.dividerLine} /></View>

            <Pressable accessibilityRole="button" onPress={signInWithGoogle} style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}>
              <View style={styles.googleMark}><Text style={styles.googleLetter}>G</Text></View>
              <Text style={styles.googleText}>Continue with Google</Text>
              <ArrowRight size={16} color={palette.faint} />
            </Pressable>
          </View>

          <View style={styles.createRow}>
            <Text style={styles.createText}>New to Parallax Flow?</Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push('/signup')}><Text style={styles.createLink}>Create an account</Text></Pressable>
          </View>

          <Text style={styles.demoHint}>UI preview · mockuser · mockpaid · mockadmin</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>;
}

const styles = StyleSheet.create({
  canvas: { flex: 1, backgroundColor: palette.canvas },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  artwork: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' },
  warmGlow: { position: 'absolute', width: 330, height: 330, borderRadius: 165, top: -150, left: -80, backgroundColor: 'rgba(255, 211, 113, 0.16)' },
  glassTile: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(55, 25, 18, 0.24)', backgroundColor: 'rgba(255, 221, 151, 0.025)', borderRadius: 38 },
  tileOne: { width: 280, height: 160, top: -60, left: -66, transform: [{ rotate: '-18deg' }] },
  tileTwo: { width: 260, height: 178, top: 15, right: -105, transform: [{ rotate: '23deg' }] },
  tileThree: { width: 260, height: 148, top: 188, left: 34, transform: [{ rotate: '12deg' }] },
  horizon: { position: 'absolute', width: 620, height: 180, borderRadius: 310, borderWidth: 1, borderColor: 'rgba(246, 190, 83, 0.10)', top: 315, left: -120, transform: [{ rotate: '-5deg' }] },
  starOne: { position: 'absolute', width: 3, height: 3, borderRadius: 2, top: 288, right: 38, backgroundColor: '#F9D274' },
  starTwo: { position: 'absolute', width: 3, height: 3, borderRadius: 2, top: 344, right: 77, backgroundColor: 'rgba(249, 210, 116, 0.55)' },
  starThree: { position: 'absolute', width: 2, height: 2, borderRadius: 1, top: 393, right: 29, backgroundColor: 'rgba(249, 210, 116, 0.34)' },
  topBar: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  backButton: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(8,9,12,0.22)', alignItems: 'center', justifyContent: 'center' },
  brandLockup: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandMark: { width: 24, height: 15, borderWidth: 1.8, borderColor: 'rgba(255,255,255,0.92)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandPupil: { width: 5, height: 5, borderRadius: 3, backgroundColor: palette.gold },
  wordmark: { color: 'rgba(255,255,255,0.92)', fontFamily: font.bold, fontSize: 8, letterSpacing: 1.15 },
  securePill: { minHeight: 28, paddingHorizontal: 9, borderWidth: 1, borderColor: 'rgba(244,197,93,0.25)', borderRadius: radius.pill, backgroundColor: 'rgba(10,11,14,0.24)', flexDirection: 'row', alignItems: 'center', gap: 5 },
  secureText: { color: palette.gold, fontFamily: font.bold, fontSize: 6, letterSpacing: 0.7 },
  heading: { marginTop: 34, maxWidth: 405 },
  eyebrow: { color: palette.gold, fontFamily: font.bold, fontSize: 8, letterSpacing: 1.55 },
  title: { marginTop: 8, color: palette.text, fontFamily: font.extraBold, fontSize: 31, lineHeight: 37, letterSpacing: -1 },
  description: { maxWidth: 380, marginTop: 9, color: '#D0C8C2', fontFamily: font.regular, fontSize: 12, lineHeight: 18 },
  formPanel: { marginTop: 28, padding: spacing.lg, borderWidth: 1, borderColor: palette.line, borderRadius: 24, backgroundColor: palette.panel, gap: 14 },
  formHeadingRow: { marginBottom: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formEyebrow: { color: palette.gold, fontFamily: font.bold, fontSize: 7, letterSpacing: 1.35 },
  formTitle: { marginTop: 4, color: palette.text, fontFamily: font.bold, fontSize: 17, letterSpacing: -0.25 },
  lockBadge: { width: 37, height: 37, borderRadius: 13, borderWidth: 1, borderColor: palette.lineWarm, backgroundColor: 'rgba(244,197,93,0.09)', alignItems: 'center', justifyContent: 'center' },
  fieldGroup: { gap: 7 },
  fieldLabel: { color: '#D6D7DB', fontFamily: font.semibold, fontSize: 10 },
  passwordLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  forgotText: { color: palette.gold, fontFamily: font.bold, fontSize: 9 },
  inputShell: { minHeight: 50, paddingHorizontal: 13, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: palette.panelStrong, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputShellFocused: { borderColor: palette.gold, backgroundColor: '#111014' },
  input: { flex: 1, minWidth: 0, paddingVertical: 13, color: palette.text, fontFamily: font.regular, fontSize: 13 },
  primaryShell: { marginTop: 4, borderRadius: 15, shadowColor: '#FF9A3D', shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 5 },
  primaryButton: { minHeight: 53, borderRadius: 15, paddingLeft: 17, paddingRight: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryText: { color: '#17120B', fontFamily: font.extraBold, fontSize: 13 },
  arrowWell: { width: 39, height: 39, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.36)', alignItems: 'center', justifyContent: 'center' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: palette.line },
  dividerText: { color: palette.faint, fontFamily: font.bold, fontSize: 7, letterSpacing: 1 },
  googleButton: { minHeight: 49, paddingHorizontal: 12, borderWidth: 1, borderColor: palette.line, borderRadius: 14, backgroundColor: '#0B0C10', flexDirection: 'row', alignItems: 'center', gap: 10 },
  googleMark: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  googleLetter: { color: '#4285F4', fontFamily: font.extraBold, fontSize: 14 },
  googleText: { flex: 1, color: palette.text, fontFamily: font.bold, fontSize: 11, textAlign: 'center' },
  createRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 6 },
  createText: { color: palette.muted, fontFamily: font.regular, fontSize: 10 },
  createLink: { color: palette.gold, fontFamily: font.bold, fontSize: 10 },
  demoHint: { marginTop: 'auto', paddingTop: 8, color: palette.faint, fontFamily: font.medium, fontSize: 7.5, letterSpacing: 0.15, textAlign: 'center' },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
});
