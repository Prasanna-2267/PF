import { isAxiosError } from 'axios';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { authHttp } from '@/lib/auth-http';
import { type AuthUser, useAuthStore } from '@/lib/auth-store';
import { API_CONNECTION_HINT } from '@/lib/env';
import {
  deleteStoredSession,
  readStoredSession,
  type StoredAuthSession,
  writeStoredSession,
} from '@/lib/session-storage';
import { clearUserScopedCache } from '@/lib/user-cache';
import { learnerProfileFromPreference, type LearnerPreferenceDto } from '@/lib/learner-preferences';
import { useLearnerProfileStore } from '@/lib/learner-profile-store';
import { useThemePreferenceStore } from '@/lib/theme-preference-store';

type ServerUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
};

type AuthResult = {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: ServerUser;
};

type SessionResult = { user: ServerUser };
type StudentBootstrapResult = {
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    avatarStoragePath: string | null;
    role: 'student';
  };
  session: {
    id: string;
    platform: 'ANDROID' | 'IOS' | 'WEB' | 'UNKNOWN';
    expiresAt: string;
  };
  accessSummary: {
    planLabel: 'FREE' | 'PAID';
    activeEntitlementCount: number;
  };
  preference: LearnerPreferenceDto | null;
};
  type ApiErrorBody = { error?: { code?: string; message?: string; fieldErrors?: Record<string, string[]> } };
export type RegistrationChannel = 'email' | 'mobile';
export type RegistrationChallengeResult = {
  registrationId: string;
  email: { masked: string; status: 'PENDING'; resendAfter: string };
  phone: { masked: string; status: 'PENDING' };
  expiresAt: string;
  developmentCode?: string;
};
export type RegistrationOtpResult = {
  channel: RegistrationChannel;
  status: 'PENDING' | 'VERIFIED';
  resendAfter?: string;
  nextStep?: 'VERIFY_MOBILE' | 'COMPLETE';
  developmentCode?: string;
};

let refreshPromise: Promise<StoredAuthSession> | null = null;
let restorePromise: Promise<void> | null = null;

const toAuthUser = (user: ServerUser, previous?: AuthUser | null): AuthUser => ({
  id: user.id,
  name: user.fullName,
  email: user.email,
  phone: previous?.id === user.id ? previous.phone : null,
  role: user.role === 'student' ? 'student' : user.role === 'superadmin' ? 'superadmin' : 'admin',
  plan: previous?.id === user.id ? previous.plan : 'free',
  emailVerified: true,
  activeStageId: previous?.id === user.id ? previous.activeStageId : null,
  avatarUrl: previous?.id === user.id ? previous.avatarUrl : null,
});

const clientPlatform = (): 'ANDROID' | 'IOS' | 'WEB' => {
  if (Platform.OS === 'android') return 'ANDROID';
  if (Platform.OS === 'ios') return 'IOS';
  return 'WEB';
};

const authRequestHeaders = () => ({
  'x-client-platform': clientPlatform(),
  ...(Device.deviceName ? { 'x-device-name': Device.deviceName } : {}),
});

const toBootstrapUser = (result: StudentBootstrapResult, previous: AuthUser): AuthUser => ({
  id: result.user.id,
  name: result.user.fullName,
  email: result.user.email,
  phone: result.user.phone,
  role: 'student',
  plan: result.accessSummary.planLabel === 'PAID' ? 'paid' : 'free',
  emailVerified: true,
  // The server preference is authoritative. Keeping a previously cached course when
  // bootstrap returns `preference: null` makes the UI look personalised while every
  // course-scoped API correctly rejects the account with COURSE_NOT_SELECTED.
  activeStageId: result.preference?.selectedCourseId ?? null,
  avatarUrl: result.user.avatarStoragePath,
});

const hydrateStudentBootstrap = async (session: StoredAuthSession): Promise<StoredAuthSession> => {
  const response = await authHttp.get<StudentBootstrapResult>('/student/bootstrap', {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (response.data.preference) {
    const profileStore = useLearnerProfileStore.getState();
    profileStore.updateProfile(learnerProfileFromPreference(response.data.preference, profileStore.profile));
    await useThemePreferenceStore.getState().setPreference(response.data.preference.preferredTheme.toLowerCase() as 'light' | 'dark');
  }
  const next = { ...session, user: toBootstrapUser(response.data, session.user) };
  await writeStoredSession(next);
  useAuthStore.getState().setAuth(next.user, next.accessToken);
  return next;
};

const hydrateStudentBootstrapWhenAvailable = async (session: StoredAuthSession): Promise<StoredAuthSession> => {
  try {
    return await hydrateStudentBootstrap(session);
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 401) throw error;
    // A temporary bootstrap outage must not invalidate otherwise valid credentials.
    return session;
  }
};

const assertStudent = async (result: AuthResult): Promise<void> => {
  if (result.user.role === 'student') return;

  try {
    await authHttp.post('/auth/logout', undefined, {
      headers: { Authorization: `Bearer ${result.accessToken}` },
    });
  } catch {
    // Best-effort revocation; the non-student session is never persisted.
  }
  throw new Error('This application is available only to student accounts.');
};

const acceptAuthResult = async (result: AuthResult, previous?: AuthUser | null): Promise<StoredAuthSession> => {
  await assertStudent(result);
  if (!previous || previous.id !== result.user.id) await clearUserScopedCache();
  const session: StoredAuthSession = {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    accessTokenExpiresAt: Date.now() + result.expiresIn * 1_000,
    user: toAuthUser(result.user, previous),
  };
  await writeStoredSession(session);
  useAuthStore.getState().setAuth(session.user, session.accessToken);
  return session;
};

export async function clearLocalSession(): Promise<void> {
  await Promise.allSettled([deleteStoredSession(), clearUserScopedCache()]);
  useAuthStore.getState().clear();
}

export function refreshSession(): Promise<StoredAuthSession> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const stored = await readStoredSession();
    if (!stored?.refreshToken) throw new Error('No refresh credential is available.');

    try {
      const response = await authHttp.post<AuthResult>('/auth/refresh', {
        refreshToken: stored.refreshToken,
      }, {
        headers: authRequestHeaders(),
      });
      const session = await acceptAuthResult(response.data, stored.user);
      return await hydrateStudentBootstrapWhenAvailable(session);
    } catch (error) {
      await clearLocalSession();
      throw error;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export function restoreSession(): Promise<void> {
  if (restorePromise) return restorePromise;

  restorePromise = (async () => {
    useAuthStore.getState().setLoading();
    const stored = await readStoredSession();
    if (!stored) {
      useAuthStore.getState().clear();
      return;
    }

    useAuthStore.getState().setAuth(stored.user, stored.accessToken);
    try {
      if (stored.accessTokenExpiresAt <= Date.now() + 10_000) {
        await refreshSession();
        return;
      }

      const response = await authHttp.get<SessionResult>('/auth/session', {
        headers: { Authorization: `Bearer ${stored.accessToken}` },
      });
      const user = toAuthUser(response.data.user, stored.user);
      const next = { ...stored, user };
      await writeStoredSession(next);
      useAuthStore.getState().setAuth(user, stored.accessToken);
      await hydrateStudentBootstrapWhenAvailable(next);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        try {
          await refreshSession();
        } catch {
          // Refresh already clears invalid local credentials and user caches.
        }
        return;
      }
      await clearLocalSession();
    }
  })().finally(() => {
    restorePromise = null;
  });

  return restorePromise;
}

export async function loginWithPassword(email: string, password: string): Promise<AuthUser> {
  const response = await authHttp.post<AuthResult>('/auth/login', { email, password }, {
    headers: authRequestHeaders(),
  });
  const session = await acceptAuthResult(response.data);
  const hydrated = await hydrateStudentBootstrapWhenAvailable(session);
  return hydrated.user;
}

export async function beginStudentRegistration(input: { fullName: string; phone: string; email: string; password: string }): Promise<RegistrationChallengeResult> {
  const response = await authHttp.post<RegistrationChallengeResult>('/auth/registrations', input, {
    headers: authRequestHeaders(),
  });
  return response.data;
}

export async function sendStudentRegistrationOtp(registrationId: string, channel: RegistrationChannel): Promise<RegistrationOtpResult> {
  const response = await authHttp.post<RegistrationOtpResult>(`/auth/registrations/${registrationId}/${channel}/send`, undefined, {
    headers: authRequestHeaders(),
  });
  return response.data;
}

export async function verifyStudentRegistrationOtp(registrationId: string, channel: RegistrationChannel, code: string): Promise<RegistrationOtpResult> {
  const response = await authHttp.post<RegistrationOtpResult>(`/auth/registrations/${registrationId}/${channel}/verify`, { code }, {
    headers: authRequestHeaders(),
  });
  return response.data;
}

export async function completeStudentRegistration(registrationId: string): Promise<AuthUser> {
  const response = await authHttp.post<AuthResult>(`/auth/registrations/${registrationId}/complete`, undefined, {
    headers: authRequestHeaders(),
  });
  const session = await acceptAuthResult(response.data);
  const hydrated = await hydrateStudentBootstrapWhenAvailable(session);
  return hydrated.user;
}

export async function logoutSession(): Promise<void> {
  const accessToken = useAuthStore.getState().accessToken;
  try {
    if (accessToken) {
      await authHttp.post('/auth/logout', undefined, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  } catch {
    // Local sign-out must still complete while the server is unreachable.
  } finally {
    await clearLocalSession();
  }
}

export function getAuthErrorMessage(error: unknown): string {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
  }
  if (!error.response) {
    const endpoint = API_CONNECTION_HINT ? ` (${API_CONNECTION_HINT})` : '';
    return `Cannot reach Parallax Flow${endpoint}. Check your connection and try again.`;
  }
  const apiError = error.response.data?.error;
  const firstFieldError = apiError?.fieldErrors
    ? Object.entries(apiError.fieldErrors).find(([, messages]) => messages.length > 0)
    : undefined;
  if (firstFieldError) {
    const [field, messages] = firstFieldError;
    const label = field.replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('.', ' ').toLowerCase();
    return `${label}: ${messages[0]}`;
  }
  return apiError?.message ?? 'Unable to sign in. Please check your details.';
}
