
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function OrderLayout() {
  const { currentTheme } = useTheme();

  console.log('[OrderLayout] Rendering order layout');

  // Let Expo Router auto-discover routes
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
