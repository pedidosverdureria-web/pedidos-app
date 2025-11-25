
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/IconSymbol';
import { CustomDialog, DialogButton } from '@/components/CustomDialog';

interface DialogState {
  visible: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: DialogButton[];
}

/**
 * Login Screen Component
 * 
 * CRITICAL FIX: Removed <Stack.Screen> component from inside the screen.
 * Expo Router manages screen configuration automatically through file-based routing.
 * Adding <Stack.Screen> inside a screen component causes duplicate screen registration errors.
 */
export default function LoginScreen() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithPin, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { currentTheme } = useTheme();
  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showDialog = (
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    buttons?: DialogButton[]
  ) => {
    setDialog({ visible: true, type, title, message, buttons });
  };

  const closeDialog = () => {
    setDialog({ ...dialog, visible: false });
  };

  // Redirect based on user role
  useEffect(() => {
    if (isAuthenticated && !authLoading && user) {
      console.log('[Login] User authenticated, redirecting based on role:', user.role);
      if (user.role === 'printer') {
        router.replace('/printer-queue');
      } else {
        // Admin, worker, and desarrollador all go to home
        router.replace('/(tabs)/(home)/');
      }
    }
  }, [isAuthenticated, authLoading, user]);

  const handleLogin = async () => {
    // Validate PIN
    if (!pin) {
      showDialog('error', 'Error', 'Por favor ingresa tu PIN');
      return;
    }

    if (pin.length !== 4) {
      showDialog('error', 'Error', 'El PIN debe tener 4 dígitos');
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
      
      showDialog('error', 'Error de inicio de sesión', errorMessage);
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

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
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
    logo: {
      width: 120,
      height: 120,
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: currentTheme.colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: currentTheme.colors.textSecondary,
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
      backgroundColor: currentTheme.colors.card,
      borderWidth: 2,
      borderColor: currentTheme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pinDotFilled: {
      borderColor: currentTheme.colors.primary,
      backgroundColor: currentTheme.colors.primary + '20',
    },
    pinDotText: {
      fontSize: 24,
      fontWeight: '700',
      color: currentTheme.colors.primary,
    },
    hiddenInput: {
      width: '100%',
      height: 56,
      backgroundColor: currentTheme.colors.card,
      borderRadius: 12,
      paddingHorizontal: 20,
      fontSize: 18,
      color: currentTheme.colors.text,
      borderWidth: 2,
      borderColor: currentTheme.colors.border,
      textAlign: 'center',
      letterSpacing: 8,
      fontWeight: '600',
      marginBottom: 24,
    },
    button: {
      backgroundColor: currentTheme.colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      gap: 12,
      width: '100%',
      justifyContent: 'center',
      shadowColor: currentTheme.colors.primary,
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
      color: currentTheme.colors.textSecondary,
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
      color: currentTheme.colors.textSecondary,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/64897504-f76f-4cb3-a1f3-a82b594f1121.png')}
            style={styles.logo}
            resizeMode="contain"
          />
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
            placeholderTextColor={currentTheme.colors.textSecondary}
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
                <IconSymbol ios_icon_name="arrow.right.circle.fill" android_material_icon_name="arrow_circle_right" size={24} color="#FFFFFF" />
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
          <IconSymbol ios_icon_name="lock.fill" android_material_icon_name="lock" size={16} color={currentTheme.colors.textSecondary} />
          <Text style={styles.footerText}>Aplicación de uso privado</Text>
        </View>
      </View>

      <CustomDialog
        visible={dialog.visible}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        buttons={dialog.buttons}
        onClose={closeDialog}
      />
    </KeyboardAvoidingView>
  );
}
