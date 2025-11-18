
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function OrderLayout() {
  const { currentTheme } = useTheme();

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
    >
      <Stack.Screen
        name="[orderId]"
        options={{
          title: 'Detalle del Pedido',
        }}
      />
      <Stack.Screen
        name="new"
        options={{
          title: 'Nuevo Pedido Manual',
        }}
      />
    </Stack>
  );
}
