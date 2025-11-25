
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function OrderLayout() {
  const { currentTheme } = useTheme();

  console.log('[OrderLayout] Rendering order layout');

  // CRITICAL FIX: Don't explicitly declare Stack.Screen components
  // Let Expo Router auto-discover routes from the file system
  // This prevents duplicate screen registration errors
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: currentTheme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerShadowVisible: true,
        headerBackTitle: 'Atrás',
      }}
    />
  );
}
