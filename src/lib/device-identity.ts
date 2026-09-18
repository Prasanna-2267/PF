import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'parallax.device-id.v1';
const DEVICE_SECRET_KEY = 'parallax.device-secret.v1';
let identityPromise: Promise<{ deviceId: string; deviceSecret: string }> | null = null;

async function secureHex(bytes: number): Promise<string> {
  const values = await Crypto.getRandomBytesAsync(bytes);
  return Array.from(values, (value) => value.toString(16).padStart(2, '0')).join('');
}

async function loadOrCreateIdentity() {
  const isDevelopmentWeb = isDevelopmentWebDeviceEmulation();
  const [storedId, storedSecret] = isDevelopmentWeb
    ? await Promise.all([
        AsyncStorage.getItem(DEVICE_ID_KEY),
        AsyncStorage.getItem(DEVICE_SECRET_KEY),
      ])
    : await Promise.all([
        SecureStore.getItemAsync(DEVICE_ID_KEY),
        SecureStore.getItemAsync(DEVICE_SECRET_KEY),
      ]);
  if (storedId && storedSecret) return { deviceId: storedId, deviceSecret: storedSecret };

  const deviceId = await secureHex(24);
  const deviceSecret = await secureHex(48);
  if (isDevelopmentWeb) {
    await AsyncStorage.multiSet([
      [DEVICE_ID_KEY, deviceId],
      [DEVICE_SECRET_KEY, deviceSecret],
    ]);
  } else {
    await Promise.all([
      SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }),
      SecureStore.setItemAsync(DEVICE_SECRET_KEY, deviceSecret, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY }),
    ]);
  }
  return { deviceId, deviceSecret };
}

export const isDevelopmentWebDeviceEmulation = (): boolean => Platform.OS === 'web' && __DEV__;

export async function nativeDeviceIdentityHeaders(): Promise<Record<string, string>> {
  const isNative = Platform.OS === 'android' || Platform.OS === 'ios';
  if (!isNative && !isDevelopmentWebDeviceEmulation()) return {};
  identityPromise ??= loadOrCreateIdentity();
  const identity = await identityPromise;
  return { 'x-device-id': identity.deviceId, 'x-device-secret': identity.deviceSecret };
}
