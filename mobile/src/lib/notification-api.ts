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

export async function getNotificationPreferences() {
  return (await api.get<NotificationPreferences>('/student/notifications/preferences')).data;
}

export async function updateNotificationPreferences(input: Partial<NotificationPreferences>) {
  return (await api.patch<NotificationPreferences>('/student/notifications/preferences', input)).data;
}

export async function registerPushToken(input: { token: string; platform: 'ANDROID' | 'IOS'; installationId: string; deviceName?: string; appVersion?: string }) {
  return (await api.post('/student/notifications/push-tokens', input)).data;
}
