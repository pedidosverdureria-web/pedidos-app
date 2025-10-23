
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

  const loadUser = async (authUser: User) => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error) {
        console.error('Error loading user profile:', error);
        return;
      }

      setUser(data);

      // Register for push notifications (only on native platforms)
      if (data?.user_id && Platform.OS !== 'web') {
        registerForPushNotificationsAsync(data.user_id).catch((error) => {
          console.error('Error registering for push notifications:', error);
        });
      }
    } catch (error) {
      console.error('Error in loadUser:', error);
    }
  };

  const refreshUser = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      await loadUser(currentSession.user);
    }
  };

  useEffect(() => {
    const supabase = getSupabase();
    
    // If Supabase is not initialized yet, wait
    if (!supabase) {
      console.log('Waiting for Supabase initialization...');
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('Initial session loaded:', currentSession ? 'Session exists' : 'No session');
      setSession(currentSession);
      if (currentSession?.user) {
        loadUser(currentSession.user);
      }
      setIsLoading(false);
    }).catch((error) => {
      console.error('Error getting initial session:', error);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        console.log('Auth state changed:', _event);
        setSession(currentSession);
        if (currentSession?.user) {
          await loadUser(currentSession.user);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase no está inicializado. Por favor configura tu conexión primero.');
    }

    console.log('Attempting sign in for:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }

    console.log('Sign in successful:', data.user?.email);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase no está inicializado. Por favor configura tu conexión primero.');
    }

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

    if (error) throw error;

    // Create profile
    if (data.user) {
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
        console.error('Error creating profile:', profileError);
      }
    }
  };

  const signOut = async () => {
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase no está inicializado');
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!session,
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
