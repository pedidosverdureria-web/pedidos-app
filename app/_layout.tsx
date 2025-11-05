
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { registerBackgroundNotificationTask } from '@/utils/backgroundNotificationTask';
import { Platform } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { currentTheme } = useTheme();

  // Create a custom navigation theme based on the current app theme
  const navigationTheme = useMemo(() => {
    const baseTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
    
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: currentTheme.colors.primary,
        background: currentTheme.colors.background,
        card: currentTheme.colors.card,
        text: currentTheme.colors.text,
        border: currentTheme.colors.border,
        notification: currentTheme.colors.accent,
      },
    };
  }, [colorScheme, currentTheme]);

  console.log('[RootNavigator] Current theme:', currentTheme.name);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Register background notification task on app startup
  // This is CRITICAL for notifications to work with screen off
  useEffect(() => {
    const setupBackgroundNotifications = async () => {
      if (Platform.OS !== 'web') {
        try {
          console.log('[RootLayout] Registering background notification task...');
          await registerBackgroundNotificationTask();
          console.log('[RootLayout] Background notification task registered successfully');
          console.log('[RootLayout] Notifications will now work with screen off');
        } catch (error) {
          console.error('[RootLayout] Error registering background notification task:', error);
        }
      }
    };

    setupBackgroundNotifications();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}
