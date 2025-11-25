
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

/**
 * Home Layout Component
 * 
 * This layout handles the home tab routes.
 * Expo Router will automatically discover all files in the (home) folder.
 * 
 * DO NOT explicitly declare <Stack.Screen> components here.
 * The file-based routing system will handle screen registration automatically.
 */
export default function HomeLayout() {
  console.log('[HomeLayout] Rendering home layout');
  
  return (
    <Stack
      screenOptions={{
        headerShown: Platform.OS === 'ios',
        title: 'Pedidos',
        animation: 'slide_from_right',
      }}
    >
      {/* DO NOT add Stack.Screen components here - Expo Router handles this automatically */}
    </Stack>
  );
}
