
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These will be set from the app's configuration screen
let supabaseUrl = '';
let supabaseAnonKey = '';

let supabaseClient: ReturnType<typeof createClient> | null = null;

export const initializeSupabase = (url: string, key: string) => {
  console.log('Initializing Supabase client with URL:', url);
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
  
  console.log('Supabase client initialized successfully');
  return supabaseClient;
};

export const getSupabase = () => {
  if (!supabaseClient) {
    console.warn('Supabase client not initialized - call initializeSupabase first');
  }
  return supabaseClient;
};

export const isSupabaseInitialized = () => {
  const initialized = supabaseClient !== null;
  console.log('Supabase initialized:', initialized);
  return initialized;
};
