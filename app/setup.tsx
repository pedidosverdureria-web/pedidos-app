
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
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeSupabase } from '@/lib/supabase';

const SUPABASE_CONFIG_KEY = 'supabase_config';

export default function SetupScreen() {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const config = await AsyncStorage.getItem(SUPABASE_CONFIG_KEY);
      if (config) {
        const { url: savedUrl, anonKey: savedKey } = JSON.parse(config);
        setUrl(savedUrl);
        setAnonKey(savedKey);
        initializeSupabase(savedUrl, savedKey);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleSave = async () => {
    if (!url || !anonKey) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!url.startsWith('https://')) {
      Alert.alert('Error', 'URL must start with https://');
      return;
    }

    setLoading(true);
    try {
      const config = { url, anonKey };
      await AsyncStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
      initializeSupabase(url, anonKey);
      
      Alert.alert(
        'Success',
        'Supabase configuration saved! You can now sign in.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  if (loadingConfig) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <IconSymbol name="gear.circle.fill" size={64} color={colors.primary} />
        <Text style={styles.title}>Supabase Setup</Text>
        <Text style={styles.subtitle}>Configure your Supabase connection</Text>
      </View>

      <View style={styles.infoBox}>
        <IconSymbol name="info.circle.fill" size={24} color={colors.info} />
        <Text style={styles.infoText}>
          You need a Supabase project to use this app. Visit supabase.com to create one.
        </Text>
      </View>

      <View style={styles.form}>
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
            editable={!loading}
          />
        </View>

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
            multiline
            editable={!loading}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Save Configuration</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.linkText}>Back to Login</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.instructionsBox}>
        <Text style={styles.instructionsTitle}>Setup Instructions:</Text>
        <Text style={styles.instructionsText}>
          1. Go to your Supabase project dashboard{'\n'}
          2. Click on Settings → API{'\n'}
          3. Copy the Project URL and paste it above{'\n'}
          4. Copy the anon/public key and paste it above{'\n'}
          5. Click Save Configuration
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 24,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  form: {
    width: '100%',
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 14,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  instructionsBox: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
