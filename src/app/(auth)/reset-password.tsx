import { useState } from 'react';
import { useRouter } from 'expo-router';
import { AuthLink, AuthShell } from '@/components/auth-shell';
import { AppButton, AppTextField, Card } from '@/components/ui';

export default function ResetPasswordScreen() { const router = useRouter(); const [code, setCode] = useState(''); const [password, setPassword] = useState(''); return <AuthShell eyebrow="NEW PASSWORD" title="Secure your account." description="Enter your reset code and choose a new password."><Card><AppTextField label="Reset code" value={code} onChangeText={setCode} placeholder="000000" keyboardType="number-pad" /><AppTextField label="New password" value={password} onChangeText={setPassword} secureTextEntry /><AppButton label="Reset password" onPress={() => router.replace('/login')} /></Card><AuthLink onPress={() => router.back()}>Back</AuthLink></AuthShell>; }
