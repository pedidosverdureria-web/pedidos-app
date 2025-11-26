
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect } from 'react';

/**
 * Settings Layout Component
 * 
 * This layout handles all routes under /settings/
 * Expo Router will automatically discover all files in the settings folder
 * and create routes for them.
 */
export default function SettingsLayout() {
  const { currentTheme, themeVersion } = useTheme();

  console.log('[SettingsLayout] Rendering settings layout with theme:', currentTheme.name);
  console.log('[SettingsLayout] Theme version:', themeVersion);

  // Log theme changes
  useEffect(() => {
    console.log('[SettingsLayout] Theme changed to:', currentTheme.name);
    console.log('[SettingsLayout] Primary color:', currentTheme.colors.primary);
  }, [currentTheme, themeVersion]);

  return (
    <Stack
      key={`settings-stack-${themeVersion}`}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: currentTheme.colors.primary,
        },
        headerTintColor: '#FFFFFF',
        headerBackTitle: '',
        headerBackVisible: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Configuración',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="check-control"
        options={{
          title: 'Control de Cheques',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="theme"
        options={{
          title: 'Color de la App',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="permissions"
        options={{
          title: 'Permisos',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notificaciones',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="printer"
        options={{
          title: 'Impresora',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="whatsapp"
        options={{
          title: 'WhatsApp',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="units"
        options={{
          title: 'Unidades de Medida',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="pdf-manager"
        options={{
          title: 'Gestor de PDF Pedidos',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'Usuarios',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="printer-test"
        options={{
          title: 'Prueba de Impresora',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="whatsapp-test"
        options={{
          title: 'Prueba de WhatsApp Parser',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'Acerca de',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="receipt-editor"
        options={{
          title: 'Editor de Recibo',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="receipt-logo"
        options={{
          title: 'Logo del Recibo',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="user-manual"
        options={{
          title: 'Manual de Usuario',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="admin-manual"
        options={{
          title: 'Manual de Administrador',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="developer-manual"
        options={{
          title: 'Manual de Desarrollador',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="technical-manual"
        options={{
          title: 'Manual Técnico',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="troubleshooting-manual"
        options={{
          title: 'Solución de Problemas',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="special-functions-manual"
        options={{
          title: 'Funciones Especiales',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
      <Stack.Screen
        name="check-detail"
        options={{
          title: 'Detalle del Cheque',
          headerStyle: {
            backgroundColor: currentTheme.colors.primary,
          },
          headerTintColor: '#FFFFFF',
          headerBackVisible: true,
          headerBackTitle: '',
        }}
      />
    </Stack>
  );
}
