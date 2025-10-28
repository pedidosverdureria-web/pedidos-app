
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

/**
 * Define the background notification task
 * This task runs when a notification is received while the app is in the background or terminated
 * CRITICAL: This ensures notifications work even when the screen is off
 */
TaskManager.defineTask<Notifications.NotificationTaskPayload>(
  BACKGROUND_NOTIFICATION_TASK,
  ({ data, error, executionInfo }) => {
    console.log('[BackgroundNotificationTask] Task triggered!');
    console.log('[BackgroundNotificationTask] Execution info:', executionInfo);
    
    if (error) {
      console.error('[BackgroundNotificationTask] Error:', error);
      return;
    }

    try {
      // Check if this is a notification response (user tapped on notification)
      const isNotificationResponse = 'actionIdentifier' in data;
      
      if (isNotificationResponse) {
        console.log('[BackgroundNotificationTask] User interacted with notification in background');
        const response = data as Notifications.NotificationResponse;
        console.log('[BackgroundNotificationTask] Notification response:', {
          actionIdentifier: response.actionIdentifier,
          userText: response.userText,
          notificationId: response.notification.request.identifier,
        });
        
        // You can handle navigation or other actions here
        // The notification data can be accessed via response.notification.request.content.data
      } else {
        // This is a notification that was received in the background
        console.log('[BackgroundNotificationTask] Notification received in background');
        const notification = data as Notifications.Notification;
        console.log('[BackgroundNotificationTask] Notification data:', {
          identifier: notification.request.identifier,
          title: notification.request.content.title,
          body: notification.request.content.body,
          data: notification.request.content.data,
        });
        
        // The notification will be displayed automatically by the system
        // with sound and vibration based on the channel configuration
        console.log('[BackgroundNotificationTask] Notification will be displayed by system');
      }
    } catch (err) {
      console.error('[BackgroundNotificationTask] Error processing notification:', err);
    }
  }
);

/**
 * Register the background notification task
 * This should be called early in the app lifecycle
 * CRITICAL: This must be registered for notifications to work when screen is off
 */
export async function registerBackgroundNotificationTask() {
  // Only register on native platforms
  if (Platform.OS === 'web') {
    console.log('[BackgroundNotificationTask] Not supported on web');
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    
    if (!isRegistered) {
      console.log('[BackgroundNotificationTask] Registering task...');
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('[BackgroundNotificationTask] Task registered successfully');
      console.log('[BackgroundNotificationTask] Notifications will now work with screen off');
    } else {
      console.log('[BackgroundNotificationTask] Task already registered');
    }
  } catch (error) {
    console.error('[BackgroundNotificationTask] Error registering task:', error);
    throw error;
  }
}

/**
 * Unregister the background notification task
 */
export async function unregisterBackgroundNotificationTask() {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    
    if (isRegistered) {
      console.log('[BackgroundNotificationTask] Unregistering task...');
      await Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('[BackgroundNotificationTask] Task unregistered successfully');
    }
  } catch (error) {
    console.error('[BackgroundNotificationTask] Error unregistering task:', error);
  }
}
