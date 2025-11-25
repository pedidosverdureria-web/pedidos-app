
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Settings Layout Component
 * 
 * This layout handles all routes under /settings/
 * Expo Router will automatically discover all files in the settings folder
 * and create routes for them.
 * 
 * DO NOT explicitly declare <Stack.Screen> components here.
 */
export default function SettingsLayout() {
  const { currentTheme } = useTheme();

  console.log('[SettingsLayout] Rendering settings layout');

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: currentTheme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerBackTitle: 'Atrás',
        animation: 'slide_from_right',
      }}
    />
  );
}
