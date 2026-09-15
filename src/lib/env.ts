import Constants from 'expo-constants';
import { NativeModules } from 'react-native';

const FALLBACK_API_URL = 'http://10.0.2.2:4000/api';

const isDevelopmentHost = (hostname: string): boolean => (
  hostname === 'localhost'
  || hostname === '127.0.0.1'
  || hostname === '10.0.2.2'
  || hostname.startsWith('10.')
  || hostname.startsWith('192.168.')
  || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
);

const parseHost = (hostUri?: string | null): string | undefined => {
  if (!hostUri) return undefined;
  try {
    const parsed = new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`);
    return parsed.hostname || undefined;
  } catch {
    return undefined;
  }
};

/**
 * Expo embeds the active Metro host in the development manifest. On a real
 * phone that host is the computer's current LAN address, so using it avoids
 * baking a Wi-Fi-specific IP into the app's .env file.
 */
const metroHost = (): string | undefined => {
  const expoGoConfig = Constants.expoGoConfig as ({ debuggerHost?: string } | null);
  const sourceCode = NativeModules.SourceCode as ({ scriptURL?: string } | undefined);
  return parseHost(sourceCode?.scriptURL)
    ?? parseHost(Constants.expoConfig?.hostUri)
    ?? parseHost(Constants.linkingUri)
    ?? parseHost(Constants.experienceUrl)
    ?? parseHost(expoGoConfig?.debuggerHost);
};

const resolveDevelopmentUrl = (configuredUrl: string, targetPort: number, defaultPath = ''): string => {
  const normalized = configuredUrl.replace(/\/$/, '');
  if (!__DEV__) return normalized;

  try {
    const configured = new URL(normalized);
    const discoveredHost = metroHost();
    if (!discoveredHost || !isDevelopmentHost(discoveredHost) || !isDevelopmentHost(configured.hostname)) {
      return normalized;
    }

    const path = configured.pathname === '/' ? defaultPath : configured.pathname;
    return `${configured.protocol}//${discoveredHost}:${targetPort}${path}`.replace(/\/$/, '');
  } catch {
    return normalized;
  }
};

const configuredApi = process.env.EXPO_PUBLIC_API_BASE_URL
  ?? (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined)
  ?? FALLBACK_API_URL;

export const API_BASE_URL = resolveDevelopmentUrl(configuredApi, 4000, '/api');

const configuredStore = process.env.EXPO_PUBLIC_STORE_BASE_URL
  ?? API_BASE_URL.replace(/:4000\/api$/, ':5173').replace(/\/api$/, '');

export const STORE_BASE_URL = resolveDevelopmentUrl(configuredStore, 5173);

export const API_CONNECTION_HINT = __DEV__ ? API_BASE_URL : undefined;
