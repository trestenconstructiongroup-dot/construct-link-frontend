import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';

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
    return;
  }
  await SecureStore?.deleteItemAsync(TOKEN_KEY);
  await SecureStore?.deleteItemAsync(USER_KEY);
}
