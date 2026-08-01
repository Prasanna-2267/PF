import { useRouter } from 'expo-router';
import { AuthShell } from '@/components/auth-shell';
import { AppButton, StatusView } from '@/components/ui';

export default function ForcedLogoutScreen() { const router = useRouter(); return <AuthShell eyebrow="SESSION ENDED" title="Signed out for your security." description="Your account was opened on another device. Sign in again to keep studying."><StatusView title="This session is no longer active" description="Parallax Flow keeps one active study session to protect your account." action={<AppButton label="Sign in again" onPress={() => router.replace('/login')} />} /></AuthShell>; }
