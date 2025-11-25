
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

/**
 * Home Layout Component
 * 
 * This layout handles the home tab routes.
 * Expo Router will automatically discover all files in the (home) folder.
 * 
 * DO NOT explicitly declare <Stack.Screen> components here.
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
    />
  );
}
