
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase client instance
let supabaseClient: SupabaseClient | null = null;

/**
 * Initialize the Supabase client with URL and anon key
 */
export const initializeSupabase = (url: string, key: string): SupabaseClient => {
  console.log('[Supabase] Initializing client with URL:', url);
  
  supabaseClient = createClient(url, key, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  
  console.log('[Supabase] Client initialized successfully');
  return supabaseClient;
};

/**
 * Get the current Supabase client instance
 */
export const getSupabase = (): SupabaseClient | null => {
  if (!supabaseClient) {
    console.warn('[Supabase] Client not initialized');
  }
  return supabaseClient;
};

/**
 * Check if Supabase is initialized
 */
export const isSupabaseInitialized = (): boolean => {
  return supabaseClient !== null;
};

/**
 * Reset the Supabase client (useful for reconfiguration)
 */
export const resetSupabase = (): void => {
  console.log('[Supabase] Resetting client');
  supabaseClient = null;
};
