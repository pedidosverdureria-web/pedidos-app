
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/styles/commonStyles';
import { useAuth } from '@/contexts/AuthContext';
import { IconSymbol } from '@/components/IconSymbol';

export default function LoginScreen() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithPin, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.log('[Login] User authenticated, redirecting to home');
      router.replace('/(tabs)/(home)/');
    }
  }, [isAuthenticated, authLoading]);

  const handleLogin = async () => {
    // Validate PIN
    if (!pin) {
      Alert.alert('Error', 'Por favor ingresa tu PIN');
      return;
    }

    if (pin.length !== 4) {
      Alert.alert('Error', 'El PIN debe tener 4 dígitos');
      return;
    }

    setLoading(true);

    try {
      console.log('[Login] Attempting PIN login');
      await signInWithPin(pin);
      console.log('[Login] Login successful');
      
      // Navigation will happen automatically via useEffect when isAuthenticated becomes true
      // Set loading to false after a short delay to allow state to update
      setTimeout(() => {
        setLoading(false);
      }, 100);
    } catch (error: any) {
      console.error('[Login] Login error:', error);
      setLoading(false);
      
      // Parse error message
      let errorMessage = 'PIN incorrecto';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Error de inicio de sesión', errorMessage);
      setPin(''); // Clear PIN on error
    }
  };

  const handlePinChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    // Limit to 4 digits
    if (numericText.length <= 4) {
      setPin(numericText);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <IconSymbol name="lock.shield.fill" size={80} color={colors.primary} />
          <Text style={styles.title}>Order Manager</Text>
          <Text style={styles.subtitle}>Ingresa tu PIN para continuar</Text>
        </View>

        <View style={styles.form}>
          {/* PIN Display */}
          <View style={styles.pinDisplay}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.pinDot,
                  pin.length > index && styles.pinDotFilled,
                ]}
              >
                {pin.length > index && (
                  <Text style={styles.pinDotText}>{pin[index]}</Text>
                )}
              </View>
            ))}
          </View>

          {/* PIN Input */}
          <TextInput
            style={styles.hiddenInput}
            value={pin}
            onChangeText={handlePinChange}
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry={false}
            autoFocus
            editable={!loading}
            placeholder="Ingresa PIN"
            placeholderTextColor={colors.textSecondary}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading || pin.length !== 4}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.loadingText}>Verificando...</Text>
              </View>
            ) : (
              <>
                <IconSymbol name="arrow.right.circle.fill" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Ingresar</Text>
              </>
            )}
          </TouchableOpacity>

          {pin.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setPin('')}
              disabled={loading}
            >
              <Text style={styles.clearButtonText}>Limpiar PIN</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.footer}>
          <IconSymbol name="lock.fill" size={16} color={colors.textSecondary} />
          <Text style={styles.footerText}>Aplicación de uso privado</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
    textAlign: 'center',
  },
  form: {
    width: '100%',
    alignItems: 'center',
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  pinDot: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDotFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  pinDotText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  hiddenInput: {
    width: '100%',
    height: 56,
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 18,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
    textAlign: 'center',
    letterSpacing: 8,
    fontWeight: '600',
    marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    marginTop: 16,
    paddingVertical: 12,
  },
  clearButtonText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    gap: 8,
  },
  footerText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
});
