import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Check, LockKeyhole, LockOpen, Mail, ShieldCheck, Smartphone } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { LearnerOnboardingModal } from '@/components/learner-onboarding-modal';
import { font, spacing } from '@/constants/theme';
import { useAuthStore, type StudentSignupIdentity } from '@/lib/auth-store';
import { useRocketLaunch } from '@/providers/rocket-launch-provider';

type OtpChannel = 'email' | 'mobile';
type OtpStatus = 'idle' | 'verifying' | 'verified';

const palette = {
  canvas: '#000000', card: '#111015', cardLine: '#242129', phone: '#15141A', field: '#19181E', fieldLine: '#29272F',
  fg: '#FFFFFF', muted: '#8D8993', faint: '#5D5963', orange: '#FF9D1F', active: '#FF4E5D', green: '#1ED27F', cyan: '#21C9D8',
};

function param(value: string | string[] | undefined, fallback: string) { return (Array.isArray(value) ? value[0] : value) || fallback; }

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { launchTo } = useRocketLaunch();
  const scrollRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams<{ name?: string; email?: string; phone?: string; demoRole?: string }>();
  const completeStudentSignup = useAuthStore((state) => state.completeStudentSignup);
  const beginAdminDemoSession = useAuthStore((state) => state.beginAdminDemoSession);
  const emailAttempt = useRef(0);
  const mobileAttempt = useRef(0);
  const [activeChannel, setActiveChannel] = useState<OtpChannel>('email');
  const [emailCode, setEmailCode] = useState('');
  const [mobileCode, setMobileCode] = useState('');
  const [emailStatus, setEmailStatus] = useState<OtpStatus>('idle');
  const [mobileStatus, setMobileStatus] = useState<OtpStatus>('idle');
  const [resent, setResent] = useState<OtpChannel>();
  const [stageVersion, setStageVersion] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const identity: StudentSignupIdentity = { name: param(params.name, 'New learner'), email: param(params.email, 'student@example.com'), phone: param(params.phone, '+91 98765 43210') };
  const isAdminDemo = param(params.demoRole, 'student') === 'admin';

  const finishFlow = () => {
    if (isAdminDemo) {
      beginAdminDemoSession();
      router.replace('/admin' as never);
      return;
    }
    setShowOnboarding(true);
  };

  const completePersonalisation = () => {
    completeStudentSignup(identity);
    setShowOnboarding(false);
    requestAnimationFrame(() => launchTo('/home'));
  };

  const updateCode = (channel: OtpChannel, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 4);
    const isEmail = channel === 'email';
    const attemptRef = isEmail ? emailAttempt : mobileAttempt;
    const setCode = isEmail ? setEmailCode : setMobileCode;
    const setStatus = isEmail ? setEmailStatus : setMobileStatus;
    const attempt = ++attemptRef.current;
    setCode(cleaned);
    if (cleaned.length !== 4) {
      setStatus('idle');
      return;
    }

    Keyboard.dismiss();
    setStatus('verifying');
    setTimeout(() => {
      if (attempt !== attemptRef.current) return;
      setStatus('verified');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      setTimeout(() => {
        if (attempt !== attemptRef.current) return;
        if (isEmail) {
          setActiveChannel('mobile');
          setStageVersion((current) => current + 1);
        } else finishFlow();
      }, 1550);
    }, 1250);
  };

  const resendCode = () => {
    const isEmail = activeChannel === 'email';
    if (isEmail) {
      emailAttempt.current += 1;
      setEmailCode('');
      setEmailStatus('idle');
    } else {
      mobileAttempt.current += 1;
      setMobileCode('');
      setMobileStatus('idle');
    }
    setResent(activeChannel);
    setStageVersion((current) => current + 1);
    setTimeout(() => setResent((current) => current === activeChannel ? undefined : current), 2200);
  };

  const code = activeChannel === 'email' ? emailCode : mobileCode;
  const status = activeChannel === 'email' ? emailStatus : mobileStatus;
  const destination = activeChannel === 'email' ? identity.email : identity.phone ?? '';

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="light" />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 8} style={styles.flex}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeading}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to account details" onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><ArrowLeft size={19} color={palette.fg} /></Pressable>
          <View style={styles.headingCopy}><Text style={styles.pageTitle}>OTP verification</Text><Text style={styles.pageStep}>{activeChannel === 'email' ? 'EMAIL · 1 OF 2' : 'MOBILE · 2 OF 2'}</Text></View>
          <View style={styles.secureMark}><ShieldCheck size={17} color={palette.cyan} /></View>
        </View>

        <ReferenceOtpCard key={`${activeChannel}-${stageVersion}`} channel={activeChannel} destination={destination} code={code} status={status} resent={resent === activeChannel} onInputFocus={() => setTimeout(() => scrollRef.current?.scrollTo({ y: 235, animated: true }), 120)} onChange={(value) => updateCode(activeChannel, value)} onResend={resendCode} />

        <View style={styles.progressDots}><View style={[styles.progressDot, { backgroundColor: emailStatus === 'verified' ? palette.green : activeChannel === 'email' ? palette.orange : palette.faint }]} /><View style={[styles.progressLine, { backgroundColor: emailStatus === 'verified' ? palette.green : palette.cardLine }]} /><View style={[styles.progressDot, { backgroundColor: mobileStatus === 'verified' ? palette.green : activeChannel === 'mobile' ? palette.orange : palette.faint }]} /></View>
        <Text style={styles.demoHint}>Demo: enter any four digits. Verification starts automatically.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
    <LearnerOnboardingModal visible={showOnboarding} onComplete={completePersonalisation} onSkip={completePersonalisation} />
  </SafeAreaView>;
}

function ReferenceOtpCard({ channel, destination, code, status, resent, onInputFocus, onChange, onResend }: { channel: OtpChannel; destination: string; code: string; status: OtpStatus; resent: boolean; onInputFocus: () => void; onChange: (value: string) => void; onResend: () => void }) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [entrance] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(0));
  const [success] = useState(() => new Animated.Value(0));
  const [tickPop] = useState(() => new Animated.Value(0));
  const [showFinalTick, setShowFinalTick] = useState(false);
  const [digitScales] = useState(() => Array.from({ length: 4 }, () => new Animated.Value(1)));
  const digits = Array.from({ length: 4 }, (_, index) => code[index] ?? '');

  useEffect(() => {
    const entranceAnimation = Animated.parallel([
      Animated.timing(entrance, { toValue: 1, duration: 430, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.sequence([Animated.delay(360), Animated.spring(digitScales[0], { toValue: 1, damping: 8, stiffness: 170, useNativeDriver: false })]),
    ]);
    entranceAnimation.start();
    const focusTimer = setTimeout(() => inputRefs.current[0]?.focus(), 520);
    return () => { clearTimeout(focusTimer); entranceAnimation.stop(); };
  }, [digitScales, entrance]);

  useEffect(() => {
    pulse.stopAnimation();
    if (status === 'verifying') {
      pulse.setValue(0);
      const loop = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
        Animated.timing(pulse, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      ]));
      loop.start();
      return () => loop.stop();
    }
    if (status === 'verified') {
      success.setValue(0);
      Animated.spring(success, { toValue: 1, damping: 7, stiffness: 125, mass: .72, useNativeDriver: false }).start();
      const tickTimer = setTimeout(() => {
        setShowFinalTick(true);
        tickPop.setValue(0);
        Animated.spring(tickPop, { toValue: 1, damping: 6, stiffness: 180, mass: .62, useNativeDriver: false }).start();
      }, 480);
      return () => clearTimeout(tickTimer);
    }
  }, [pulse, status, success, tickPop]);

  const changeDigit = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      const pasted = cleaned.slice(0, 4);
      onChange(pasted);
      setFocusedIndex(Math.min(pasted.length, 3));
      inputRefs.current[Math.min(pasted.length, 3)]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = cleaned;
    digitScales[index].setValue(.55);
    Animated.spring(digitScales[index], { toValue: 1, damping: 6, stiffness: 250, mass: .52, useNativeDriver: false }).start();
    onChange(next.join(''));
    if (cleaned && index < 3) {
      setFocusedIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const backspace = (index: number) => {
    if (digits[index] || index === 0) return;
    const next = [...digits];
    next[index - 1] = '';
    onChange(next.join(''));
    setFocusedIndex(index - 1);
    inputRefs.current[index - 1]?.focus();
  };

  const verified = status === 'verified';
  const verifying = status === 'verifying';
  const accent = verified ? palette.green : verifying ? palette.active : palette.orange;
  const ChannelIcon = channel === 'email' ? Mail : Smartphone;

  return <Animated.View style={[styles.card, { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }, { scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [.975, 1] }) }] }]}>
    <View style={styles.illustration}>
      <Animated.View style={[styles.phoneGlow, { backgroundColor: accent, opacity: verified ? success.interpolate({ inputRange: [0, 1], outputRange: [.08, .24] }) : verifying ? pulse.interpolate({ inputRange: [0, 1], outputRange: [.07, .22] }) : .04, transform: [{ scale: verifying ? pulse.interpolate({ inputRange: [0, 1], outputRange: [.92, 1.1] }) : verified ? success.interpolate({ inputRange: [0, 1], outputRange: [.86, 1.08] }) : 1 }] }]} />
      <Animated.View style={[styles.phone, { borderColor: accent, shadowColor: accent, shadowOpacity: verifying ? pulse.interpolate({ inputRange: [0, 1], outputRange: [.22, .72] }) : verified ? .7 : .18, transform: [{ scale: verifying ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) : verified ? success.interpolate({ inputRange: [0, 1], outputRange: [.92, 1] }) : 1 }] }]}>
        <View style={styles.phoneSpeaker} />
        <Text style={styles.phoneTime}>9:41</Text><Text style={styles.phoneSignal}>5G  ▰</Text>
        <View style={[styles.lockRing, { borderColor: verified ? 'rgba(30,210,127,.35)' : 'rgba(255,157,31,.28)', backgroundColor: verified ? 'rgba(30,210,127,.08)' : 'rgba(255,157,31,.06)' }]}>{verified ? <LockOpen size={26} color={palette.green} /> : <LockKeyhole size={25} color={palette.orange} />}</View>
        <View style={styles.phoneCode}>{Array.from({ length: 4 }, (_, index) => verified ? <Check key={index} size={14} color={palette.green} strokeWidth={3} /> : <Text key={index} style={[styles.phoneAsterisk, { color: palette.orange }]}>*</Text>)}</View>
        <View style={[styles.phoneButton, { backgroundColor: verified ? palette.green : palette.orange }]}><Text style={styles.phoneButtonText}>{verified ? 'Verified ✓' : verifying ? 'Verifying…' : 'Verify'}</Text></View>
        <View style={styles.homeIndicator} />
      </Animated.View>
      <View style={[styles.floatingChannel, styles.floatingLeft, { backgroundColor: channel === 'email' ? '#FFFFFF' : '#173A59' }]}><ChannelIcon size={22} color={channel === 'email' ? '#E4434D' : '#61B7FF'} /></View>
      <View style={styles.floatingShield}><ShieldCheck size={29} color={palette.cyan} /></View>
    </View>

    <Animated.View style={[styles.message, verified && { opacity: success, transform: [{ translateY: success.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
      <Text accessibilityLiveRegion="polite" style={[styles.cardTitle, verified && { color: palette.green }]}>{verified ? channel === 'email' ? 'Email Verified!' : 'Number Verified!' : verifying ? 'Verifying code…' : channel === 'email' ? "Let's verify your email" : "Let's verify your number"}</Text>
      <Text style={[styles.cardDescription, verified && { color: palette.green }]}>{verified ? `Your ${channel === 'email' ? 'email address' : 'number'} has been verified` : `We've sent a 4-digit code to your ${channel === 'email' ? 'email' : 'phone'}.\nIt'll auto-verify once entered.`}</Text>
    </Animated.View>

    {verified ? <Animated.View style={[styles.successLoader, { opacity: success }]}>{showFinalTick ? <Animated.View style={[styles.finalTick, { transform: [{ scale: tickPop.interpolate({ inputRange: [0, 1], outputRange: [.35, 1] }) }, { rotate: tickPop.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '0deg'] }) }] }]}><Check size={29} color="#07170F" strokeWidth={3.5} /></Animated.View> : <ActivityIndicator size="large" color={palette.green} />}<Text style={[styles.successStatus, { opacity: showFinalTick ? 1 : 0 }]}>{channel === 'email' ? 'Email confirmed' : 'Mobile confirmed'}</Text></Animated.View> : <>
      <View style={styles.codeRow}>{digits.map((digit, index) => <Animated.View key={index} style={{ flex: 1, transform: [{ scale: digitScales[index] }] }}><TextInput ref={(node) => { inputRefs.current[index] = node; }} value={digit} editable={!verifying} onFocus={() => { setFocusedIndex(index); onInputFocus(); }} onChangeText={(value) => changeDigit(index, value)} onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Backspace') backspace(index); }} keyboardType="number-pad" textContentType={index === 0 ? 'oneTimeCode' : 'none'} autoComplete={index === 0 ? 'sms-otp' : 'off'} maxLength={4} selectTextOnFocus style={[styles.codeInput, (focusedIndex === index || digit) && { borderColor: palette.active }, focusedIndex === index && styles.codeInputActive]} /></Animated.View>)}</View>
      <View style={styles.resendRow}><Text style={styles.resendQuestion}>{"Didn't receive the code?"}</Text><Pressable accessibilityRole="button" onPress={onResend} hitSlop={9} style={({ pressed }) => pressed && styles.pressed}><Text style={[styles.resendText, resent && { color: palette.green }]}>{resent ? 'Code sent ✓' : 'Resend'}</Text></Pressable></View>
    </>}
  </Animated.View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.canvas }, flex: { flex: 1 }, content: { flexGrow: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xl, justifyContent: 'center' },
  pageHeading: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 11 }, back: { width: 39, height: 39, borderRadius: 13, borderWidth: 1, borderColor: palette.cardLine, backgroundColor: palette.card, alignItems: 'center', justifyContent: 'center' }, headingCopy: { flex: 1, alignItems: 'center' }, pageTitle: { color: palette.fg, fontFamily: font.bold, fontSize: 16 }, pageStep: { marginTop: 2, color: '#F3DF24', fontFamily: font.extraBold, fontSize: 8, letterSpacing: 1.1 }, secureMark: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  card: { minHeight: 582, marginTop: 13, borderWidth: 1, borderColor: palette.cardLine, borderRadius: 29, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 18, backgroundColor: palette.card, alignItems: 'center', shadowColor: '#000000', shadowOpacity: .42, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 9 },
  illustration: { width: '100%', height: 245, alignItems: 'center', justifyContent: 'center' }, phoneGlow: { position: 'absolute', width: 176, height: 206, borderRadius: 52 }, phone: { width: 146, height: 220, borderWidth: 1.5, borderRadius: 31, backgroundColor: palette.phone, alignItems: 'center', paddingTop: 24, shadowRadius: 18, shadowOffset: { width: 0, height: 0 }, elevation: 6 }, phoneSpeaker: { position: 'absolute', top: 8, width: 31, height: 4, borderRadius: 2, backgroundColor: '#34323A' }, phoneTime: { position: 'absolute', top: 14, left: 13, color: '#D8D6DB', fontFamily: font.bold, fontSize: 7 }, phoneSignal: { position: 'absolute', top: 14, right: 12, color: '#D8D6DB', fontFamily: font.bold, fontSize: 6 },
  lockRing: { width: 58, height: 58, marginTop: 9, borderWidth: 1, borderRadius: 29, alignItems: 'center', justifyContent: 'center' }, phoneCode: { height: 29, marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }, phoneAsterisk: { fontFamily: font.extraBold, fontSize: 18 }, phoneButton: { width: 104, height: 30, marginTop: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, phoneButtonText: { color: '#17120B', fontFamily: font.extraBold, fontSize: 8, letterSpacing: .4 }, homeIndicator: { position: 'absolute', bottom: 9, width: 32, height: 3, borderRadius: 2, backgroundColor: '#4E4B54' },
  floatingChannel: { position: 'absolute', width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', shadowColor: '#000000', shadowOpacity: .35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 4 }, floatingLeft: { left: '13%', bottom: 63 }, floatingShield: { position: 'absolute', right: '11%', top: 61 },
  message: { minHeight: 92, alignItems: 'center', justifyContent: 'center' }, cardTitle: { color: palette.fg, fontFamily: font.extraBold, fontSize: 20, letterSpacing: -.45, textAlign: 'center' }, cardDescription: { maxWidth: 285, marginTop: 10, color: palette.muted, fontFamily: font.regular, fontSize: 10, lineHeight: 16, textAlign: 'center' },
  codeRow: { width: '100%', marginTop: 15, flexDirection: 'row', gap: 10 }, codeInput: { width: '100%', height: 58, borderWidth: 1, borderColor: palette.fieldLine, borderRadius: 14, backgroundColor: palette.field, color: palette.fg, fontFamily: font.extraBold, fontSize: 21, textAlign: 'center' }, codeInputActive: { shadowColor: palette.active, shadowOpacity: .55, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 5 },
  resendRow: { minHeight: 52, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }, resendQuestion: { color: palette.faint, fontFamily: font.medium, fontSize: 9 }, resendText: { color: palette.fg, fontFamily: font.bold, fontSize: 10 }, successLoader: { height: 100, alignItems: 'center', justifyContent: 'center', gap: 7 }, finalTick: { width: 52, height: 52, borderRadius: 26, backgroundColor: palette.green, alignItems: 'center', justifyContent: 'center', shadowColor: palette.green, shadowOpacity: .48, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 6 }, successStatus: { color: palette.green, fontFamily: font.bold, fontSize: 8, letterSpacing: .45 },
  progressDots: { width: 90, height: 20, alignSelf: 'center', flexDirection: 'row', alignItems: 'center' }, progressDot: { width: 7, height: 7, borderRadius: 4 }, progressLine: { flex: 1, height: 1, marginHorizontal: 7 }, demoHint: { color: palette.faint, fontFamily: font.medium, fontSize: 7.5, textAlign: 'center' }, pressed: { opacity: .68, transform: [{ scale: .98 }] },
});
