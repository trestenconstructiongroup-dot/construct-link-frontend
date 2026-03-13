import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const LAST_ACTIVE_KEY = 'last_active_ts';

/** Session inactivity timeout shared across the auth system (4 hours). */
export const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000;

let SecureStore: typeof import('expo-secure-store') | null = null;

if (Platform.OS !== 'web') {
  // Lazy-load expo-secure-store only on native platforms
  SecureStore = require('expo-secure-store');
}

export async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore?.getItemAsync(TOKEN_KEY) ?? null;
}

export async function getStoredUser(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(USER_KEY);
  }
  return SecureStore?.getItemAsync(USER_KEY) ?? null;
}

export async function setStoredToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore?.setItemAsync(TOKEN_KEY, token);
}

export async function setStoredUser(userJson: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(USER_KEY, userJson);
    return;
  }
  await SecureStore?.setItemAsync(USER_KEY, userJson);
}

export async function clearStoredAuth(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(LAST_ACTIVE_KEY);
    return;
  }
  await SecureStore?.deleteItemAsync(TOKEN_KEY);
  await SecureStore?.deleteItemAsync(USER_KEY);
  await SecureStore?.deleteItemAsync(LAST_ACTIVE_KEY);
}

/**
 * Stamps the current time as the last known user activity.
 * Web: synchronous localStorage write.
 * Native: async SecureStore write (fire-and-forget is acceptable).
 */
export function setLastActiveTime(): void {
  const value = String(Date.now());
  if (Platform.OS === 'web') {
    localStorage.setItem(LAST_ACTIVE_KEY, value);
    return;
  }
  SecureStore?.setItemAsync(LAST_ACTIVE_KEY, value);
}

/** Reads the last active timestamp. Returns null if never set. */
export async function getLastActiveTime(): Promise<number | null> {
  let raw: string | null = null;
  if (Platform.OS === 'web') {
    raw = localStorage.getItem(LAST_ACTIVE_KEY);
  } else {
    raw = (await SecureStore?.getItemAsync(LAST_ACTIVE_KEY)) ?? null;
  }
  if (!raw) return null;
  const parsed = Number(raw);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Synchronous read of the last active timestamp — web only.
 * Returns null on native (use getLastActiveTime instead).
 */
export function getLastActiveTimeSync(): number | null {
  if (Platform.OS !== 'web') return null;
  const raw = localStorage.getItem(LAST_ACTIVE_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return isNaN(parsed) ? null : parsed;
}
