
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { isSupabaseInitialized, initializeSupabase } from '@/lib/supabase';

const SUPABASE_CONFIG_KEY = 'supabase_config';

export default function Index() {
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    // Wait for navigation to be ready
    if (!rootNavigationState?.key) {
      console.log('[Index] Waiting for navigation...');
      return;
    }

    console.log('[Index] Navigation ready, checking configuration');

    const checkAndRedirect = async () => {
      try {
        // Check if Supabase is already initialized
        if (isSupabaseInitialized()) {
          console.log('[Index] Supabase already initialized → login');
          setStatus('Redirecting to login...');
          router.replace('/login');
          return;
        }

        // Try to load saved configuration
        setStatus('Loading configuration...');
        const configJson = await AsyncStorage.getItem(SUPABASE_CONFIG_KEY);
        
        if (configJson) {
          const config = JSON.parse(configJson);
          
          if (config.url && config.anonKey) {
            console.log('[Index] Found saved config, initializing Supabase');
            setStatus('Initializing Supabase...');
            initializeSupabase(config.url, config.anonKey);
            setStatus('Redirecting to login...');
            router.replace('/login');
            return;
          }
        }

        // No valid config found
        console.log('[Index] No valid config → setup');
        setStatus('Redirecting to setup...');
        router.replace('/setup');
      } catch (error) {
        console.error('[Index] Error during initialization:', error);
        setStatus('Error - redirecting to setup...');
        router.replace('/setup');
      }
    };

    checkAndRedirect();
  }, [rootNavigationState, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  statusText: {
    marginTop: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
