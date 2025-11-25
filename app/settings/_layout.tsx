
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsLayout() {
  const { currentTheme } = useTheme();

  console.log('[SettingsLayout] Rendering settings layout');

  // CRITICAL FIX: Don't explicitly declare Stack.Screen components
  // Let Expo Router auto-discover routes from the file system
  // This prevents duplicate screen registration errors
  // The Stack component will automatically discover all files in the settings folder
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: currentTheme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerBackTitle: 'Atrás',
      }}
    />
  );
}
