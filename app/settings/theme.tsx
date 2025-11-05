
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
      // Small delay to show the change
      setTimeout(() => {
        setChangingTheme(false);
      }, 300);
    } catch (error) {
      console.error('Error changing theme:', error);
      setChangingTheme(false);
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
      marginBottom: 24,
      lineHeight: 20,
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
    colorPreview: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    colorSwatch: {
      width: 40,
      height: 40,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: currentTheme.colors.border,
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
              
              <View style={styles.colorPreview}>
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: theme.colors.secondary },
                  ]}
                />
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: theme.colors.accent },
                  ]}
                />
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: theme.colors.statusPreparing },
                  ]}
                />
                <View
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: theme.colors.statusReady },
                  ]}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
