import { Redirect } from 'expo-router';

import { RemoteLibraryScreen } from '@/components/remote-library';
import { useAuthStore } from '@/lib/auth-store';

export default function LibraryScreen() {
  const academyStudent = useAuthStore((state) => Boolean(state.user?.academyId));
  if (academyStudent) return <Redirect href="/notes" />;
  return <RemoteLibraryScreen />;
}
