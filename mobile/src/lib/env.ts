import Constants from 'expo-constants';

const configured = process.env.EXPO_PUBLIC_API_BASE_URL ?? (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? 'http://10.0.2.2:4000/api';
export const API_BASE_URL = configured.replace(/\/$/, '');
