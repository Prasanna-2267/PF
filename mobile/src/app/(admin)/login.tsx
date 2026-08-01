import { useRouter } from 'expo-router';
import { AuthShell } from '@/components/auth-shell';
import { AppButton, Card } from '@/components/ui';
export default function AdminLogin() { const router = useRouter(); return <AuthShell eyebrow="ADMINISTRATION" title="Command centre access." description="Manage Parallax Flow’s learning catalogue in this UI-only workspace."><Card><AppButton label="Enter admin demo" onPress={() => router.replace('/admin' as never)} /><AppButton label="User login" variant="secondary" onPress={() => router.replace('/(auth)/login')} /></Card></AuthShell>; }
