
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile, UserRole } from '@/types';
import { Platform } from 'react-native';
import { 
  registerForPushNotificationsAsync, 
  setupNotificationResponseHandler,
  setupNotificationReceivedHandler 
} from '@/utils/pushNotifications';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';

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
          
          // Register for push notifications if on native platform
          if (Platform.OS !== 'web' && savedUser.user_id) {
            console.log('[Auth] Registering for push notifications...');
            try {
              await registerForPushNotificationsAsync(savedUser.user_id);
              console.log('[Auth] Push notifications registered successfully');
            } catch (error) {
              console.error('[Auth] Error registering push notifications:', error);
            }
          }
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
   * Set up notification handlers
   */
  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    console.log('[Auth] Setting up notification handlers...');

    // Handle notification taps (when user taps on a notification)
    const responseSubscription = setupNotificationResponseHandler((response) => {
      console.log('[Auth] Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      
      // Navigate to order if orderId is present
      if (data?.orderId) {
        console.log('[Auth] Navigating to order:', data.orderId);
        router.push(`/order/${data.orderId}` as any);
      }
    });

    // Handle notifications received while app is in foreground
    const receivedSubscription = setupNotificationReceivedHandler((notification) => {
      console.log('[Auth] Notification received in foreground:', notification);
      
      // The notification will be displayed automatically by the notification handler
      // configured in utils/pushNotifications.ts
    });

    return () => {
      console.log('[Auth] Cleaning up notification handlers...');
      responseSubscription.remove();
      receivedSubscription.remove();
    };
  }, []);

  /**
   * Sign in with PIN
   * Admin PIN: 5050
   * Worker PIN: 5030
   * Printer PIN: 5010
   * Desarrollador PIN: 9032
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
    } else if (pin === '5010') {
      role = 'printer';
      fullName = 'Impresor';
      console.log('[Auth] Printer PIN accepted');
    } else if (pin === '9032') {
      role = 'desarrollador';
      fullName = 'Desarrollador';
      console.log('[Auth] Desarrollador PIN accepted');
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

    // Register for push notifications after successful login
    if (Platform.OS !== 'web') {
      console.log('[Auth] Registering for push notifications...');
      try {
        const token = await registerForPushNotificationsAsync(userProfile.user_id);
        if (token) {
          console.log('[Auth] Push notifications registered successfully');
        } else {
          console.warn('[Auth] Failed to register push notifications');
        }
      } catch (error) {
        console.error('[Auth] Error registering push notifications:', error);
      }
    }
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
