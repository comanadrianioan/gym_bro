import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const WebLocalStorageAdapter = {
  getItem: async (key: string) => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  },
};

export function createSupabaseClient() {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL as string;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: (Platform.OS === 'web' ? WebLocalStorageAdapter : ExpoSecureStoreAdapter) as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}


