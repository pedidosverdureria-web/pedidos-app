
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PermissionsAndroid } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'restricted';

export interface PermissionInfo {
  name: string;
  description: string;
  status: PermissionStatus;
  required: boolean;
  icon: string;
}

/**
 * Check notification permissions
 */
export async function checkNotificationPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') {
    return 'undetermined';
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch (error) {
    console.error('[Permissions] Error checking notification permission:', error);
    return 'undetermined';
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') {
    return 'undetermined';
  }

  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
        allowCriticalAlerts: false,
      },
    });
    
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  } catch (error) {
    console.error('[Permissions] Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Check Bluetooth permissions (Android)
 */
export async function checkBluetoothPermission(): Promise<PermissionStatus> {
  if (Platform.OS !== 'android') {
    return 'granted'; // iOS handles Bluetooth permissions automatically
  }

  try {
    if (Platform.Version >= 31) {
      // Android 12+ requires BLUETOOTH_CONNECT and BLUETOOTH_SCAN
      const connectStatus = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
      const scanStatus = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
      );
      
      if (connectStatus && scanStatus) return 'granted';
      return 'denied';
    } else {
      // Android 11 and below
      const status = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return status ? 'granted' : 'denied';
    }
  } catch (error) {
    console.error('[Permissions] Error checking Bluetooth permission:', error);
    return 'undetermined';
  }
}

/**
 * Request Bluetooth permissions (Android)
 */
export async function requestBluetoothPermission(): Promise<PermissionStatus> {
  if (Platform.OS !== 'android') {
    return 'granted';
  }

  try {
    if (Platform.Version >= 31) {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      
      const allGranted = Object.values(granted).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );
      
      return allGranted ? 'granted' : 'denied';
    } else {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
    }
  } catch (error) {
    console.error('[Permissions] Error requesting Bluetooth permission:', error);
    return 'denied';
  }
}

/**
 * Check background fetch permission
 */
export async function checkBackgroundFetchPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') {
    return 'undetermined';
  }

  try {
    const status = await BackgroundFetch.getStatusAsync();
    
    switch (status) {
      case BackgroundFetch.BackgroundFetchStatus.Available:
        return 'granted';
      case BackgroundFetch.BackgroundFetchStatus.Denied:
        return 'denied';
      case BackgroundFetch.BackgroundFetchStatus.Restricted:
        return 'restricted';
      default:
        return 'undetermined';
    }
  } catch (error) {
    console.error('[Permissions] Error checking background fetch permission:', error);
    return 'undetermined';
  }
}

/**
 * Check location permission (needed for Bluetooth on older Android)
 */
export async function checkLocationPermission(): Promise<PermissionStatus> {
  if (Platform.OS !== 'android') {
    return 'granted';
  }

  try {
    const status = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return status ? 'granted' : 'denied';
  } catch (error) {
    console.error('[Permissions] Error checking location permission:', error);
    return 'undetermined';
  }
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<PermissionStatus> {
  if (Platform.OS !== 'android') {
    return 'granted';
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
  } catch (error) {
    console.error('[Permissions] Error requesting location permission:', error);
    return 'denied';
  }
}

/**
 * Get all permissions status
 */
export async function getAllPermissionsStatus(): Promise<PermissionInfo[]> {
  const permissions: PermissionInfo[] = [
    {
      name: 'Notificaciones',
      description: 'Necesario para recibir alertas de nuevos pedidos incluso cuando la app está cerrada',
      status: await checkNotificationPermission(),
      required: true,
      icon: 'bell.badge.fill',
    },
    {
      name: 'Bluetooth',
      description: 'Necesario para conectar y usar la impresora térmica',
      status: await checkBluetoothPermission(),
      required: true,
      icon: 'antenna.radiowaves.left.and.right',
    },
    {
      name: 'Tareas en Segundo Plano',
      description: 'Permite que la app imprima pedidos automáticamente incluso con la pantalla apagada',
      status: await checkBackgroundFetchPermission(),
      required: true,
      icon: 'arrow.clockwise.circle.fill',
    },
  ];

  // Add location permission for Android < 12
  if (Platform.OS === 'android' && Platform.Version < 31) {
    permissions.push({
      name: 'Ubicación',
      description: 'Necesario para escanear dispositivos Bluetooth (requerido por Android)',
      status: await checkLocationPermission(),
      required: true,
      icon: 'location.fill',
    });
  }

  return permissions;
}

/**
 * Request a specific permission
 */
export async function requestPermission(permissionName: string): Promise<PermissionStatus> {
  switch (permissionName) {
    case 'Notificaciones':
      return await requestNotificationPermission();
    case 'Bluetooth':
      return await requestBluetoothPermission();
    case 'Ubicación':
      return await requestLocationPermission();
    case 'Tareas en Segundo Plano':
      // Background fetch permission is automatically granted or denied by the system
      // We can't request it directly, but we can guide the user to settings
      Alert.alert(
        'Permiso de Tareas en Segundo Plano',
        'Este permiso es controlado por el sistema. Si está denegado, ve a Configuración > Aplicaciones > Order Flow > Permisos y habilita "Ejecutar en segundo plano".',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
        ]
      );
      return await checkBackgroundFetchPermission();
    default:
      return 'undetermined';
  }
}

/**
 * Check if all required permissions are granted
 */
export async function checkAllRequiredPermissions(): Promise<boolean> {
  const permissions = await getAllPermissionsStatus();
  const requiredPermissions = permissions.filter(p => p.required);
  return requiredPermissions.every(p => p.status === 'granted');
}

/**
 * Request all required permissions
 */
export async function requestAllRequiredPermissions(): Promise<void> {
  console.log('[Permissions] Requesting all required permissions...');
  
  // Request notification permission
  const notificationStatus = await requestNotificationPermission();
  console.log('[Permissions] Notification permission:', notificationStatus);
  
  // Request Bluetooth permission
  const bluetoothStatus = await requestBluetoothPermission();
  console.log('[Permissions] Bluetooth permission:', bluetoothStatus);
  
  // Check background fetch status
  const backgroundStatus = await checkBackgroundFetchPermission();
  console.log('[Permissions] Background fetch status:', backgroundStatus);
  
  if (backgroundStatus === 'denied' || backgroundStatus === 'restricted') {
    Alert.alert(
      'Permiso de Segundo Plano Requerido',
      'Para que la auto-impresión funcione con la pantalla apagada, necesitas habilitar "Ejecutar en segundo plano" en la configuración de la app.',
      [
        { text: 'Más Tarde', style: 'cancel' },
        { text: 'Abrir Configuración', onPress: () => Linking.openSettings() },
      ]
    );
  }
}

/**
 * Open app settings
 */
export function openAppSettings(): void {
  Linking.openSettings();
}

/**
 * Get permission status color
 */
export function getPermissionStatusColor(status: PermissionStatus): string {
  switch (status) {
    case 'granted':
      return '#10B981'; // Green
    case 'denied':
      return '#EF4444'; // Red
    case 'restricted':
      return '#F59E0B'; // Orange
    case 'undetermined':
      return '#6B7280'; // Gray
    default:
      return '#6B7280';
  }
}

/**
 * Get permission status label
 */
export function getPermissionStatusLabel(status: PermissionStatus): string {
  switch (status) {
    case 'granted':
      return 'Concedido';
    case 'denied':
      return 'Denegado';
    case 'restricted':
      return 'Restringido';
    case 'undetermined':
      return 'No solicitado';
    default:
      return 'Desconocido';
  }
}
