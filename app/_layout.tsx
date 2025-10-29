
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { registerBackgroundNotificationTask } from '@/utils/backgroundNotificationTask';
import { Platform } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthProvider>
  );
}
