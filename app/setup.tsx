
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/styles/commonStyles';
import { initializeSupabase, resetSupabase } from '@/lib/supabase';

const SUPABASE_CONFIG_KEY = 'supabase_config';
const DEFAULT_URL = 'https://lgiqpypnhnkylzyhhtze.supabase.co';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxnaXFweXBuaG5reWx6eWhodHplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0OTI3NTksImV4cCI6MjA1MzA2ODc1OX0.Ej0Uj-Zt5Ub8Hn-Tz_Iq_Tz_Iq_Tz_Iq_Tz_Iq_Tz_Iq_Tz_Iq';

export default function SetupScreen() {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const configJson = await AsyncStorage.getItem(SUPABASE_CONFIG_KEY);
      if (configJson) {
        const config = JSON.parse(configJson);
        setUrl(config.url || '');
        setAnonKey(config.anonKey || '');
      }
    } catch (error) {
      console.error('[Setup] Error loading config:', error);
    } finally {
      setInitializing(false);
    }
  };

  const handleSave = async () => {
    if (!url || !anonKey) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      Alert.alert('Error', 'URL inválida. Debe ser una URL completa (ej: https://xxx.supabase.co)');
      return;
    }

    setLoading(true);

    try {
      console.log('[Setup] Saving configuration');
      
      // Save to AsyncStorage
      const config = { url, anonKey };
      await AsyncStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
      
      // Reset and initialize Supabase
      resetSupabase();
      initializeSupabase(url, anonKey);
      
      console.log('[Setup] Configuration saved successfully');
      
      Alert.alert(
        'Configuración guardada',
        'Tu conexión a Supabase ha sido configurada correctamente',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login')
          }
        ]
      );
    } catch (error: any) {
      console.error('[Setup] Error saving config:', error);
      Alert.alert('Error', error.message || 'Error al guardar la configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefaults = () => {
    setUrl(DEFAULT_URL);
    setAnonKey(DEFAULT_ANON_KEY);
  };

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <IconSymbol name="gear" size={64} color={colors.primary} />
        <Text style={styles.title}>Configuración de Supabase</Text>
        <Text style={styles.subtitle}>
          Configura tu conexión a Supabase para comenzar
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>URL de Supabase</Text>
        <TextInput
          style={styles.input}
          placeholder="https://xxx.supabase.co"
          placeholderTextColor={colors.textSecondary}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />

        <Text style={styles.label}>Anon Key</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
          placeholderTextColor={colors.textSecondary}
          value={anonKey}
          onChangeText={setAnonKey}
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          numberOfLines={4}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Guardar Configuración</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleUseDefaults}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>Usar Valores por Defecto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
        <Text style={styles.infoText}>
          Puedes encontrar estos valores en tu panel de Supabase en Settings → API
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
    marginTop: 40,
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
  form: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 12,
    lineHeight: 20,
  },
});
