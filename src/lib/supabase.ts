import { createClient, processLock } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  supabaseUrl?: string;
  supabasePublishableKey?: string;
};

// Only the public (publishable) key lives in the app. It is safe to ship
// because row-level security on every table decides what each user can see.
const SUPABASE_URL = extra.supabaseUrl ?? '';
const SUPABASE_PUBLISHABLE_KEY = extra.supabasePublishableKey ?? '';

/**
 * Keeps the sign-in session in the phone's encrypted keychain/keystore
 * instead of plain storage. SecureStore values should stay small, so long
 * values are split into chunks.
 */
const CHUNK = 1800;
const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const count = await SecureStore.getItemAsync(`${key}.n`);
    if (!count) return null;
    const parts: string[] = [];
    for (let i = 0; i < Number(count); i++) {
      const part = await SecureStore.getItemAsync(`${key}.${i}`);
      if (part == null) return null;
      parts.push(part);
    }
    return parts.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    await secureSessionStorage.removeItem(key);
    const n = Math.ceil(value.length / CHUNK);
    for (let i = 0; i < n; i++) {
      await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK, (i + 1) * CHUNK));
    }
    await SecureStore.setItemAsync(`${key}.n`, String(n));
  },
  async removeItem(key: string): Promise<void> {
    const count = await SecureStore.getItemAsync(`${key}.n`);
    if (count) {
      for (let i = 0; i < Number(count); i++) {
        await SecureStore.deleteItemAsync(`${key}.${i}`);
      }
    }
    await SecureStore.deleteItemAsync(`${key}.n`);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : secureSessionStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

// Refresh the session only while the app is open.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

/** Turns a Supabase / Postgres error into a short message for the user. */
export function friendlyError(err: unknown): string {
  const msg =
    typeof err === 'object' && err && 'message' in err
      ? String((err as { message: unknown }).message)
      : String(err);
  if (/network|fetch/i.test(msg)) return 'No internet connection. Please try again.';
  if (/expired|invalid.*(otp|token)/i.test(msg)) return 'That code is wrong or has expired. Request a new one.';
  if (/rate limit|too many/i.test(msg)) return 'Too many tries. Please wait a few minutes and try again.';
  if (/row-level security|permission denied/i.test(msg)) return 'You can’t do that.';
  return msg.length > 160 ? 'Something went wrong. Please try again.' : msg;
}
