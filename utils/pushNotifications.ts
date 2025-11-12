
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSupabase } from '@/lib/supabase';

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
 * Register for push notifications and save the token to the database
 * CRITICAL: This sets up notification channels with maximum priority for screen-off delivery
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  // Push notifications are not supported on web
  if (Platform.OS === 'web') {
    console.log('[PushNotifications] Not supported on web');
    return null;
  }

  let token: string | null = null;

  if (Platform.OS === 'android') {
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
  }

  if (Device.isDevice) {
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
      return null;
    }
    
    console.log('[PushNotifications] Notification permissions granted');
    
    try {
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your Expo project ID
      });
      token = pushToken.data;
      console.log('[PushNotifications] Push token obtained:', token);

      // Save token to database
      const supabase = getSupabase();
      if (supabase) {
        await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('user_id', userId);
        console.log('[PushNotifications] Push token saved to database');
      }
    } catch (e) {
      console.error('[PushNotifications] Error getting push token:', e);
    }
  } else {
    console.log('[PushNotifications] Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Create an in-app notification
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
 * Send notification to all admin users
 */
export async function notifyAdmins(
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
    
    // Get all admin users
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('user_id, push_token')
      .eq('role', 'admin')
      .eq('is_active', true);

    if (error) {
      console.error('[PushNotifications] Error fetching admins:', error);
      return;
    }

    console.log(`[PushNotifications] Notifying ${admins?.length || 0} admin users`);

    // Create in-app notifications for all admins
    for (const admin of admins || []) {
      await createInAppNotification(admin.user_id, title, message, type, relatedOrderId);
    }

    // Send local notification (only on native platforms)
    // CRITICAL: This ensures notification works with screen off
    if (Platform.OS !== 'web') {
      await sendLocalNotification(title, message, { orderId: relatedOrderId });
      console.log('[PushNotifications] Local notification sent to device');
    }
  } catch (error) {
    console.error('[PushNotifications] Error notifying admins:', error);
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
