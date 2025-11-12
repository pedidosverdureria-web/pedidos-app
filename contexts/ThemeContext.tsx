
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const THEME_STORAGE_KEY = '@app_color_theme';

export interface ColorTheme {
  id: string;
  name: string;
  colors: {
    background: string;
    text: string;
    textSecondary: string;
    primary: string;
    secondary: string;
    accent: string;
    card: string;
    highlight: string;
    statusPending: string;
    statusPreparing: string;
    statusReady: string;
    statusDelivered: string;
    statusCancelled: string;
    statusPendingPayment: string;
    statusAbonado: string;
    statusPagado: string;
    statusFinalizado: string;
    border: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };
}

export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'blue',
    name: 'Azul (Predeterminado)',
    colors: {
      background: '#F5F5F5',
      text: '#212121',
      textSecondary: '#757575',
      primary: '#3F51B5',
      secondary: '#E91E63',
      accent: '#03A9F4',
      card: '#FFFFFF',
      highlight: '#FFEB3B',
      statusPending: '#FFC107',
      statusPreparing: '#2196F3',
      statusReady: '#4CAF50',
      statusDelivered: '#9E9E9E',
      statusCancelled: '#F44336',
      statusPendingPayment: '#8B5CF6',
      statusAbonado: '#F59E0B',
      statusPagado: '#10B981',
      statusFinalizado: '#059669',
      border: '#E0E0E0',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#2196F3',
    },
  },
  {
    id: 'green',
    name: 'Verde',
    colors: {
      background: '#F5F5F5',
      text: '#212121',
      textSecondary: '#757575',
      primary: '#4CAF50',
      secondary: '#8BC34A',
      accent: '#00BCD4',
      card: '#FFFFFF',
      highlight: '#CDDC39',
      statusPending: '#FFC107',
      statusPreparing: '#00BCD4',
      statusReady: '#4CAF50',
      statusDelivered: '#9E9E9E',
      statusCancelled: '#F44336',
      statusPendingPayment: '#8B5CF6',
      statusAbonado: '#F59E0B',
      statusPagado: '#10B981',
      statusFinalizado: '#059669',
      border: '#E0E0E0',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#00BCD4',
    },
  },
  {
    id: 'purple',
    name: 'Morado',
    colors: {
      background: '#F5F5F5',
      text: '#212121',
      textSecondary: '#757575',
      primary: '#9C27B0',
      secondary: '#673AB7',
      accent: '#E91E63',
      card: '#FFFFFF',
      highlight: '#FF4081',
      statusPending: '#FFC107',
      statusPreparing: '#673AB7',
      statusReady: '#4CAF50',
      statusDelivered: '#9E9E9E',
      statusCancelled: '#F44336',
      statusPendingPayment: '#8B5CF6',
      statusAbonado: '#F59E0B',
      statusPagado: '#10B981',
      statusFinalizado: '#059669',
      border: '#E0E0E0',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#673AB7',
    },
  },
  {
    id: 'orange',
    name: 'Naranja',
    colors: {
      background: '#F5F5F5',
      text: '#212121',
      textSecondary: '#757575',
      primary: '#FF9800',
      secondary: '#FF5722',
      accent: '#FFC107',
      card: '#FFFFFF',
      highlight: '#FFEB3B',
      statusPending: '#FFC107',
      statusPreparing: '#FF9800',
      statusReady: '#4CAF50',
      statusDelivered: '#9E9E9E',
      statusCancelled: '#F44336',
      statusPendingPayment: '#8B5CF6',
      statusAbonado: '#F59E0B',
      statusPagado: '#10B981',
      statusFinalizado: '#059669',
      border: '#E0E0E0',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#FF9800',
    },
  },
  {
    id: 'teal',
    name: 'Turquesa',
    colors: {
      background: '#F5F5F5',
      text: '#212121',
      textSecondary: '#757575',
      primary: '#009688',
      secondary: '#00BCD4',
      accent: '#4DD0E1',
      card: '#FFFFFF',
      highlight: '#80DEEA',
      statusPending: '#FFC107',
      statusPreparing: '#00BCD4',
      statusReady: '#4CAF50',
      statusDelivered: '#9E9E9E',
      statusCancelled: '#F44336',
      statusPendingPayment: '#8B5CF6',
      statusAbonado: '#F59E0B',
      statusPagado: '#10B981',
      statusFinalizado: '#059669',
      border: '#E0E0E0',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#00BCD4',
    },
  },
  {
    id: 'red',
    name: 'Rojo',
    colors: {
      background: '#F5F5F5',
      text: '#212121',
      textSecondary: '#757575',
      primary: '#F44336',
      secondary: '#E91E63',
      accent: '#FF5722',
      card: '#FFFFFF',
      highlight: '#FF9800',
      statusPending: '#FFC107',
      statusPreparing: '#2196F3',
      statusReady: '#4CAF50',
      statusDelivered: '#9E9E9E',
      statusCancelled: '#F44336',
      statusPendingPayment: '#8B5CF6',
      statusAbonado: '#F59E0B',
      statusPagado: '#10B981',
      statusFinalizado: '#059669',
      border: '#E0E0E0',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#2196F3',
    },
  },
  {
    id: 'indigo',
    name: 'Índigo',
    colors: {
      background: '#F5F5F5',
      text: '#212121',
      textSecondary: '#757575',
      primary: '#3F51B5',
      secondary: '#5C6BC0',
      accent: '#7986CB',
      card: '#FFFFFF',
      highlight: '#9FA8DA',
      statusPending: '#FFC107',
      statusPreparing: '#5C6BC0',
      statusReady: '#4CAF50',
      statusDelivered: '#9E9E9E',
      statusCancelled: '#F44336',
      statusPendingPayment: '#8B5CF6',
      statusAbonado: '#F59E0B',
      statusPagado: '#10B981',
      statusFinalizado: '#059669',
      border: '#E0E0E0',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#5C6BC0',
    },
  },
  {
    id: 'brown',
    name: 'Café',
    colors: {
      background: '#F5F5F5',
      text: '#212121',
      textSecondary: '#757575',
      primary: '#795548',
      secondary: '#8D6E63',
      accent: '#A1887F',
      card: '#FFFFFF',
      highlight: '#BCAAA4',
      statusPending: '#FFC107',
      statusPreparing: '#8D6E63',
      statusReady: '#4CAF50',
      statusDelivered: '#9E9E9E',
      statusCancelled: '#F44336',
      statusPendingPayment: '#8B5CF6',
      statusAbonado: '#F59E0B',
      statusPagado: '#10B981',
      statusFinalizado: '#059669',
      border: '#E0E0E0',
      success: '#4CAF50',
      error: '#F44336',
      warning: '#FF9800',
      info: '#8D6E63',
    },
  },
];

interface ThemeContextType {
  currentTheme: ColorTheme;
  setTheme: (themeId: string) => Promise<void>;
  isLoading: boolean;
  themeVersion: number; // Add version to force re-renders
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(COLOR_THEMES[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedThemeId = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      console.log('[ThemeContext] Loading saved theme:', savedThemeId);
      if (savedThemeId) {
        const theme = COLOR_THEMES.find(t => t.id === savedThemeId);
        if (theme) {
          console.log('[ThemeContext] Applying theme:', theme.name);
          setCurrentTheme(theme);
        }
      }
    } catch (error) {
      console.error('[ThemeContext] Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (themeId: string) => {
    try {
      const theme = COLOR_THEMES.find(t => t.id === themeId);
      if (theme) {
        console.log('[ThemeContext] Changing theme to:', theme.name);
        
        // Save to AsyncStorage first
        await AsyncStorage.setItem(THEME_STORAGE_KEY, themeId);
        
        // Update state
        setCurrentTheme(theme);
        setThemeVersion(prev => prev + 1);
        
        console.log('[ThemeContext] Theme changed successfully');
        console.log('[ThemeContext] Theme version:', themeVersion + 1);
        
        // In Expo Go, we need to reload the app for changes to fully apply
        // This is because some components cache styles
        if (__DEV__ && Platform.OS !== 'web') {
          console.log('[ThemeContext] Development mode detected');
          console.log('[ThemeContext] For full theme changes in Expo Go:');
          console.log('[ThemeContext] 1. Shake device to open dev menu');
          console.log('[ThemeContext] 2. Tap "Reload" to see all changes');
          console.log('[ThemeContext] Or close and reopen the app');
        }
      }
    } catch (error) {
      console.error('[ThemeContext] Error saving theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, isLoading, themeVersion }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
