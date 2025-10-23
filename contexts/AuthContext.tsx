
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { getSupabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { registerForPushNotificationsAsync } from '@/utils/pushNotifications';
import { Platform } from 'react-native';

interface AuthContextType {
  user: Profile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load user profile from database
   */
  const loadUserProfile = async (authUser: User): Promise<void> => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        console.error('[Auth] Supabase client not initialized');
        return;
      }

      console.log('[Auth] Loading profile for user:', authUser.email);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error) {
        console.error('[Auth] Error loading profile:', error);
        return;
      }

      if (data) {
        console.log('[Auth] Profile loaded successfully:', data.email);
        setUser(data);

        // Register for push notifications on native platforms
        if (Platform.OS !== 'web') {
          registerForPushNotificationsAsync(data.user_id).catch((err) => {
            console.error('[Auth] Error registering for push notifications:', err);
          });
        }
      }
    } catch (error) {
      console.error('[Auth] Exception in loadUserProfile:', error);
    }
  };

  /**
   * Refresh user profile from database
   */
  const refreshUser = async (): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) {
      console.error('[Auth] Cannot refresh user - Supabase not initialized');
      return;
    }

    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      await loadUserProfile(currentSession.user);
    }
  };

  /**
   * Initialize auth state and listen for changes
   */
  useEffect(() => {
    const supabase = getSupabase();
    
    if (!supabase) {
      console.log('[Auth] Supabase not initialized, skipping auth setup');
      setIsLoading(false);
      return;
    }

    console.log('[Auth] Setting up authentication');

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting initial session:', error);
          setIsLoading(false);
          return;
        }

        console.log('[Auth] Initial session:', currentSession ? 'Found' : 'None');
        
        if (currentSession) {
          setSession(currentSession);
          await loadUserProfile(currentSession.user);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('[Auth] Exception during auth initialization:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[Auth] State changed:', event);
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          await loadUserProfile(currentSession.user);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      console.log('[Auth] Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Sign in with email and password
   */
  const signIn = async (email: string, password: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase no está inicializado. Por favor configura tu conexión primero.');
    }

    console.log('[Auth] Signing in:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] Sign in error:', error.message);
      throw error;
    }

    console.log('[Auth] Sign in successful');
    
    // Session and user will be updated by onAuthStateChange listener
  };

  /**
   * Sign up with email, password, and full name
   */
  const signUp = async (email: string, password: string, fullName: string): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase no está inicializado. Por favor configura tu conexión primero.');
    }

    console.log('[Auth] Signing up:', email);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://natively.dev/email-confirmed',
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error('[Auth] Sign up error:', error.message);
      throw error;
    }

    // Create profile
    if (data.user) {
      console.log('[Auth] Creating profile for new user');
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          user_id: data.user.id,
          email,
          full_name: fullName,
          role: 'worker',
          is_active: true,
        },
      ]);

      if (profileError) {
        console.error('[Auth] Error creating profile:', profileError);
      }
    }

    console.log('[Auth] Sign up successful');
  };

  /**
   * Sign out current user
   */
  const signOut = async (): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase no está inicializado');
    }

    console.log('[Auth] Signing out');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[Auth] Sign out error:', error.message);
      throw error;
    }
    
    setUser(null);
    setSession(null);
    
    console.log('[Auth] Sign out successful');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!session && !!user,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
