import { isAxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { queryClient } from '@/lib/query-client';
import { isDevelopmentWebDeviceEmulation, nativeDeviceIdentityHeaders } from '@/lib/device-identity';

type ServerUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissions: string[];
  isFirstLogin?: boolean;
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
  activeAcademy: { id: string; name: string; slug: string } | null;
  preference: LearnerPreferenceDto | null;
};
  type ApiErrorBody = { error?: { code?: string; message?: string; fieldErrors?: Record<string, string[]> } };
export type RegistrationChannel = 'email';
export type RegistrationChallengeResult = {
  registrationId: string;
  email: { masked: string; status: 'PENDING'; resendAfter: string };
  expiresAt: string;
  developmentCode?: string;
};
export type RegistrationOtpResult = {
  channel: RegistrationChannel;
  status: 'PENDING' | 'VERIFIED';
  resendAfter?: string;
  nextStep?: 'COMPLETE';
  developmentCode?: string;
};
export type AcademyAdmissionPreview = {
  academy: { id: string; name: string; slug: string; description: string; logoUrl: string | null; city: string; state: string };
  admissionProof: string;
  expiresAt: string;
};

let refreshPromise: Promise<StoredAuthSession> | null = null;
let restorePromise: Promise<void> | null = null;
let clearPromise: Promise<void> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

const REFRESH_EARLY_MS = 30_000;
const REFRESH_RETRY_MS = 15_000;

function scheduleSessionRefresh(session: StoredAuthSession, delayOverride?: number): void {
  if (refreshTimer) clearTimeout(refreshTimer);
  const delay = delayOverride ?? Math.max(1_000, session.accessTokenExpiresAt - Date.now() - REFRESH_EARLY_MS);
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    void refreshSession().catch(() => {
      // A transient network failure keeps the refresh credential intact. Retry
      // while this same learner is still authenticated; definitive rejection
      // clears the auth store and therefore does not schedule another attempt.
      const auth = useAuthStore.getState();
      if (auth.status === 'authenticated' && auth.user?.id === session.user.id) {
        scheduleSessionRefresh(session, REFRESH_RETRY_MS);
      }
    });
  }, delay);
}

const WELCOME_QUOTE_COUNT = 28;
const welcomeQuoteKey = (userId: string) => `parallax-flow.welcome-quote.${userId}`;

async function nextWelcomeQuoteIndex(userId: string): Promise<number> {
  const stored = Number(await AsyncStorage.getItem(welcomeQuoteKey(userId)));
  const previous = Number.isInteger(stored) && stored >= 0 && stored < WELCOME_QUOTE_COUNT ? stored : null;
  const randomRange = previous === null ? WELCOME_QUOTE_COUNT : WELCOME_QUOTE_COUNT - 1;
  let next = Math.floor(Math.random() * randomRange);
  if (previous !== null && next >= previous) next += 1;
  await AsyncStorage.setItem(welcomeQuoteKey(userId), String(next));
  return next;
}

const toAuthUser = (user: ServerUser, previous?: AuthUser | null, welcomeQuoteIndex = previous?.welcomeQuoteIndex ?? 0): AuthUser => ({
  id: user.id,
  name: user.fullName,
  email: user.email,
  phone: previous?.id === user.id ? previous.phone : null,
  role: user.role === 'student' ? 'student' : user.role === 'superadmin' ? 'superadmin' : 'admin',
  plan: previous?.id === user.id ? previous.plan : 'free',
  emailVerified: true,
  activeStageId: previous?.id === user.id ? previous.activeStageId : null,
  avatarUrl: previous?.id === user.id ? previous.avatarUrl : null,
  academyId: previous?.id === user.id ? previous.academyId : null,
  isFirstLogin: previous?.id === user.id ? previous.isFirstLogin : Boolean(user.isFirstLogin),
  welcomeQuoteIndex,
});

const clientPlatform = (): 'ANDROID' | 'IOS' | 'WEB' => {
  if (Platform.OS === 'android') return 'ANDROID';
  if (Platform.OS === 'ios') return 'IOS';
  // Expo Web is used only as a local development harness for the mobile app.
  // Emulating a native platform here exercises the same server-side binding
  // policy; production web builds remain WEB and cannot create mobile users.
  if (isDevelopmentWebDeviceEmulation()) return 'ANDROID';
  return 'WEB';
};

const authRequestHeaders = async () => ({
  'x-client-platform': clientPlatform(),
  ...(Device.deviceName ? { 'x-device-name': Device.deviceName } : {}),
  ...(await nativeDeviceIdentityHeaders()),
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
  academyId: result.activeAcademy?.id ?? null,
  isFirstLogin: previous.isFirstLogin,
  welcomeQuoteIndex: previous.welcomeQuoteIndex,
});

const hydrateStudentBootstrap = async (session: StoredAuthSession): Promise<StoredAuthSession> => {
  const response = await authHttp.get<StudentBootstrapResult>('/student/bootstrap', {
    headers: { Authorization: `Bearer ${session.accessToken}` },
  });
  if (response.data.preference) {
    const profileStore = useLearnerProfileStore.getState();
    profileStore.updateProfile(learnerProfileFromPreference(response.data.preference, profileStore.profile));
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
  const existingUser = previous?.id === result.user.id ? previous : null;
  const welcomeQuoteIndex = existingUser?.welcomeQuoteIndex ?? await nextWelcomeQuoteIndex(result.user.id);
  const session: StoredAuthSession = {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
    accessTokenExpiresAt: Date.now() + result.expiresIn * 1_000,
    user: toAuthUser(result.user, existingUser, welcomeQuoteIndex),
  };
  await writeStoredSession(session);
  useAuthStore.getState().setAuth(session.user, session.accessToken);
  scheduleSessionRefresh(session);
  return session;
};

export async function clearLocalSession(): Promise<void> {
  if (clearPromise) return clearPromise;

  clearPromise = (async () => {
    // Unmount authenticated screens before touching their active observers.
    // Query data is cleared at the next login, when protected screens are not
    // mounted; clearing it here can make active queries subscribe and refetch.
    const auth = useAuthStore.getState();
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    if (auth.status !== 'unauthenticated' || auth.user || auth.accessToken) auth.clear();
    await queryClient.cancelQueries();
    await Promise.allSettled([
      deleteStoredSession(),
      clearUserScopedCache({ clearQueries: false }),
    ]);
  })().finally(() => {
    clearPromise = null;
  });

  return clearPromise;
}

export function refreshSession(): Promise<StoredAuthSession> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const stored = await readStoredSession();
    if (!stored?.refreshToken) {
      await clearLocalSession();
      throw new Error('No refresh credential is available.');
    }

    try {
      const response = await authHttp.post<AuthResult>('/auth/refresh', {
        refreshToken: stored.refreshToken,
      }, {
        headers: await authRequestHeaders(),
      });
      const session = await acceptAuthResult(response.data, stored.user);
      return await hydrateStudentBootstrapWhenAvailable(session);
    } catch (error) {
      // Losing connectivity while refreshing must not sign the learner out.
      // The next protected request can safely retry the same refresh token.
      // Only a definitive server rejection invalidates local credentials.
      const status = isAxiosError(error) ? error.response?.status : undefined;
      if (status === 400 || status === 401 || status === 403) await clearLocalSession();
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

    // Keep protected routes unmounted until the persisted credentials have
    // been validated or refreshed. Publishing an unverified stored token as
    // authenticated causes every student query to fire and fail with 401.
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
      scheduleSessionRefresh(next);
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
      if (isAxiosError(error) && !error.response) {
        // Do not destroy a valid persisted login merely because the app was
        // reopened offline or the network changed. Protected requests will
        // recover through the normal refresh path when connectivity returns.
        useAuthStore.getState().setAuth(stored.user, stored.accessToken);
        scheduleSessionRefresh(stored, REFRESH_RETRY_MS);
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
    headers: await authRequestHeaders(),
  });
  const session = await acceptAuthResult(response.data);
  const hydrated = await hydrateStudentBootstrapWhenAvailable(session);
  return hydrated.user;
}

export async function beginStudentRegistration(input: { fullName: string; phone: string; email: string; password: string; devicePolicyAccepted: true }): Promise<RegistrationChallengeResult> {
  const response = await authHttp.post<RegistrationChallengeResult>('/auth/registrations', input, {
    headers: await authRequestHeaders(),
  });
  return response.data;
}

export async function sendStudentRegistrationOtp(registrationId: string, channel: RegistrationChannel): Promise<RegistrationOtpResult> {
  const response = await authHttp.post<RegistrationOtpResult>(`/auth/registrations/${registrationId}/${channel}/send`, undefined, {
    headers: await authRequestHeaders(),
  });
  return response.data;
}

export async function verifyStudentRegistrationOtp(registrationId: string, channel: RegistrationChannel, code: string): Promise<RegistrationOtpResult> {
  const response = await authHttp.post<RegistrationOtpResult>(`/auth/registrations/${registrationId}/${channel}/verify`, { code }, {
    headers: await authRequestHeaders(),
  });
  return response.data;
}

export async function completeStudentRegistration(registrationId: string, admissionProof?: string): Promise<AuthUser> {
  const response = await authHttp.post<AuthResult>(`/auth/registrations/${registrationId}/complete`, admissionProof ? { admissionProof } : {}, {
    headers: await authRequestHeaders(),
  });
  const session = await acceptAuthResult(response.data);
  const hydrated = await hydrateStudentBootstrapWhenAvailable(session);
  return hydrated.user;
}

export async function validateAcademyQr(qrToken: string): Promise<AcademyAdmissionPreview> {
  const response = await authHttp.post<AcademyAdmissionPreview>('/auth/admissions/qr/validate', { qrToken }, { headers: await authRequestHeaders() });
  return response.data;
}

export async function validateAcademyCode(code: string): Promise<AcademyAdmissionPreview> {
  const response = await authHttp.post<AcademyAdmissionPreview>('/auth/admissions/code/validate', { code }, { headers: await authRequestHeaders() });
  return response.data;
}

export async function claimAcademyQr(qrToken: string) {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error('Sign in before joining an Academy.');
  const response = await authHttp.post('/student/admissions/qr/claim', { qrToken }, { headers: { ...(await authRequestHeaders()), Authorization: `Bearer ${accessToken}` } });
  queryClient.invalidateQueries();
  return response.data;
}

export async function claimAcademyCode(code: string) {
  const accessToken = useAuthStore.getState().accessToken;
  if (!accessToken) throw new Error('Sign in before joining an Academy.');
  const response = await authHttp.post('/student/admissions/codes/claim', { code }, { headers: { ...(await authRequestHeaders()), Authorization: `Bearer ${accessToken}` } });
  queryClient.invalidateQueries();
  return response.data;
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
