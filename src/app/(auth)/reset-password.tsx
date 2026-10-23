import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthLink, AuthShell } from '@/components/auth-shell';
import { AppButton, AppTextField, Card } from '@/components/ui';
import { confirmPasswordReset, getAuthErrorMessage } from '@/lib/auth-session';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ challengeId?: string; email?: string }>();
  const challengeId = typeof params.challengeId === 'string' ? params.challengeId : '';
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!challengeId) { setError('This reset request is unavailable. Request a new code.'); return; }
    if (!/^\d{4}$/.test(code.trim())) { setError('Enter the 4-digit reset code from your email.'); return; }
    if (password.length < 12) { setError('Your new password must contain at least 12 characters.'); return; }
    if (password !== confirmPassword) { setError('The new passwords do not match.'); return; }
    setError(''); setLoading(true);
    try {
      await confirmPasswordReset({ challengeId, code: code.trim(), newPassword: password, confirmPassword });
      router.replace('/login');
    } catch (resetError) { setError(getAuthErrorMessage(resetError)); }
    finally { setLoading(false); }
  };

  return <AuthShell eyebrow="NEW PASSWORD" title="Secure your account." description={params.email ? `Enter the code sent to ${params.email} and choose a new password.` : 'Enter your reset code and choose a new password.'}><Card><AppTextField label="Reset code" value={code} onChangeText={(value) => { setCode(value.replace(/\D/g, '').slice(0, 4)); setError(''); }} placeholder="0000" keyboardType="number-pad" maxLength={4} /><AppTextField label="Enter New Password" value={password} onChangeText={(value) => { setPassword(value); setError(''); }} secureTextEntry autoCapitalize="none" /><AppTextField label="Confirm Password" value={confirmPassword} onChangeText={(value) => { setConfirmPassword(value); setError(''); }} secureTextEntry autoCapitalize="none" error={error} /><AppButton label="Reset password" loading={loading} onPress={() => void submit()} /></Card><AuthLink onPress={() => router.replace('/forgot-password')}>Request a new code</AuthLink></AuthShell>;
}
