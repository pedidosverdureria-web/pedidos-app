
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  session: any;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchingProfile, setFetchingProfile] = useState(false);

  useEffect(() => {
    console.log('AuthProvider: Initializing');
    checkUser();
    
    const supabase = getSupabase();
    if (supabase) {
      console.log('AuthProvider: Setting up auth listener');
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('AuthProvider: Auth state changed:', event, 'Session:', session ? 'exists' : 'null');
          setSession(session);
          if (session?.user) {
            await fetchUserProfile(session.user.id);
          } else {
            setUser(null);
          }
        }
      );

      return () => {
        console.log('AuthProvider: Cleaning up auth listener');
        authListener?.subscription.unsubscribe();
      };
    } else {
      console.log('AuthProvider: Supabase not initialized yet');
      setLoading(false);
    }
  }, []);

  const checkUser = async () => {
    try {
      console.log('AuthProvider: Checking current user');
      const supabase = getSupabase();
      if (!supabase) {
        console.log('AuthProvider: Supabase not initialized in checkUser');
        setLoading(false);
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('AuthProvider: Error getting session:', error);
        setLoading(false);
        return;
      }
      
      console.log('AuthProvider: Current session:', session ? 'Found' : 'Not found');
      setSession(session);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('AuthProvider: Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    // Prevent concurrent profile fetches
    if (fetchingProfile) {
      console.log('AuthProvider: Profile fetch already in progress, skipping');
      return;
    }

    setFetchingProfile(true);
    
    try {
      console.log('AuthProvider: Fetching user profile for:', userId);
      const supabase = getSupabase();
      if (!supabase) {
        console.error('AuthProvider: Supabase not initialized in fetchUserProfile');
        return;
      }

      // Set a timeout to prevent infinite waiting
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
      );

      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data, error } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;

      if (error) {
        console.error('AuthProvider: Error fetching user profile:', error);
        
        // Check if it's an RLS policy error
        if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
          console.error('AuthProvider: RLS policy recursion detected. Please check database policies.');
        }
        
        // If profile doesn't exist, try to get basic info from auth.users
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user) {
          console.log('AuthProvider: Creating fallback user object');
          setUser({
            id: userId,
            email: authData.user.email || '',
            full_name: authData.user.user_metadata?.full_name || '',
            role: 'worker',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
        return;
      }
      
      console.log('AuthProvider: User profile fetched successfully:', data.email, 'Role:', data.role);
      
      // Map profiles table to User type
      setUser({
        id: data.id,
        email: data.email,
        full_name: data.full_name || '',
        role: data.role,
        is_active: data.is_active,
        created_at: data.created_at,
        updated_at: data.updated_at,
      });
    } catch (error: any) {
      console.error('AuthProvider: Error fetching user profile:', error);
      
      // If timeout or recursion error, create a fallback user
      if (error.message?.includes('timeout') || error.message?.includes('recursion')) {
        console.log('AuthProvider: Creating fallback user due to error');
        const supabase = getSupabase();
        if (supabase) {
          const { data: authData } = await supabase.auth.getUser();
          if (authData?.user) {
            setUser({
              id: userId,
              email: authData.user.email || '',
              full_name: authData.user.user_metadata?.full_name || '',
              role: 'worker',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      }
    } finally {
      setFetchingProfile(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: Attempting sign in for:', email);
    const supabase = getSupabase();
    if (!supabase) {
      const error = new Error('Supabase no está inicializado. Por favor configura Supabase primero.');
      console.error('AuthProvider:', error.message);
      throw error;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('AuthProvider: Sign in error:', error.message, 'Status:', error.status);
        throw error;
      }
      
      if (!data.session) {
        console.error('AuthProvider: No session returned after sign in');
        throw new Error('No se pudo crear la sesión. Por favor intenta de nuevo.');
      }

      console.log('AuthProvider: Sign in successful, session created');
      setSession(data.session);
      
      if (data.user) {
        console.log('AuthProvider: Fetching user profile after sign in');
        await fetchUserProfile(data.user.id);
      }
    } catch (error: any) {
      console.error('AuthProvider: Sign in failed:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('AuthProvider: Signing up new user:', email);
    const supabase = getSupabase();
    if (!supabase) {
      throw new Error('Supabase no está inicializado');
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

    if (error) {
      console.error('AuthProvider: Sign up error:', error);
      throw error;
    }
    
    console.log('AuthProvider: Sign up successful');
  };

  const signOut = async () => {
    console.log('AuthProvider: Signing out user');
    const supabase = getSupabase();
    if (!supabase) return;

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    console.log('AuthProvider: Sign out successful');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
