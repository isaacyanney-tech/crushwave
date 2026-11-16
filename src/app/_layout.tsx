import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, router, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AuthProvider, useAuth } from '@/lib/auth';
import { registerForPush } from '@/lib/push';
import { colors, fonts } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Sends people to the right place: sign in, finish profile, or the app. */
function Gate({ fontsReady }: { fontsReady: boolean }) {
  const { loading: authLoading, session, profile } = useAuth();
  const loading = authLoading || !fontsReady;
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
  // Only the four weights we use, so the bundle stays small.
  const [fontsLoaded, fontError] = useFonts({
    Figtree_400Regular: require('@expo-google-fonts/figtree/400Regular/Figtree_400Regular.ttf'),
    Figtree_500Medium: require('@expo-google-fonts/figtree/500Medium/Figtree_500Medium.ttf'),
    Figtree_600SemiBold: require('@expo-google-fonts/figtree/600SemiBold/Figtree_600SemiBold.ttf'),
    Newsreader_500Medium: require('@expo-google-fonts/newsreader/500Medium/Newsreader_500Medium.ttf'),
  });
  // If fonts fail to load the app still works with the system font.
  const fontsReady = fontsLoaded || !!fontError;

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Gate fontsReady={fontsReady} />
      <Stack
        screenOptions={{
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
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
