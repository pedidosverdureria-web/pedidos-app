
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { useColorScheme, Platform } from 'react-native';
import { AuthProvider } from '@/contexts/AuthContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import * as Notifications from 'expo-notifications';
import { setupNotificationResponseHandler } from '@/utils/pushNotifications';

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

  // Setup notification handlers
  useEffect(() => {
    // Only setup notifications on native platforms
    if (Platform.OS === 'web') {
      console.log('Notifications not supported on web');
      return;
    }

    // Handle notification taps
    const responseSubscription = setupNotificationResponseHandler((response) => {
      console.log('Notification tapped:', response);
      const orderId = response.notification.request.content.data?.orderId;
      if (orderId) {
        router.push(`/order/${orderId}` as any);
      }
    });

    // Get last notification response (if app was opened from notification)
    // Only available on native platforms
    if (Notifications.getLastNotificationResponseAsync) {
      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) {
            const orderId = response.notification.request.content.data?.orderId;
            if (orderId) {
              router.push(`/order/${orderId}` as any);
            }
          }
        })
        .catch((error) => {
          console.error('Error getting last notification response:', error);
        });
    }

    return () => {
      responseSubscription.remove();
    };
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <WidgetProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="setup" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ title: 'Configuración' }} />
            <Stack.Screen name="activity" options={{ title: 'Actividad' }} />
            <Stack.Screen name="stats" options={{ title: 'Estadísticas' }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                title: 'Modal',
              }}
            />
            <Stack.Screen
              name="formsheet"
              options={{
                presentation: 'formSheet',
                title: 'Form Sheet',
              }}
            />
            <Stack.Screen
              name="transparent-modal"
              options={{
                presentation: 'transparentModal',
                animation: 'fade',
                title: 'Transparent Modal',
              }}
            />
          </Stack>
        </WidgetProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
