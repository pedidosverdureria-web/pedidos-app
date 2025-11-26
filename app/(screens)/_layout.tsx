
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function ScreensLayout() {
  const { currentTheme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: currentTheme.colors.primary },
        headerTintColor: '#FFFFFF',
        headerBackTitle: 'Atrás',
        headerBackVisible: true,
        headerShown: true,
      }}
    >
      <Stack.Screen 
        name="analytics" 
        options={{ 
          title: 'Analítica Avanzada',
          headerShown: true,
          headerBackVisible: true,
        }} 
      />
      <Stack.Screen 
        name="inventory" 
        options={{ 
          title: 'Inventario',
          headerShown: true,
          headerBackVisible: true,
        }} 
      />
      <Stack.Screen 
        name="activity-log" 
        options={{ 
          title: 'Registro de Actividad',
          headerShown: true,
          headerBackVisible: true,
        }} 
      />
    </Stack>
  );
}
