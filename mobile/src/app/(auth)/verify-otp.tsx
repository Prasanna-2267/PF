import { useState } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthLink, AuthShell } from '@/components/auth-shell';
import { AppButton, AppTextField, Card } from '@/components/ui';
import { font } from '@/constants/theme';
import { useAuthStore } from '@/lib/auth-store';
import { useAppTheme } from '@/providers/app-providers';

export default function VerifyOtpScreen() { const router = useRouter(); const { theme } = useAppTheme(); const [code, setCode] = useState(''); const beginDemoSession = useAuthStore((s) => s.beginDemoSession); const verify = () => { beginDemoSession(); router.replace('/home'); }; return <AuthShell eyebrow="VERIFY EMAIL" title="One last step." description="Enter the six-digit verification code sent to your email."><Card><AppTextField label="Verification code" value={code} onChangeText={setCode} placeholder="000000" keyboardType="number-pad" maxLength={6} /><AppButton label="Verify and continue" onPress={verify} /><Text style={{ color: theme.muted, fontFamily: font.regular, fontSize: 12, textAlign: 'center' }}>This UI demo accepts any six digits.</Text></Card><AuthLink onPress={() => router.back()}>Use a different email</AuthLink></AuthShell>; }
