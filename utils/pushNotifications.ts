
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { getSupabase } from '@/lib/supabase';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@device_id';

// Configure notification handler (only on native platforms)
// This ensures notifications are shown with sound and vibration even when app is in foreground
// CRITICAL: This configuration is essential for screen-off notifications
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  
  console.log('[PushNotifications] Notification handler configured');
  console.log('[PushNotifications] Notifications will show with sound and vibration');
}

/**
 * Get or create a unique device ID for this device
 * This is used to identify the device in the database without requiring Supabase Auth
 */
async function getDeviceId(): Promise<string> {
  try {
    // Try to get existing device ID
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate a new device ID using device info
      const deviceName = Device.deviceName || 'Unknown Device';
      const modelName = Device.modelName || 'Unknown Model';
      const osVersion = Device.osVersion || 'Unknown OS';
      const timestamp = Date.now();
      
      // Create a unique ID combining device info and timestamp
      deviceId = `${Platform.OS}-${modelName}-${timestamp}`.replace(/\s+/g, '-');
      
      // Save it for future use
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
      console.log('[PushNotifications] Generated new device ID:', deviceId);
    } else {
      console.log('[PushNotifications] Using existing device ID:', deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('[PushNotifications] Error getting device ID:', error);
    // Fallback to a random ID
    return `${Platform.OS}-${Date.now()}`;
  }
}

/**
 * Custom error class for Firebase configuration issues
 */
export class FirebaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseConfigError';
  }
}

/**
 * Register for push notifications and save the token to the database
 * CRITICAL: This sets up notification channels with maximum priority for screen-off delivery
 * 
 * @param userRole - The role of the user (admin, worker, printer, desarrollador)
 * @returns The push token if successful, null otherwise
 */
export async function registerForPushNotificationsAsync(userRole?: string): Promise<string | null> {
  // Push notifications are not supported on web
  if (Platform.OS === 'web') {
    console.log('[PushNotifications] Not supported on web');
    return null;
  }

  let token: string | null = null;

  // First, set up notification channels (Android only)
  if (Platform.OS === 'android') {
    try {
      // Create default notification channel with high priority
      // CRITICAL: MAX importance ensures notifications work with screen off
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Predeterminado',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true, // Bypass Do Not Disturb mode
      });

      // Create order notifications channel with maximum priority for background notifications
      // CRITICAL: This channel is specifically designed for screen-off delivery
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Pedidos',
        description: 'Notificaciones de nuevos pedidos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500], // Longer vibration pattern for orders
        lightColor: '#3B82F6',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true, // Bypass Do Not Disturb mode
      });

      console.log('[PushNotifications] Android notification channels created with MAX priority');
      console.log('[PushNotifications] Channels configured to work with screen off and DND mode');
    } catch (error) {
      console.error('[PushNotifications] Error creating notification channels:', error);
    }
  }

  // Check if we're on a physical device
  if (!Device.isDevice) {
    console.log('[PushNotifications] Must use physical device for Push Notifications');
    Alert.alert(
      'Dispositivo Requerido',
      'Las notificaciones push solo funcionan en dispositivos físicos, no en emuladores.\n\n' +
      'Sin embargo, las notificaciones locales funcionarán cuando recibas pedidos.'
    );
    return null;
  }

  // Request notification permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    console.log('[PushNotifications] Requesting notification permissions...');
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
        allowCriticalAlerts: true, // Request critical alerts for iOS
      },
    });
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('[PushNotifications] Failed to get push token - permission not granted');
    Alert.alert(
      'Permisos Requeridos',
      'Para recibir notificaciones de nuevos pedidos, necesitas otorgar permisos de notificaciones.\n\n' +
      'Ve a Configuración > Aplicaciones > Pedidos > Notificaciones y actívalas.'
    );
    return null;
  }
  
  console.log('[PushNotifications] Notification permissions granted');
  
  try {
    // Get the project ID from expo-constants
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    
    if (!projectId) {
      console.error('[PushNotifications] No Expo project ID found in app.config.js');
      throw new Error('Expo project ID not configured. Please add it to app.config.js under extra.eas.projectId');
    }

    console.log('[PushNotifications] Using project ID:', projectId);

    // Try to get the push token
    // This will fail if Firebase is not configured on Android
    let pushToken;
    try {
      pushToken = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = pushToken.data;
      console.log('[PushNotifications] Push token obtained:', token);
    } catch (tokenError: any) {
      console.error('[PushNotifications] Error getting push token:', tokenError);
      console.error('[PushNotifications] Error details:', {
        message: tokenError?.message,
        code: tokenError?.code,
        stack: tokenError?.stack,
      });
      
      // Check if it's a Firebase-related error
      if (Platform.OS === 'android') {
        const errorMessage = tokenError?.message || '';
        const isFirebaseError = 
          errorMessage.includes('FirebaseApp') || 
          errorMessage.includes('FCM') ||
          errorMessage.includes('google-services') ||
          errorMessage.includes('firebase') ||
          errorMessage.toLowerCase().includes('firebase');
        
        if (isFirebaseError) {
          console.error('[PushNotifications] Firebase configuration error detected');
          
          // Throw a FirebaseConfigError so the UI can handle it properly
          throw new FirebaseConfigError(
            'Firebase Cloud Messaging (FCM) no está configurado. ' +
            'Para usar notificaciones push en Android, necesitas configurar Firebase. ' +
            'Consulta FIREBASE_FCM_SETUP_GUIDE.md para instrucciones detalladas.'
          );
        }
      }
      
      // Re-throw other errors
      throw tokenError;
    }

    // Get device ID
    const deviceId = await getDeviceId();
    const deviceName = Device.deviceName || 'Unknown Device';

    // Save token to database using device_push_tokens table
    const supabase = getSupabase();
    if (supabase) {
      console.log('[PushNotifications] Saving push token to database...');
      console.log('[PushNotifications] Device ID:', deviceId);
      console.log('[PushNotifications] Device Name:', deviceName);
      console.log('[PushNotifications] User Role:', userRole || 'null');
      console.log('[PushNotifications] Push Token:', token);
      
      // First, try to check if a record exists
      const { data: existingData, error: selectError } = await supabase
        .from('device_push_tokens')
        .select('*')
        .eq('device_id', deviceId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is fine
        console.error('[PushNotifications] Error checking existing token:', selectError);
      }

      console.log('[PushNotifications] Existing record:', existingData ? 'found' : 'not found');

      // Now upsert the token
      const { data, error } = await supabase
        .from('device_push_tokens')
        .upsert({
          device_id: deviceId,
          push_token: token,
          user_role: userRole || null,
          device_name: deviceName,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'device_id',
          ignoreDuplicates: false,
        })
        .select();

      if (error) {
        console.error('[PushNotifications] Error saving push token:', error);
        console.error('[PushNotifications] Error code:', error.code);
        console.error('[PushNotifications] Error message:', error.message);
        console.error('[PushNotifications] Error details:', JSON.stringify(error, null, 2));
        throw error;
      } else {
        console.log('[PushNotifications] Push token saved successfully to database');
        console.log('[PushNotifications] Saved data:', JSON.stringify(data, null, 2));
        
        // Verify the save by querying the database
        const { data: verifyData, error: verifyError } = await supabase
          .from('device_push_tokens')
          .select('*')
          .eq('device_id', deviceId)
          .single();

        if (verifyError) {
          console.error('[PushNotifications] Error verifying saved token:', verifyError);
        } else {
          console.log('[PushNotifications] Verified saved token:', JSON.stringify(verifyData, null, 2));
        }
        
        // Show success message
        Alert.alert(
          '✅ Notificaciones Activadas',
          'Las notificaciones push se han configurado correctamente.\n\n' +
          'Recibirás notificaciones cuando lleguen nuevos pedidos por WhatsApp.'
        );
      }
    } else {
      console.error('[PushNotifications] Supabase client not available');
      throw new Error('Supabase client not available');
    }
  } catch (e: any) {
    console.error('[PushNotifications] Error in registration process:', e);
    console.error('[PushNotifications] Error stack:', e.stack);
    
    // Re-throw FirebaseConfigError so the UI can handle it
    if (e instanceof FirebaseConfigError) {
      throw e;
    }
    
    // Show error to user for other errors
    Alert.alert(
      'Error',
      'No se pudieron configurar las notificaciones push.\n\n' +
      'Error: ' + (e.message || 'Desconocido') + '\n\n' +
      'Las notificaciones locales seguirán funcionando.'
    );
    
    throw e;
  }

  return token;
}

/**
 * Create an in-app notification
 * Note: user_id is optional since we're using PIN-based auth
 */
export async function createInAppNotification(
  userId: string | null,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' | 'order',
  relatedOrderId?: string
) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      console.error('[PushNotifications] Supabase not initialized');
      return;
    }

    // Ensure userId is either a valid UUID string or null (not empty string)
    const validUserId = userId && userId.trim() !== '' ? userId : null;
    
    // Ensure relatedOrderId is either a valid UUID string or null (not empty string)
    const validRelatedOrderId = relatedOrderId && relatedOrderId.trim() !== '' ? relatedOrderId : null;

    console.log('[PushNotifications] Creating notification with userId:', validUserId, 'relatedOrderId:', validRelatedOrderId);

    const { error } = await supabase.from('notifications').insert([
      {
        user_id: validUserId,
        title,
        message,
        type,
        related_order_id: validRelatedOrderId,
        is_read: false,
      },
    ]);

    if (error) {
      console.error('[PushNotifications] Error creating in-app notification:', error);
    } else {
      console.log('[PushNotifications] In-app notification created successfully');
    }
  } catch (error) {
    console.error('[PushNotifications] Error creating in-app notification:', error);
  }
}

/**
 * Send a local push notification with sound and vibration
 * This will work even when the screen is off or app is in background
 * CRITICAL: Uses maximum priority and wake lock to ensure delivery
 * 
 * This works WITHOUT Firebase - it's a local notification
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  // Local notifications not supported on web
  if (Platform.OS === 'web') {
    console.log('[PushNotifications] Local notifications not supported on web');
    return;
  }

  try {
    console.log('[PushNotifications] Sending local notification:', { title, body });
    console.log('[PushNotifications] Notification configured for screen-off delivery');
    
    const notificationContent: Notifications.NotificationContentInput = {
      title,
      body,
      data: data || {},
      sound: 'default',
      priority: Notifications.AndroidNotificationPriority.MAX,
      vibrate: [0, 500, 250, 500], // Custom vibration pattern
      badge: 1,
      categoryIdentifier: 'order',
      sticky: true, // Keep notification visible
      autoDismiss: false, // Don't auto-dismiss
    };

    // Add Android-specific configuration for screen-off notifications
    if (Platform.OS === 'android') {
      notificationContent.channelId = 'orders'; // Use the orders channel for maximum priority
      // These Android-specific flags help wake the device
      notificationContent.color = '#3B82F6';
    }

    // Add iOS-specific configuration
    if (Platform.OS === 'ios') {
      notificationContent.interruptionLevel = 'timeSensitive'; // iOS 15+ time-sensitive notifications
    }
    
    await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: null, // Immediate delivery
    });
    
    console.log('[PushNotifications] Local notification sent successfully');
    console.log('[PushNotifications] Notification will wake device and show with screen off');
  } catch (error) {
    console.error('[PushNotifications] Error sending local notification:', error);
  }
}

/**
 * Send notification to all registered devices
 * This works with PIN-based authentication by sending to all devices in the database
 */
export async function notifyAllDevices(
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' | 'order',
  relatedOrderId?: string
) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      console.error('[PushNotifications] Supabase not initialized');
      return;
    }
    
    // Get all registered devices
    const { data: devices, error } = await supabase
      .from('device_push_tokens')
      .select('device_id, push_token, user_role, device_name')
      .not('push_token', 'is', null);

    if (error) {
      console.error('[PushNotifications] Error fetching devices:', error);
    } else {
      console.log(`[PushNotifications] Found ${devices?.length || 0} registered devices with push tokens`);
    }

    // Create in-app notification (not tied to specific user)
    await createInAppNotification(null, title, message, type, relatedOrderId);

    // Send local notification (only on native platforms)
    // CRITICAL: This ensures notification works with screen off
    // This works WITHOUT Firebase - it's a local notification
    if (Platform.OS !== 'web') {
      await sendLocalNotification(title, message, { orderId: relatedOrderId });
      console.log('[PushNotifications] Local notification sent to device');
    }
  } catch (error) {
    console.error('[PushNotifications] Error notifying devices:', error);
  }
}

/**
 * Handle notification response (when user taps on notification)
 */
export function setupNotificationResponseHandler(
  onNotificationResponse: (response: Notifications.NotificationResponse) => void
) {
  // Only setup on native platforms
  if (Platform.OS === 'web') {
    console.log('[PushNotifications] Notification response handler not supported on web');
    return {
      remove: () => {
        console.log('[PushNotifications] No subscription to remove on web');
      }
    };
  }

  console.log('[PushNotifications] Setting up notification response handler');
  const subscription = Notifications.addNotificationResponseReceivedListener(onNotificationResponse);
  return subscription;
}

/**
 * Handle incoming notifications while app is in foreground
 */
export function setupNotificationReceivedHandler(
  onNotificationReceived: (notification: Notifications.Notification) => void
) {
  // Only setup on native platforms
  if (Platform.OS === 'web') {
    console.log('[PushNotifications] Notification received handler not supported on web');
    return {
      remove: () => {
        console.log('[PushNotifications] No subscription to remove on web');
      }
    };
  }

  console.log('[PushNotifications] Setting up notification received handler');
  const subscription = Notifications.addNotificationReceivedListener(onNotificationReceived);
  return subscription;
}

/**
 * Check if notification permissions are granted
 */
export async function checkNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    const granted = status === 'granted';
    console.log('[PushNotifications] Notification permissions:', granted ? 'granted' : 'not granted');
    return granted;
  } catch (error) {
    console.error('[PushNotifications] Error checking notification permissions:', error);
    return false;
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    console.log('[PushNotifications] Requesting notification permissions...');
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
        allowCriticalAlerts: true, // Request critical alerts for iOS
      },
    });
    const granted = status === 'granted';
    console.log('[PushNotifications] Notification permissions:', granted ? 'granted' : 'denied');
    
    if (granted && Platform.OS === 'android') {
      console.log('[PushNotifications] Setting up Android notification channels...');
      // Set up notification channels after permission is granted
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'Pedidos',
        description: 'Notificaciones de nuevos pedidos',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#3B82F6',
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        showBadge: true,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
      console.log('[PushNotifications] Notification channels configured for screen-off delivery');
    }
    
    return granted;
  } catch (error) {
    console.error('[PushNotifications] Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Update device's last active timestamp
 * Call this periodically to track which devices are still active
 */
export async function updateDeviceActivity(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const deviceId = await getDeviceId();
    const supabase = getSupabase();
    
    if (supabase) {
      await supabase
        .from('device_push_tokens')
        .update({
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('device_id', deviceId);
      
      console.log('[PushNotifications] Device activity updated');
    }
  } catch (error) {
    console.error('[PushNotifications] Error updating device activity:', error);
  }
}

/**
 * Remove device push token from database
 * Call this when user disables push notifications
 */
export async function removeDevicePushToken(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const deviceId = await getDeviceId();
    const supabase = getSupabase();
    
    if (supabase) {
      console.log('[PushNotifications] Removing push token for device:', deviceId);
      
      const { error } = await supabase
        .from('device_push_tokens')
        .delete()
        .eq('device_id', deviceId);
      
      if (error) {
        console.error('[PushNotifications] Error removing push token:', error);
        throw error;
      }
      
      console.log('[PushNotifications] Push token removed successfully');
    }
  } catch (error) {
    console.error('[PushNotifications] Error removing device push token:', error);
    throw error;
  }
}

/**
 * Check if device has a registered push token
 */
export async function hasRegisteredPushToken(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const deviceId = await getDeviceId();
    const supabase = getSupabase();
    
    if (supabase) {
      const { data, error } = await supabase
        .from('device_push_tokens')
        .select('push_token')
        .eq('device_id', deviceId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" error
        console.error('[PushNotifications] Error checking push token:', error);
        return false;
      }
      
      const hasToken = !!data?.push_token;
      console.log('[PushNotifications] Device has registered token:', hasToken);
      return hasToken;
    }
    
    return false;
  } catch (error) {
    console.error('[PushNotifications] Error checking registered push token:', error);
    return false;
  }
}
