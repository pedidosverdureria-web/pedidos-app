
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsLayout() {
  const { currentTheme } = useTheme();

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
    >
      <Stack.Screen
        name="notifications"
        options={{
          title: 'Notificaciones',
        }}
      />
      <Stack.Screen
        name="printer"
        options={{
          title: 'Configuración de Impresora',
        }}
      />
      <Stack.Screen
        name="theme"
        options={{
          title: 'Color de la App',
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'Gestión de Usuarios',
        }}
      />
      <Stack.Screen
        name="whatsapp"
        options={{
          title: 'WhatsApp Integration',
        }}
      />
      <Stack.Screen
        name="about"
        options={{
          title: 'Acerca de',
        }}
      />
      <Stack.Screen
        name="permissions"
        options={{
          title: 'Permisos',
        }}
      />
      <Stack.Screen
        name="receipt-editor"
        options={{
          title: 'Editor de Recibos',
        }}
      />
      <Stack.Screen
        name="receipt-logo"
        options={{
          title: 'Logo del Recibo',
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
          title: 'Gestor PDF Pedidos',
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
        name="user-manual"
        options={{
          title: 'Guía de Usuario',
        }}
      />
      <Stack.Screen
        name="admin-manual"
        options={{
          title: 'Guía de Administrador',
        }}
      />
      <Stack.Screen
        name="special-functions-manual"
        options={{
          title: 'Guía de Funciones Especiales',
        }}
      />
      <Stack.Screen
        name="technical-manual"
        options={{
          title: 'Guía Técnica',
        }}
      />
      <Stack.Screen
        name="developer-manual"
        options={{
          title: 'Guía de Desarrollador',
        }}
      />
      <Stack.Screen
        name="troubleshooting-manual"
        options={{
          title: 'Guía para Resolver Problemas',
        }}
      />
    </Stack>
  );
}
