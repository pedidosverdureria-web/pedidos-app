
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These will be set from the app's configuration screen
let supabaseUrl = '';
let supabaseAnonKey = '';

let supabaseClient: ReturnType<typeof createClient> | null = null;

export const initializeSupabase = (url: string, key: string) => {
  console.log('Initializing Supabase client');
  supabaseUrl = url;
  supabaseAnonKey = key;
  
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  
  return supabaseClient;
};

export const getSupabase = () => {
  if (!supabaseClient) {
    console.log('Supabase client not initialized');
  }
  return supabaseClient;
};

export const isSupabaseInitialized = () => {
  return supabaseClient !== null;
};
