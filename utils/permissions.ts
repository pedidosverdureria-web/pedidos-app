
import * as Notifications from 'expo-notifications';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform, Alert, Linking, PermissionsAndroid } from 'react-native';
import { startActivityAsync, ActivityAction } from 'expo-intent-launcher';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionInfo {
  name: string;
  status: PermissionStatus;
  description: string;
  required: boolean;
}

/**
 * Check notification permission status
 */
export async function checkNotificationPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') {
    return 'undetermined';
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status === 'granted') {
      return 'granted';
    } else if (status === 'denied') {
      return 'denied';
    } else {
      return 'undetermined';
    }
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return 'undetermined';
  }
}

/**
 * Request notification permission
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
        allowCriticalAlerts: true,
      },
    });
    
    if (status === 'granted') {
      return 'granted';
    } else if (status === 'denied') {
      return 'denied';
    } else {
      return 'undetermined';
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Check Bluetooth permission status
 */
export async function checkBluetoothPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') {
    return 'undetermined';
  }

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
      return granted ? 'granted' : 'undetermined';
    } catch (error) {
      console.error('Error checking Bluetooth permission:', error);
      return 'undetermined';
    }
  }

  // iOS doesn't require explicit permission request for Bluetooth
  return 'granted';
}

/**
 * Request Bluetooth permission
 */
export async function requestBluetoothPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') {
    return 'undetermined';
  }

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const allGranted = Object.values(granted).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );

      return allGranted ? 'granted' : 'denied';
    } catch (error) {
      console.error('Error requesting Bluetooth permission:', error);
      return 'denied';
    }
  }

  return 'granted';
}

/**
 * Check background fetch permission status
 */
export async function checkBackgroundFetchPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') {
    return 'undetermined';
  }

  try {
    const status = await BackgroundFetch.getStatusAsync();
    
    if (status === BackgroundFetch.BackgroundFetchStatus.Available) {
      return 'granted';
    } else if (status === BackgroundFetch.BackgroundFetchStatus.Denied) {
      return 'denied';
    } else {
      return 'undetermined';
    }
  } catch (error) {
    console.error('Error checking background fetch permission:', error);
    return 'undetermined';
  }
}

/**
 * Check location permission status (required for Bluetooth on Android)
 */
export async function checkLocationPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') {
    return 'undetermined';
  }

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted ? 'granted' : 'undetermined';
    } catch (error) {
      console.error('Error checking location permission:', error);
      return 'undetermined';
    }
  }

  return 'granted';
}

/**
 * Request location permission
 */
export async function requestLocationPermission(): Promise<PermissionStatus> {
  if (Platform.OS === 'web') {
    return 'undetermined';
  }

  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Permiso de Ubicación',
          message: 'Esta aplicación necesita acceso a la ubicación para usar Bluetooth',
          buttonNeutral: 'Preguntar Después',
          buttonNegative: 'Cancelar',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return 'denied';
    }
  }

  return 'granted';
}

/**
 * Request battery optimization exemption (Android only)
 * This is critical for background tasks to work reliably
 */
export async function requestBatteryOptimizationExemption(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    // Check if already exempted
    const PowerManager = require('react-native').NativeModules.PowerManager;
    if (PowerManager) {
      const isIgnoring = await PowerManager.isIgnoringBatteryOptimizations();
      if (isIgnoring) {
        console.log('[Permissions] Already exempted from battery optimization');
        return true;
      }
    }

    // Request exemption
    Alert.alert(
      'Optimización de Batería',
      'Para que las notificaciones y la auto-impresión funcionen con la pantalla apagada, necesitas desactivar la optimización de batería para esta aplicación.\n\n¿Deseas continuar?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Configurar',
          onPress: async () => {
            try {
              await startActivityAsync(ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, {
                data: 'package:com.order.wsp',
              });
            } catch (error) {
              console.error('[Permissions] Error opening battery optimization settings:', error);
              // Fallback to app settings
              await openAppSettings();
            }
          },
        },
      ]
    );

    return false;
  } catch (error) {
    console.error('[Permissions] Error requesting battery optimization exemption:', error);
    return false;
  }
}

/**
 * Get all permissions status
 */
export async function getAllPermissionsStatus(): Promise<PermissionInfo[]> {
  const permissions: PermissionInfo[] = [
    {
      name: 'notifications',
      status: await checkNotificationPermission(),
      description: 'Recibir notificaciones de nuevos pedidos',
      required: true,
    },
    {
      name: 'bluetooth',
      status: await checkBluetoothPermission(),
      description: 'Conectar con impresora térmica',
      required: true,
    },
    {
      name: 'location',
      status: await checkLocationPermission(),
      description: 'Requerido para Bluetooth en Android',
      required: Platform.OS === 'android',
    },
    {
      name: 'background_fetch',
      status: await checkBackgroundFetchPermission(),
      description: 'Ejecutar tareas en segundo plano',
      required: true,
    },
  ];

  return permissions;
}

/**
 * Request a specific permission
 */
export async function requestPermission(permissionName: string): Promise<PermissionStatus> {
  switch (permissionName) {
    case 'notifications':
      return await requestNotificationPermission();
    case 'bluetooth':
      return await requestBluetoothPermission();
    case 'location':
      return await requestLocationPermission();
    case 'background_fetch':
      // Background fetch doesn't have a direct request method
      // It's controlled by system settings
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
  const requiredPermissions = permissions.filter((p) => p.required);
  return requiredPermissions.every((p) => p.status === 'granted');
}

/**
 * Request all required permissions
 */
export async function requestAllRequiredPermissions(): Promise<boolean> {
  console.log('[Permissions] Requesting all required permissions...');
  
  const permissions = await getAllPermissionsStatus();
  const requiredPermissions = permissions.filter((p) => p.required);
  
  for (const permission of requiredPermissions) {
    if (permission.status !== 'granted') {
      console.log(`[Permissions] Requesting ${permission.name}...`);
      const status = await requestPermission(permission.name);
      console.log(`[Permissions] ${permission.name} status:`, status);
    }
  }

  // Request battery optimization exemption on Android
  if (Platform.OS === 'android') {
    console.log('[Permissions] Requesting battery optimization exemption...');
    await requestBatteryOptimizationExemption();
  }

  const allGranted = await checkAllRequiredPermissions();
  console.log('[Permissions] All required permissions granted:', allGranted);
  
  return allGranted;
}

/**
 * Open app settings
 */
export async function openAppSettings(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch (error) {
    console.error('[Permissions] Error opening app settings:', error);
    Alert.alert(
      'Error',
      'No se pudo abrir la configuración de la aplicación. Por favor, ábrela manualmente desde la configuración del sistema.'
    );
  }
}

/**
 * Get permission status color for UI
 */
export function getPermissionStatusColor(status: PermissionStatus): string {
  switch (status) {
    case 'granted':
      return '#10B981';
    case 'denied':
      return '#EF4444';
    case 'undetermined':
      return '#F59E0B';
    default:
      return '#6B7280';
  }
}

/**
 * Get permission status label for UI
 */
export function getPermissionStatusLabel(status: PermissionStatus): string {
  switch (status) {
    case 'granted':
      return 'Concedido';
    case 'denied':
      return 'Denegado';
    case 'undetermined':
      return 'No solicitado';
    default:
      return 'Desconocido';
  }
}
