
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { isSupabaseInitialized, initializeSupabase } from '@/lib/supabase';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [hasConfig, setHasConfig] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    try {
      console.log('Checking Supabase configuration...');
      
      // Check if Supabase is already initialized
      if (isSupabaseInitialized()) {
        console.log('Supabase already initialized');
        setHasConfig(true);
        setLoading(false);
        return;
      }

      // Try to load config from storage
      const config = await AsyncStorage.getItem('supabase_config');
      console.log('Config from storage:', config ? 'Found' : 'Not found');
      
      if (config) {
        const { url, anonKey } = JSON.parse(config);
        if (url && anonKey) {
          console.log('Initializing Supabase with stored config');
          initializeSupabase(url, anonKey);
          setHasConfig(true);
        } else {
          console.log('Invalid config in storage');
          setHasConfig(false);
        }
      } else {
        console.log('No config found, need setup');
        setHasConfig(false);
      }
    } catch (error) {
      console.error('Error checking configuration:', error);
      setHasConfig(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirect to setup if no config, otherwise to login
  if (!hasConfig) {
    console.log('Redirecting to setup');
    return <Redirect href="/setup" />;
  }

  console.log('Redirecting to login');
  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
