
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

  useEffect(() => {
    console.log('AuthProvider: Initializing');
    checkUser();
    
    const supabase = getSupabase();
    if (supabase) {
      console.log('AuthProvider: Setting up auth listener');
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('AuthProvider: Auth state changed:', event);
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

      const { data: { session } } = await supabase.auth.getSession();
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
    try {
      console.log('AuthProvider: Fetching user profile for:', userId);
      const supabase = getSupabase();
      if (!supabase) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('AuthProvider: Error fetching user profile:', error);
        // If profile doesn't exist, create a basic user object
        setUser({
          id: userId,
          email: '',
          full_name: '',
          role: 'worker',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        return;
      }
      
      console.log('AuthProvider: User profile fetched successfully');
      setUser(data);
    } catch (error) {
      console.error('AuthProvider: Error fetching user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: Signing in user');
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('AuthProvider: Sign in error:', error);
      throw error;
    }
    
    console.log('AuthProvider: Sign in successful');
    if (data.user) {
      await fetchUserProfile(data.user.id);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('AuthProvider: Signing up new user');
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase not initialized');

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
