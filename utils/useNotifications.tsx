import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

type NotificationContent = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

function useNotifications() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  async function scheduleNotification(
    content: NotificationContent,
    trigger?: Notifications.NotificationTriggerInput
  ) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          data: content.data || {}
        },
        trigger: trigger || null
      });
      return id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  async function cancelNotification(notificationId: string) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  useEffect(() => {
    async function setChannel() {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250]
      });
    }

    setChannel();

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('Received notification:', notification);
      });

    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('User interacted with notification:', response);
      });

    return () => {
      Notifications.removeNotificationSubscription(
        notificationListener.current
      );
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return {
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications
  };
}

export default useNotifications;
