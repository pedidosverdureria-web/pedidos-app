
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { useTheme, COLOR_THEMES } from '@/contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

export default function ThemeSettingsScreen() {
  const { currentTheme, setTheme, isLoading } = useTheme();
  const [changingTheme, setChangingTheme] = useState(false);

  const handleThemeChange = async (themeId: string) => {
    if (themeId === currentTheme.id) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setChangingTheme(true);
    
    try {
      await setTheme(themeId);
      
      // Show reload instructions for Expo Go
      if (__DEV__ && Platform.OS !== 'web') {
        setTimeout(() => {
          Alert.alert(
            '🎨 Tema Cambiado',
            'El tema se ha guardado correctamente.\n\n' +
            'Para ver todos los cambios en Expo Go:\n\n' +
            '1️⃣ Agita el dispositivo para abrir el menú\n' +
            '2️⃣ Toca "Reload" para recargar la app\n\n' +
            'O simplemente cierra y vuelve a abrir la app.',
            [
              {
                text: 'Entendido',
                onPress: () => {
                  setChangingTheme(false);
                  // Navigate back to show the change
                  router.back();
                },
              },
            ]
          );
        }, 500);
      } else {
        // In production, just show success
        setTimeout(() => {
          setChangingTheme(false);
          router.back();
        }, 500);
      }
    } catch (error) {
      console.error('[ThemeSettings] Error changing theme:', error);
      setChangingTheme(false);
      Alert.alert(
        'Error',
        'No se pudo cambiar el tema. Por favor intenta de nuevo.'
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: currentTheme.colors.background,
    },
    content: {
      padding: 16,
    },
    description: {
      fontSize: 14,
      color: currentTheme.colors.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    devNote: {
      backgroundColor: currentTheme.colors.info + '20',
      borderLeftWidth: 4,
      borderLeftColor: currentTheme.colors.info,
      padding: 12,
      borderRadius: 8,
      marginBottom: 24,
    },
    devNoteTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: currentTheme.colors.info,
      marginBottom: 4,
    },
    devNoteText: {
      fontSize: 13,
      color: currentTheme.colors.text,
      lineHeight: 18,
    },
    themeCard: {
      backgroundColor: currentTheme.colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: currentTheme.colors.border,
    },
    themeCardSelected: {
      borderColor: currentTheme.colors.primary,
      backgroundColor: currentTheme.colors.card,
    },
    themeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    themeName: {
      fontSize: 18,
      fontWeight: '600',
      color: currentTheme.colors.text,
    },
    checkIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: currentTheme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorPreviewSection: {
      marginBottom: 12,
    },
    colorPreviewTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: currentTheme.colors.textSecondary,
      marginBottom: 8,
    },
    colorPreview: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    colorSwatchContainer: {
      alignItems: 'center',
      gap: 4,
    },
    colorSwatch: {
      width: 40,
      height: 40,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
    },
    colorLabel: {
      fontSize: 10,
      color: currentTheme.colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: currentTheme.colors.background,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: currentTheme.colors.textSecondary,
    },
  });

  if (isLoading || changingTheme) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Color de la App',
            headerBackTitle: 'Atrás',
          }}
        />
        <ActivityIndicator size="large" color={currentTheme.colors.primary} />
        <Text style={styles.loadingText}>
          {changingTheme ? 'Aplicando tema...' : 'Cargando...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Color de la App',
          headerBackTitle: 'Atrás',
        }}
      />
      <ScrollView style={styles.content}>
        <Text style={styles.description}>
          Selecciona el color principal de la aplicación. El cambio se aplicará inmediatamente en toda la app.
        </Text>

        {__DEV__ && Platform.OS !== 'web' && (
          <View style={styles.devNote}>
            <Text style={styles.devNoteTitle}>💡 Nota para Expo Go</Text>
            <Text style={styles.devNoteText}>
              Después de cambiar el tema, agita el dispositivo y toca "Reload" para ver todos los cambios aplicados.
            </Text>
          </View>
        )}

        {COLOR_THEMES.map((theme) => {
          const isSelected = theme.id === currentTheme.id;
          
          return (
            <TouchableOpacity
              key={theme.id}
              style={[
                styles.themeCard,
                isSelected && styles.themeCardSelected,
              ]}
              onPress={() => handleThemeChange(theme.id)}
              activeOpacity={0.7}
            >
              <View style={styles.themeHeader}>
                <Text style={styles.themeName}>{theme.name}</Text>
                {isSelected && (
                  <View style={styles.checkIcon}>
                    <IconSymbol name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}
              </View>
              
              {/* Main Colors */}
              <View style={styles.colorPreviewSection}>
                <Text style={styles.colorPreviewTitle}>Colores Principales</Text>
                <View style={styles.colorPreview}>
                  <View style={styles.colorSwatchContainer}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                    <Text style={styles.colorLabel}>Principal</Text>
                  </View>
                  <View style={styles.colorSwatchContainer}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: theme.colors.secondary },
                      ]}
                    />
                    <Text style={styles.colorLabel}>Secundario</Text>
                  </View>
                  <View style={styles.colorSwatchContainer}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: theme.colors.accent },
                      ]}
                    />
                    <Text style={styles.colorLabel}>Acento</Text>
                  </View>
                </View>
              </View>

              {/* Status Colors */}
              <View style={styles.colorPreviewSection}>
                <Text style={styles.colorPreviewTitle}>Estados de Pedidos</Text>
                <View style={styles.colorPreview}>
                  <View style={styles.colorSwatchContainer}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: theme.colors.statusPending },
                      ]}
                    />
                    <Text style={styles.colorLabel}>Pendiente</Text>
                  </View>
                  <View style={styles.colorSwatchContainer}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: theme.colors.statusPreparing },
                      ]}
                    />
                    <Text style={styles.colorLabel}>Preparando</Text>
                  </View>
                  <View style={styles.colorSwatchContainer}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: theme.colors.statusReady },
                      ]}
                    />
                    <Text style={styles.colorLabel}>Listo</Text>
                  </View>
                  <View style={styles.colorSwatchContainer}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: theme.colors.statusDelivered },
                      ]}
                    />
                    <Text style={styles.colorLabel}>Entregado</Text>
                  </View>
                  <View style={styles.colorSwatchContainer}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: theme.colors.statusCancelled },
                      ]}
                    />
                    <Text style={styles.colorLabel}>Cancelado</Text>
                  </View>
                </View>
              </View>

              {/* Payment Status Colors */}
              <View style={styles.colorPreviewSection}>
                <Text style={styles.colorPreviewTitle}>Estados de Pago</Text>
                <View style={styles.colorPreview}>
                  <View style={styles.colorSwatchContainer}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: theme.colors.statusPendingPayment },
                      ]}
                    />
                    <Text style={styles.colorLabel}>Pend. Pago</Text>
                  </View>
                  <View style={styles.colorSwatchContainer}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: theme.colors.statusAbonado },
                      ]}
                    />
                    <Text style={styles.colorLabel}>Abonado</Text>
                  </View>
                  <View style={styles.colorSwatchContainer}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: theme.colors.statusPagado },
                      ]}
                    />
                    <Text style={styles.colorLabel}>Pagado</Text>
                  </View>
                  <View style={styles.colorSwatchContainer}>
                    <View
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: theme.colors.statusFinalizado },
                      ]}
                    />
                    <Text style={styles.colorLabel}>Finalizado</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
