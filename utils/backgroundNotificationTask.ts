
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

/**
 * Define the background notification task
 * This task runs when a notification is received while the app is in the background or terminated
 */
TaskManager.defineTask<Notifications.NotificationTaskPayload>(
  BACKGROUND_NOTIFICATION_TASK,
  ({ data, error, executionInfo }) => {
    console.log('Background notification task triggered!');
    
    if (error) {
      console.error('Background notification task error:', error);
      return;
    }

    try {
      // Check if this is a notification response (user tapped on notification)
      const isNotificationResponse = 'actionIdentifier' in data;
      
      if (isNotificationResponse) {
        console.log('User interacted with notification in background');
        const response = data as Notifications.NotificationResponse;
        console.log('Notification response:', response);
        
        // You can handle navigation or other actions here
        // The notification data can be accessed via response.notification.request.content.data
      } else {
        // This is a notification that was received in the background
        console.log('Notification received in background');
        const notification = data as Notifications.Notification;
        console.log('Notification data:', notification);
        
        // The notification will be displayed automatically by the system
        // with sound and vibration based on the channel configuration
      }
    } catch (err) {
      console.error('Error processing background notification:', err);
    }
  }
);

/**
 * Register the background notification task
 * This should be called early in the app lifecycle
 */
export async function registerBackgroundNotificationTask() {
  // Only register on native platforms
  if (Platform.OS === 'web') {
    console.log('Background notifications not supported on web');
    return;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_NOTIFICATION_TASK);
    
    if (!isRegistered) {
      console.log('Registering background notification task...');
      await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('Background notification task registered successfully');
    } else {
      console.log('Background notification task already registered');
    }
  } catch (error) {
    console.error('Error registering background notification task:', error);
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
      console.log('Unregistering background notification task...');
      await Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
      console.log('Background notification task unregistered successfully');
    }
  } catch (error) {
    console.error('Error unregistering background notification task:', error);
  }
}
