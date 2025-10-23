
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { isSupabaseInitialized, initializeSupabase } from '@/lib/supabase';

export default function Index() {
  const router = useRouter();
  const segments = useSegments();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Initializing...');

  useEffect(() => {
    console.log('Index screen mounted, current segments:', segments);
    checkConfigurationAndRedirect();
  }, []);

  const checkConfigurationAndRedirect = async () => {
    try {
      console.log('=== Starting configuration check ===');
      setStatus('Checking configuration...');
      
      // Check if Supabase is already initialized
      if (isSupabaseInitialized()) {
        console.log('✓ Supabase already initialized');
        setStatus('Redirecting to login...');
        setTimeout(() => {
          router.replace('/login');
        }, 100);
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
          setTimeout(() => {
            router.replace('/login');
          }, 100);
        } else {
          console.log('✗ Invalid config in storage');
          setStatus('Redirecting to setup...');
          setTimeout(() => {
            router.replace('/setup');
          }, 100);
        }
      } else {
        console.log('✗ No config found, need setup');
        setStatus('Redirecting to setup...');
        setTimeout(() => {
          router.replace('/setup');
        }, 100);
      }
    } catch (error) {
      console.error('Error checking configuration:', error);
      setStatus('Error occurred, redirecting to setup...');
      setTimeout(() => {
        router.replace('/setup');
      }, 100);
    } finally {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  };

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
