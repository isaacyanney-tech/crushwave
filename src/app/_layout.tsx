import * as Notifications from 'expo-notifications';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/lib/auth';
import { registerForPush } from '@/lib/push';
import { colors } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Sends people to the right place: sign in, finish profile, or the app. */
function Gate() {
  const { loading, session, profile } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync().catch(() => undefined);
    const first = segments[0] as string | undefined;
    const inAuth = first === 'welcome' || first === 'sign-in' || first === 'verify-code';
    const inOnboarding = first === 'onboarding' || first === 'privacy' || first === 'rules';

    if (!session) {
      if (!inAuth) router.replace('/welcome');
    } else if (!profile) {
      if (!inOnboarding) router.replace('/onboarding');
    } else if (profile.status !== 'active') {
      if (first !== 'suspended') router.replace('/suspended');
    } else if (inAuth || inOnboarding || !first || first === 'suspended') {
      router.replace('/discover');
    }
  }, [loading, session, profile, segments]);

  // Push notifications once the profile exists; tapping one opens the chat.
  useEffect(() => {
    if (!profile) return;
    registerForPush();
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const matchId = res.notification.request.content.data?.match_id;
      if (typeof matchId === 'string') router.push(`/chat/${matchId}`);
    });
    return () => sub.remove();
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Gate />
      <Stack
        screenOptions={{
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="verify-code" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="suspended" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ title: '', headerBackTitle: 'Chats' }} />
        <Stack.Screen name="edit-profile" options={{ title: 'Edit profile' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings & privacy' }} />
        <Stack.Screen name="safety" options={{ title: 'Safety Centre' }} />
        <Stack.Screen name="rules" options={{ title: 'Community rules' }} />
        <Stack.Screen name="privacy" options={{ title: 'Privacy' }} />
        <Stack.Screen name="verify-selfie" options={{ title: 'Get verified' }} />
        <Stack.Screen name="filters" options={{ title: 'Filters', presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}
