
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, UserRole } from '@/types';
import { Platform } from 'react-native';

const AUTH_STORAGE_KEY = 'auth_user';

interface AuthContextType {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithPin: (pin: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load saved user from AsyncStorage on mount
   */
  useEffect(() => {
    const loadSavedUser = async () => {
      try {
        console.log('[Auth] Loading saved user...');
        const savedUserJson = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        
        if (savedUserJson) {
          const savedUser = JSON.parse(savedUserJson);
          console.log('[Auth] Found saved user:', savedUser.role);
          setUser(savedUser);
        } else {
          console.log('[Auth] No saved user found');
        }
      } catch (error) {
        console.error('[Auth] Error loading saved user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedUser();
  }, []);

  /**
   * Sign in with PIN
   * Admin PIN: 5050
   * Worker PIN: 5030
   */
  const signInWithPin = async (pin: string): Promise<void> => {
    console.log('[Auth] Attempting PIN login');
    
    let role: UserRole;
    let fullName: string;
    
    if (pin === '5050') {
      role = 'admin';
      fullName = 'Administrador';
      console.log('[Auth] Admin PIN accepted');
    } else if (pin === '5030') {
      role = 'worker';
      fullName = 'Trabajador';
      console.log('[Auth] Worker PIN accepted');
    } else {
      console.log('[Auth] Invalid PIN');
      throw new Error('PIN incorrecto');
    }

    // Create user profile
    const userProfile: Profile = {
      id: `${role}-${Date.now()}`,
      user_id: `${role}-${Date.now()}`,
      email: `${role}@local.app`,
      full_name: fullName,
      role,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save to state and AsyncStorage
    setUser(userProfile);
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
    
    console.log('[Auth] Sign in successful');
  };

  /**
   * Sign out current user
   */
  const signOut = async (): Promise<void> => {
    console.log('[Auth] Signing out');
    
    setUser(null);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    
    console.log('[Auth] Sign out successful');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signInWithPin,
        signOut,
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
