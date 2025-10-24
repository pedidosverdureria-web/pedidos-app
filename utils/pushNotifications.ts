
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSupabase } from '@/lib/supabase';

// Configure notification handler (only on native platforms)
// This ensures notifications are shown with sound and vibration even when app is in foreground
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
}

/**
 * Register for push notifications and save the token to the database
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  // Push notifications are not supported on web
  if (Platform.OS === 'web') {
    console.log('Push notifications not supported on web');
    return null;
  }

  let token: string | null = null;

  if (Platform.OS === 'android') {
    // Create default notification channel with high priority
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Predeterminado',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
      enableVibrate: true,
      enableLights: true,
      showBadge: true,
    });

    // Create order notifications channel with maximum priority for background notifications
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
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: true,
          allowCriticalAlerts: false,
        },
      });
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      const pushToken = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Replace with your Expo project ID
      });
      token = pushToken.data;
      console.log('Push token:', token);

      // Save token to database
      const supabase = getSupabase();
      if (supabase) {
        await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('user_id', userId);
      }
    } catch (e) {
      console.error('Error getting push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
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
      console.error('Supabase not initialized');
      return;
    }

    const { error } = await supabase.from('notifications').insert([
      {
        user_id: userId,
        title,
        message,
        type,
        related_order_id: relatedOrderId,
        is_read: false,
      },
    ]);

    if (error) {
      console.error('Error creating in-app notification:', error);
    }
  } catch (error) {
    console.error('Error creating in-app notification:', error);
  }
}

/**
 * Send a local push notification with sound and vibration
 * This will work even when the screen is off or app is in background
 */
export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
) {
  // Local notifications not supported on web
  if (Platform.OS === 'web') {
    console.log('Local notifications not supported on web');
    return;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: [0, 500, 250, 500], // Custom vibration pattern
        badge: 1,
        categoryIdentifier: 'order',
        ...(Platform.OS === 'android' && {
          channelId: 'orders', // Use the orders channel for maximum priority
        }),
      },
      trigger: null, // Immediate delivery
    });
    console.log('Local notification sent successfully');
  } catch (error) {
    console.error('Error sending local notification:', error);
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
      console.error('Supabase not initialized');
      return;
    }
    
    // Get all admin users
    const { data: admins, error } = await supabase
      .from('profiles')
      .select('user_id, push_token')
      .eq('role', 'admin')
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching admins:', error);
      return;
    }

    // Create in-app notifications for all admins
    for (const admin of admins || []) {
      await createInAppNotification(admin.user_id, title, message, type, relatedOrderId);
    }

    // Send local notification (only on native platforms)
    if (Platform.OS !== 'web') {
      await sendLocalNotification(title, message, { orderId: relatedOrderId });
    }
  } catch (error) {
    console.error('Error notifying admins:', error);
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
    console.log('Notification response handler not supported on web');
    return {
      remove: () => {
        console.log('No subscription to remove on web');
      }
    };
  }

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
    console.log('Notification received handler not supported on web');
    return {
      remove: () => {
        console.log('No subscription to remove on web');
      }
    };
  }

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
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
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
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowAnnouncements: true,
      },
    });
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}
