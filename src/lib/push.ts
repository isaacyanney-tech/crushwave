import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let currentToken: string | null = null;

/**
 * Asks for notification permission and saves this phone's push address.
 * Push needs a real build of the app (not Expo Go on Android), so any
 * failure here is ignored and the app keeps working without push.
 */
export async function registerForPush(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Matches and messages',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    currentToken = token;
    await supabase.rpc('register_push_token', { p_token: token });
  } catch {
    // Push is optional.
  }
}

export async function unregisterPush(): Promise<void> {
  if (!currentToken) return;
  try {
    await supabase.rpc('remove_push_token', { p_token: currentToken });
  } catch {
    // ignore
  }
  currentToken = null;
}
