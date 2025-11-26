
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Order Layout Component
 * 
 * This layout handles all routes under /order/
 * Expo Router will automatically discover all files in the order folder.
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
        headerBackVisible: true, // Ensure back button is visible
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="[orderId]"
        options={{
          title: 'Detalle del Pedido',
          headerBackVisible: true, // Explicitly enable back button
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'Nuevo Pedido',
          headerBackVisible: true, // Explicitly enable back button
        }}
      />
    </Stack>
  );
}
