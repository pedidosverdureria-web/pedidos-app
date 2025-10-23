import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://lgiqpypnhnkylzyhhtze.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaXFweXBuaG5reWx6eWhodHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNzY4NDQsImV4cCI6MjA3Njc1Mjg0NH0.Pn1lAwI7fKllp3D4NjZq9qs18GPRd9sECagwHpu9Fpw";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
