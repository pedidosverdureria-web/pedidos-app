
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Settings Layout Component
 * 
 * This layout handles all routes under /settings/
 * Expo Router will automatically discover all files in the settings folder
 * and create routes for them.
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
        headerBackVisible: true, // Ensure back button is visible
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Configuración',
          headerBackVisible: true, // Explicitly enable back button
        }}
      />
      <Stack.Screen
        name="check-control"
        options={{
          title: 'Control de Cheques',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="theme"
        options={{
          title: 'Color de la App',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="permissions"
        options={{
          title: 'Permisos',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notificaciones',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="printer"
        options={{
          title: 'Impresora',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="whatsapp"
        options={{
          title: 'WhatsApp',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="units"
        options={{
          title: 'Unidades de Medida',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="pdf-manager"
        options={{
          title: 'Gestor de PDF Pedidos',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'Usuarios',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="printer-test"
        options={{
          title: 'Prueba de Impresora',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="whatsapp-test"
        options={{
          title: 'Prueba de WhatsApp Parser',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'Acerca de',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="receipt-editor"
        options={{
          title: 'Editor de Recibo',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="receipt-logo"
        options={{
          title: 'Logo del Recibo',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="user-manual"
        options={{
          title: 'Manual de Usuario',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="admin-manual"
        options={{
          title: 'Manual de Administrador',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="developer-manual"
        options={{
          title: 'Manual de Desarrollador',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="technical-manual"
        options={{
          title: 'Manual Técnico',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="troubleshooting-manual"
        options={{
          title: 'Solución de Problemas',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="special-functions-manual"
        options={{
          title: 'Funciones Especiales',
          headerBackVisible: true,
        }}
      />
      <Stack.Screen
        name="check-detail"
        options={{
          title: 'Detalle del Cheque',
          headerBackVisible: true,
        }}
      />
    </Stack>
  );
}
