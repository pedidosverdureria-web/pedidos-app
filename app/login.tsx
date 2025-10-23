
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors, commonStyles } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';
import { isSupabaseInitialized } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, isAuthenticated, session } = useAuth();

  useEffect(() => {
    console.log('LoginScreen: Mounted, checking initialization');
    // Check if Supabase is initialized
    if (!isSupabaseInitialized()) {
      console.log('LoginScreen: Supabase not initialized, redirecting to setup');
      Alert.alert(
        'Configuración requerida',
        'Por favor configura tu conexión a Supabase primero',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/setup')
          }
        ]
      );
      return;
    }
  }, []);

  useEffect(() => {
    // If already authenticated, go to home
    // Only redirect if not currently loading (to avoid conflicts with manual navigation)
    if (isAuthenticated && session && !loading) {
      console.log('LoginScreen: User is authenticated, redirecting to home');
      router.replace('/(tabs)/(home)/');
    }
  }, [isAuthenticated, session, loading]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Por favor ingresa un email válido');
      return;
    }

    setLoading(true);
    try {
      console.log('LoginScreen: Attempting login for:', email);
      await signIn(email, password);
      console.log('LoginScreen: Login successful');
      
      // Don't show alert, just navigate directly
      // The auth state change will trigger the useEffect above
      console.log('LoginScreen: Navigating to home after successful login');
      router.replace('/(tabs)/(home)/');
    } catch (error: any) {
      console.error('LoginScreen: Login error:', error);
      
      // Show user-friendly error messages
      let errorMessage = 'Error al iniciar sesión';
      let errorTitle = 'Error de inicio de sesión';
      
      if (error.message) {
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Email o contraseña incorrectos. Por favor verifica tus credenciales.';
        } else if (error.message.includes('Email not confirmed')) {
          errorTitle = 'Email no confirmado';
          errorMessage = 'Por favor verifica tu email antes de iniciar sesión. Revisa tu bandeja de entrada y spam.';
        } else if (error.message.includes('Database error')) {
          errorMessage = 'Error de base de datos. Por favor intenta de nuevo más tarde.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'Usuario no encontrado. ¿Necesitas registrarte?';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Demasiados intentos. Por favor espera un momento antes de intentar de nuevo.';
        } else if (error.message.includes('Supabase no está inicializado') || error.message.includes('not initialized')) {
          errorTitle = 'Configuración requerida';
          errorMessage = 'Por favor configura tu conexión a Supabase primero.';
          Alert.alert(errorTitle, errorMessage, [
            {
              text: 'Configurar',
              onPress: () => router.replace('/setup')
            }
          ]);
          return;
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Error de conexión. Por favor verifica tu conexión a internet.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('rhenriquez@admin.local');
    setPassword('rhb9032');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <IconSymbol name="cart.fill" size={64} color={colors.primary} />
          <Text style={styles.title}>Order Manager</Text>
          <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
        </View>

        {/* Admin Credentials Info Box */}
        <TouchableOpacity 
          style={styles.infoBox}
          onPress={fillAdminCredentials}
          activeOpacity={0.7}
        >
          <View style={styles.infoHeader}>
            <IconSymbol name="info.circle.fill" size={20} color={colors.primary} />
            <Text style={styles.infoTitle}>Credenciales de Admin</Text>
          </View>
          <Text style={styles.infoText}>Email: rhenriquez@admin.local</Text>
          <Text style={styles.infoText}>Password: rhb9032</Text>
          <Text style={styles.infoHint}>Toca para auto-completar</Text>
        </TouchableOpacity>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <IconSymbol name="envelope.fill" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <IconSymbol name="lock.fill" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/register')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              ¿No tienes cuenta? <Text style={styles.linkTextBold}>Regístrate</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/setup')}
            disabled={loading}
          >
            <Text style={styles.linkText}>
              <Text style={styles.linkTextBold}>Reconfigurar Supabase</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  infoBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.primary + '40',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  infoHint: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textSecondary,
  },
  linkTextBold: {
    color: colors.primary,
    fontWeight: '600',
  },
});
