
import React, { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { isSupabaseInitialized, initializeSupabase } from '@/lib/supabase';

export default function Index() {
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Initializing...');
  const [navigationReady, setNavigationReady] = useState(false);

  // Wait for navigation to be ready
  useEffect(() => {
    if (rootNavigationState?.key) {
      console.log('Root navigation is ready');
      setNavigationReady(true);
    }
  }, [rootNavigationState]);

  const checkConfigurationAndRedirect = useCallback(async () => {
    // Don't navigate until root navigation is ready
    if (!navigationReady) {
      console.log('Waiting for navigation to be ready...');
      return;
    }

    try {
      console.log('=== Starting configuration check ===');
      setStatus('Checking configuration...');
      
      // Check if Supabase is already initialized
      if (isSupabaseInitialized()) {
        console.log('✓ Supabase already initialized');
        setStatus('Redirecting to login...');
        router.replace('/login');
        return;
      }

      // Try to load config from storage
      setStatus('Loading saved configuration...');
      const config = await AsyncStorage.getItem('supabase_config');
      console.log('Config from storage:', config ? '✓ Found' : '✗ Not found');
      
      if (config) {
        const { url, anonKey } = JSON.parse(config);
        if (url && anonKey) {
          console.log('✓ Valid config found, initializing Supabase');
          setStatus('Initializing Supabase...');
          initializeSupabase(url, anonKey);
          setStatus('Redirecting to login...');
          router.replace('/login');
        } else {
          console.log('✗ Invalid config in storage');
          setStatus('Redirecting to setup...');
          router.replace('/setup');
        }
      } else {
        console.log('✗ No config found, need setup');
        setStatus('Redirecting to setup...');
        router.replace('/setup');
      }
    } catch (error) {
      console.error('Error checking configuration:', error);
      setStatus('Error occurred, redirecting to setup...');
      router.replace('/setup');
    } finally {
      setLoading(false);
    }
  }, [router, navigationReady]);

  useEffect(() => {
    console.log('Index screen mounted, current segments:', segments);
    checkConfigurationAndRedirect();
  }, [checkConfigurationAndRedirect, segments]);

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
