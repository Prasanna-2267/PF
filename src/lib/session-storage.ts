import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthUser } from '@/lib/auth-store';

const SESSION_KEY = 'parallax-flow.auth-session.v1';

export type StoredAuthSession = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: number;
  user: AuthUser;
};

let webMemorySession: StoredAuthSession | null = null;

const isStoredSession = (value: unknown): value is StoredAuthSession => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredAuthSession>;
  const accessToken = candidate.accessToken;
  const userId = candidate.user?.id;
  return typeof accessToken === 'string'
    && !accessToken.startsWith('ui-only-')
    && typeof candidate.refreshToken === 'string'
    && typeof candidate.accessTokenExpiresAt === 'number'
    && Boolean(candidate.user)
    && typeof userId === 'string'
    && !userId.startsWith('demo-')
    && !userId.startsWith('student-');
};

export async function readStoredSession(): Promise<StoredAuthSession | null> {
  if (Platform.OS === 'web') return webMemorySession;

  try {
    const encoded = await SecureStore.getItemAsync(SESSION_KEY);
    if (!encoded) return null;
    const parsed: unknown = JSON.parse(encoded);
    if (isStoredSession(parsed)) return parsed;
  } catch {
    // Corrupt or inaccessible credentials are treated as signed out.
  }

  await deleteStoredSession();
  return null;
}

export async function writeStoredSession(session: StoredAuthSession): Promise<void> {
  if (Platform.OS === 'web') {
    webMemorySession = session;
    return;
  }

  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function deleteStoredSession(): Promise<void> {
  webMemorySession = null;
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(SESSION_KEY);
}
