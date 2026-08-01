import { Redirect, Slot } from 'expo-router';
import { useAuthStore } from '@/lib/auth-store';

export default function StudentLayout() {
  const status = useAuthStore((s) => s.status);
  if (status !== 'authenticated') return <Redirect href="/login" />;
  return <Slot />;
}
