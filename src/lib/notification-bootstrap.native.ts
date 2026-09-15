import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { registerPushToken } from '@/lib/notification-api';

const INSTALLATION_KEY = 'pf-push-installation-id';
let handlerConfigured = false;

async function installationId() {
  const stored = await AsyncStorage.getItem(INSTALLATION_KEY);
  if (stored) return stored;
  const value = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
  await AsyncStorage.setItem(INSTALLATION_KEY, value);
  return value;
}

function openNotification(notification: { request: { content: { data?: Record<string, unknown> | null } } }) {
  const url = notification.request.content.data?.url;
  if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')) router.push(url as never);
}

export async function initialiseNotifications() {
  // Remote notifications are intentionally unavailable in Expo Go. Importing
  // expo-notifications there throws before the router can render, so keep the
  // native module completely lazy and enable it only in a project-owned build.
  const runningInExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient' || Constants.expoGoConfig != null;
  if (runningInExpoGo) return () => undefined;

  const Notifications = await import('expo-notifications');
  if (!handlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
    });
    handlerConfigured = true;
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('learning-reminders', { name: 'Learning reminders', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 180, 100, 180], lightColor: '#FFB547' });
  }
  const current = await Notifications.getPermissionsAsync();
  const permission = current.status === 'granted' ? current : await Notifications.requestPermissionsAsync();
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (permission.status === 'granted' && projectId) {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await registerPushToken({ token, platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID', installationId: await installationId(), deviceName: Device.deviceName ?? undefined, appVersion: Constants.expoConfig?.version });
  }
  const received = Notifications.addNotificationResponseReceivedListener((response) => openNotification(response.notification));
  const last = Notifications.getLastNotificationResponse();
  if (last) openNotification(last.notification);
  return () => received.remove();
}
