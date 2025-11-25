
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  console.log('[HomeLayout] Rendering home layout');
  
  // CRITICAL FIX: Don't explicitly declare Stack.Screen components
  // Let Expo Router auto-discover routes from the file system
  // This prevents duplicate screen registration errors
  return (
    <Stack
      screenOptions={{
        headerShown: Platform.OS === 'ios', // Show header on iOS with NativeTabs, hide on Android/Web
        title: 'Home'
      }}
    />
  );
}
