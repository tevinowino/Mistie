import { useAuth } from '@/src/context/AuthContext';
import { supabase } from '@/src/lib/supabase';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

// Configure how notifications behave when the app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotifications = () => {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    // Listen for incoming notifications (Foreground)
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Listen for interactions (Tapping notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Handle Deep Linking / Navigation
      if (data?.route) {
        router.push(data.route as any);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Sync Token to Profile when User + Token are available
  useEffect(() => {
    if (user && expoPushToken) {
      syncTokenToProfile(user.id, expoPushToken);
    }
  }, [user, expoPushToken]);

  const syncTokenToProfile = async (userId: string, token: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId);

      if (error) {
        console.error('Error syncing push token:', error);
      }
    } catch (error) {
      console.error('Error in syncTokenToProfile:', error);
    }
  };

  return {
    expoPushToken,
    notification
  };
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }

    // Get the Expo Push Token
    // Ideally, for production with EAS Build, you'd use getDevicePushTokenAsync() 
    // or configure projectId properly. For now, we use standard Expo Push Token.
    // We try/catch because sometimes projectId config is tricky in Dev.
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: '43723db9-164d-451f-af1d-5f302c5d21aa',
      });
      token = tokenData.data;
      console.log('Push Token:', token);
    } catch (error) {
      console.log('Error getting push token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}
