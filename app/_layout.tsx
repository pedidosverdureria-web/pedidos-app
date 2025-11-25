
import { useEffect } from 'react';
import { Slot } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WidgetProvider } from '@/contexts/WidgetContext';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  console.log('[SplashScreen] Failed to prevent auto hide');
});

/**
 * Root Layout Component
 * 
 * CRITICAL: This component uses <Slot /> instead of <Stack />
 * This prevents Expo Router from auto-discovering routes at the root level
 * and causing duplicate screen registration errors.
 * 
 * Each nested _layout.tsx file will handle its own navigation structure.
 */
export default function RootLayout() {
  console.log('[RootLayout] Root component mounting');

  // Hide splash screen after a delay to ensure everything is loaded
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        console.log('[RootLayout] Hiding splash screen');
        await SplashScreen.hideAsync();
      } catch (e) {
        console.error('[RootLayout] Error hiding splash screen:', e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <WidgetProvider>
          <Slot />
        </WidgetProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
