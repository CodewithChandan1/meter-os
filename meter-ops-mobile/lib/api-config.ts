import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Dynamically resolves the API server host IP address for Metro bundler (Expo Go / Physical Device / Simulator)
 */
export function getApiHost(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    try {
      const parsed = new URL(process.env.EXPO_PUBLIC_API_URL);
      return parsed.hostname;
    } catch {
      // ignore parse error
    }
  }

  // Extract Metro bundler host IP dynamically from Expo Constants
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest?.debuggerHost ||
    (Constants as any).manifest2?.extra?.expoGo?.developer?.tool;

  if (hostUri && typeof hostUri === 'string') {
    const ip = hostUri.split(':')[0];
    if (ip && ip !== 'localhost' && ip !== '127.0.0.1' && ip !== '::1') {
      return ip;
    }
  }

  // Fallback to local Mac network IP address for physical mobile device access
  return Platform.OS === 'android' ? '192.168.1.3' : 'localhost';
}

export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }
  const host = getApiHost();
  return `http://${host}:5001/api`;
}

export function getWebSocketUrl(): string {
  const host = getApiHost();
  return `ws://${host}:5001/ws`;
}

/**
 * Fetch wrapper with strict timeout handling to prevent silent hanging or fake auth bypasses
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response;
  } catch (error: any) {
    clearTimeout(timer);
    if (error.name === 'AbortError') {
      throw new Error(`Server connection timed out after ${timeoutMs / 1000} seconds. Please verify server is reachable.`);
    }
    throw new Error(error.message || 'Unable to connect to server. Please check network connection.');
  }
}
