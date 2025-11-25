
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

export default function HomeLayout() {
  console.log('[HomeLayout] Rendering home layout');
  
  // Let Expo Router auto-discover routes
  return (
    <Stack
      screenOptions={{
        headerShown: Platform.OS === 'ios', // Show header on iOS with NativeTabs, hide on Android/Web
        title: 'Home'
      }}
    />
  );
}
