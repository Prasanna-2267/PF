import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthLink, AuthShell } from '@/components/auth-shell';
import { AppButton, AppTextField, Card } from '@/components/ui';
import { getAuthErrorMessage, requestPasswordReset } from '@/lib/auth-session';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) { setError('Enter a valid email address.'); return; }
    setError(''); setLoading(true);
    try {
      const challenge = await requestPasswordReset(normalizedEmail);
      router.push({ pathname: '/reset-password', params: { challengeId: challenge.challengeId, email: normalizedEmail } });
    } catch (requestError) { setError(getAuthErrorMessage(requestError)); }
    finally { setLoading(false); }
  };

  return <AuthShell eyebrow="ACCOUNT RECOVERY" title="Reset your password." description="We'll send you a code to securely choose a new password."><Card><AppTextField label="Email address" value={email} onChangeText={(value) => { setEmail(value); setError(''); }} error={error} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} /><AppButton label="Send reset code" loading={loading} onPress={() => void submit()} /></Card><AuthLink onPress={() => router.back()}>Back to sign in</AuthLink></AuthShell>;
}
