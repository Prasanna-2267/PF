import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthLink, AuthShell } from '@/components/auth-shell';
import { AppButton, AppTextField, Card } from '@/components/ui';
import { font, spacing } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { useAppTheme } from '@/providers/app-providers';

export default function LoginScreen() {
  const router = useRouter(); const { theme } = useAppTheme(); const beginDemoSession = useAuthStore((s) => s.beginDemoSession); const [email, setEmail] = useState('aditi@example.com'); const [password, setPassword] = useState('demo-password');
  const signIn = () => { beginDemoSession(); router.replace('/home'); };
  return <AuthShell eyebrow="WELCOME BACK" title="Study with clarity." description="Sign in to continue your focused exam preparation." footer={<View style={styles.footer}><Text style={[styles.footerText, { color: theme.muted }]}>New to Parallax Flow?</Text><AuthLink onPress={() => router.push('/signup')}>Create an account</AuthLink></View>}>
    <Card><AppTextField label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /><AppTextField label="Password" value={password} onChangeText={setPassword} secureTextEntry /><View style={styles.forgot}><AuthLink onPress={() => router.push('/forgot-password')}>Forgot password?</AuthLink></View><AppButton label="Sign in" onPress={signIn} /></Card>
    <Pressable onPress={signIn} style={[styles.demo, { borderColor: theme.line, backgroundColor: theme.sunken }]}><Text style={[styles.demoTitle, { color: theme.fg }]}>Enter UI demo</Text><Text style={[styles.demoText, { color: theme.muted }]}>Explore all screens with a local sample student account.</Text></Pressable>
  </AuthShell>;
}
const styles = StyleSheet.create({ forgot: { alignItems: 'flex-end' }, demo: { borderWidth: 1, borderRadius: 16, padding: spacing.lg, gap: 3 }, demoTitle: { fontFamily: font.bold, fontSize: 14 }, demoText: { fontFamily: font.regular, fontSize: 12, lineHeight: 18 }, footer: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }, footerText: { fontFamily: font.regular, fontSize: 13 } });
