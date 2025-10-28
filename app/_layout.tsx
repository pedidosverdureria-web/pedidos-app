
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
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
  // CRITICAL: This ensures notifications work even when the screen is off
  useEffect(() => {
    const registerNotificationTask = async () => {
      if (Platform.OS !== 'web') {
        try {
          console.log('[RootLayout] Registering background notification task...');
          await registerBackgroundNotificationTask();
          console.log('[RootLayout] Background notification task registered successfully');
        } catch (error) {
          console.error('[RootLayout] Failed to register background notification task:', error);
        }
      }
    };

    registerNotificationTask();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <WidgetProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ headerShown: false }} />
            <Stack.Screen name="stats" options={{ headerShown: false }} />
            <Stack.Screen name="activity" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="formsheet"
              options={{
                presentation: 'formSheet',
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="transparent-modal"
              options={{
                presentation: 'transparentModal',
                headerShown: false,
              }}
            />
          </Stack>
          <StatusBar style="auto" />
        </WidgetProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
