import { api } from '@/lib/api';

export type NotificationPreferences = {
  pushEnabled: boolean;
  broadcastEnabled: boolean;
  dailyPlanEnabled: boolean;
  streakRiskEnabled: boolean;
  securityEnabled: boolean;
  accountEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
};

export type LearnerNotification = {
  id: string;
  category: 'BROADCAST' | 'DAILY_PLAN' | 'STREAK_RISK' | 'SECURITY' | 'ACCOUNT' | string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  scheduledFor: string;
  readAt: string | null;
  createdAt: string;
};

export type LearnerNotificationFeed = {
  data: LearnerNotification[];
  pagination: { page: number; limit: number; total: number; totalPages: number; unreadOnly: boolean };
};

export async function getNotificationPreferences() {
  return (await api.get<NotificationPreferences>('/student/notifications/preferences')).data;
}

export async function updateNotificationPreferences(input: Partial<NotificationPreferences>) {
  return (await api.patch<NotificationPreferences>('/student/notifications/preferences', input)).data;
}

export async function registerPushToken(input: { token: string; platform: 'ANDROID' | 'IOS'; installationId: string; deviceName?: string; appVersion?: string }) {
  return (await api.post('/student/notifications/push-tokens', input)).data;
}

export async function getNotificationFeed(input: { limit?: number; unreadOnly?: boolean } = {}) {
  return (await api.get<LearnerNotificationFeed>('/student/notifications/feed', {
    params: { page: 1, limit: input.limit ?? 10, unreadOnly: String(input.unreadOnly ?? true) },
  })).data;
}

export async function markNotificationRead(notificationId: string) {
  return (await api.patch<LearnerNotification>(`/student/notifications/feed/${encodeURIComponent(notificationId)}/read`)).data;
}
