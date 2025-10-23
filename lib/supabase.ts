
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const SUPABASE_URL = 'https://lgiqpypnhnkylzyhhtze.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaXFweXBuaG5reWx6eWhodHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNzY4NDQsImV4cCI6MjA3Njc1Mjg0NH0.Pn1lAwI7fKllp3D4NjZq9qs18GPRd9sECagwHpu9Fpw';

// Supabase client instance - initialized immediately
const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: false, // We're using PIN auth, not Supabase auth
    detectSessionInUrl: false,
  },
});

console.log('[Supabase] Client initialized with URL:', SUPABASE_URL);

/**
 * Get the Supabase client instance
 */
export const getSupabase = (): SupabaseClient => {
  return supabaseClient;
};

/**
 * Check if Supabase is initialized
 */
export const isSupabaseInitialized = (): boolean => {
  return true;
};

/**
 * Legacy function for compatibility
 */
export const initializeSupabase = (url: string, key: string): SupabaseClient => {
  console.log('[Supabase] initializeSupabase called (using default client)');
  return supabaseClient;
};

/**
 * Reset function (no-op since we use a single instance)
 */
export const resetSupabase = (): void => {
  console.log('[Supabase] resetSupabase called (no-op)');
};
