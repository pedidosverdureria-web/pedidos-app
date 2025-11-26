
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
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Configuración',
        }}
      />
      <Stack.Screen
        name="check-control"
        options={{
          title: 'Control de Cheques',
        }}
      />
      <Stack.Screen
        name="theme"
        options={{
          title: 'Color de la App',
        }}
      />
      <Stack.Screen
        name="permissions"
        options={{
          title: 'Permisos',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notificaciones',
        }}
      />
      <Stack.Screen
        name="printer"
        options={{
          title: 'Impresora',
        }}
      />
      <Stack.Screen
        name="whatsapp"
        options={{
          title: 'WhatsApp',
        }}
      />
      <Stack.Screen
        name="units"
        options={{
          title: 'Unidades de Medida',
        }}
      />
      <Stack.Screen
        name="pdf-manager"
        options={{
          title: 'Gestor de PDF Pedidos',
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'Usuarios',
        }}
      />
      <Stack.Screen
        name="printer-test"
        options={{
          title: 'Prueba de Impresora',
        }}
      />
      <Stack.Screen
        name="whatsapp-test"
        options={{
          title: 'Prueba de WhatsApp Parser',
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'Acerca de',
        }}
      />
      <Stack.Screen
        name="receipt-editor"
        options={{
          title: 'Editor de Recibo',
        }}
      />
      <Stack.Screen
        name="receipt-logo"
        options={{
          title: 'Logo del Recibo',
        }}
      />
      <Stack.Screen
        name="user-manual"
        options={{
          title: 'Manual de Usuario',
        }}
      />
      <Stack.Screen
        name="admin-manual"
        options={{
          title: 'Manual de Administrador',
        }}
      />
      <Stack.Screen
        name="developer-manual"
        options={{
          title: 'Manual de Desarrollador',
        }}
      />
      <Stack.Screen
        name="technical-manual"
        options={{
          title: 'Manual Técnico',
        }}
      />
      <Stack.Screen
        name="troubleshooting-manual"
        options={{
          title: 'Solución de Problemas',
        }}
      />
      <Stack.Screen
        name="special-functions-manual"
        options={{
          title: 'Funciones Especiales',
        }}
      />
      <Stack.Screen
        name="check-detail"
        options={{
          title: 'Detalle del Cheque',
        }}
      />
    </Stack>
  );
}
