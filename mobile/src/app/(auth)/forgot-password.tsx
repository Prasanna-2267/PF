import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthLink, AuthShell } from '@/components/auth-shell';
import { AppButton, AppTextField, Card } from '@/components/ui';

export default function ForgotPasswordScreen() { const router = useRouter(); const [email, setEmail] = useState(''); return <AuthShell eyebrow="ACCOUNT RECOVERY" title="Reset your password." description="We'll send you a code to securely choose a new password."><Card><AppTextField label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" /><AppButton label="Send reset code" onPress={() => router.push('/reset-password')} /></Card><AuthLink onPress={() => router.back()}>Back to sign in</AuthLink></AuthShell>; }
