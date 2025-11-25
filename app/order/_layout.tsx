
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Order Layout Component
 * 
 * This layout handles all routes under /order/
 * Expo Router will automatically discover all files in the order folder.
 * 
 * DO NOT explicitly declare <Stack.Screen> components here.
 * The file-based routing system will handle screen registration automatically.
 */
export default function OrderLayout() {
  const { currentTheme } = useTheme();

  console.log('[OrderLayout] Rendering order layout');

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: currentTheme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerShadowVisible: true,
        headerBackTitle: 'Atrás',
        animation: 'slide_from_right',
      }}
    >
      {/* DO NOT add Stack.Screen components here - Expo Router handles this automatically */}
    </Stack>
  );
}
