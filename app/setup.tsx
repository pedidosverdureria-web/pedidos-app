
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { initializeSupabase } from '@/lib/supabase';

const SUPABASE_CONFIG_KEY = 'supabase_config';

// Default Supabase credentials for this project
const DEFAULT_URL = 'https://lgiqpypnhnkylzyhhtze.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaXFweXBuaG5reWx6eWhodHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNzY4NDQsImV4cCI6MjA3Njc1Mjg0NH0.Pn1lAwI7fKllp3D4NjZq9qs18GPRd9sECagwHpu9Fpw';

export default function SetupScreen() {
  const [url, setUrl] = useState(DEFAULT_URL);
  const [anonKey, setAnonKey] = useState(DEFAULT_ANON_KEY);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await AsyncStorage.getItem(SUPABASE_CONFIG_KEY);
      if (config) {
        const { url: savedUrl, anonKey: savedKey } = JSON.parse(config);
        setUrl(savedUrl || DEFAULT_URL);
        setAnonKey(savedKey || DEFAULT_ANON_KEY);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!url || !anonKey) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate URL format
    if (!url.startsWith('https://') || !url.includes('.supabase.co')) {
      Alert.alert(
        'Invalid URL',
        'Please enter a valid Supabase URL (e.g., https://your-project.supabase.co)'
      );
      return;
    }

    setLoading(true);
    try {
      // Save configuration
      const config = { url, anonKey };
      await AsyncStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));

      // Initialize Supabase client
      const supabase = initializeSupabase(url, anonKey);

      // Test the connection
      const { error } = await supabase.from('users').select('count').limit(1);
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" which is fine
        console.log('Connection test error:', error);
        // Don't throw, just warn
      }

      Alert.alert(
        'Success',
        'Supabase configured successfully!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Setup error:', error);
      Alert.alert(
        'Connection Error',
        'Failed to connect to Supabase. Please check your URL and API key.\n\n' +
        (error.message || 'Unknown error')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefaults = async () => {
    setUrl(DEFAULT_URL);
    setAnonKey(DEFAULT_ANON_KEY);
    
    // Auto-save with defaults
    setLoading(true);
    try {
      const config = { url: DEFAULT_URL, anonKey: DEFAULT_ANON_KEY };
      await AsyncStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
      initializeSupabase(DEFAULT_URL, DEFAULT_ANON_KEY);
      
      Alert.alert(
        'Success',
        'Default Supabase configuration applied!',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Setup error:', error);
      Alert.alert('Error', 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <IconSymbol name="gear" size={64} color={colors.primary} />
        <Text style={styles.title}>Configure Supabase</Text>
        <Text style={styles.subtitle}>
          Enter your Supabase project credentials to get started
        </Text>
      </View>

      <View style={styles.form}>
        <TouchableOpacity
          style={[styles.quickButton, loading && styles.buttonDisabled]}
          onPress={handleUseDefaults}
          disabled={loading}
        >
          <IconSymbol name="bolt.fill" size={20} color="#FFFFFF" />
          <Text style={styles.quickButtonText}>Use Default Configuration</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or configure manually</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Supabase URL</Text>
          <View style={styles.inputContainer}>
            <IconSymbol name="link" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="https://your-project.supabase.co"
              placeholderTextColor={colors.textSecondary}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Anon Key</Text>
          <View style={styles.inputContainer}>
            <IconSymbol name="key.fill" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              placeholderTextColor={colors.textSecondary}
              value={anonKey}
              onChangeText={setAnonKey}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
              editable={!loading}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Save Configuration</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
          <Text style={styles.infoText}>
            You can find these credentials in your Supabase project settings under API.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  form: {
    width: '100%',
  },
  quickButton: {
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 24,
  },
  quickButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: colors.textSecondary,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 56,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
});
