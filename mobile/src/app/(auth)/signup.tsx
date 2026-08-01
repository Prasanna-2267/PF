import { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthLink, AuthShell } from '@/components/auth-shell';
import { AppButton, AppTextField, Card } from '@/components/ui';
import { font } from '@/constants/theme';
import { useAppTheme } from '@/providers/app-providers';

export default function SignupScreen() { const router = useRouter(); const { theme } = useAppTheme(); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); return <AuthShell eyebrow="START HERE" title="Build your study rhythm." description="Create your account to organise your exam preparation." footer={<View style={{ flexDirection: 'row', gap: 8 }}><Text style={{ color: theme.muted, fontFamily: font.regular, fontSize: 13 }}>Already have an account?</Text><AuthLink onPress={() => router.replace('/login')}>Sign in</AuthLink></View>}><Card><AppTextField label="Full name" value={name} onChangeText={setName} placeholder="Your name" /><AppTextField label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" /><AppTextField label="Create password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry /><AppButton label="Continue" onPress={() => router.push('/verify-otp')} /></Card></AuthShell>; }
