import { Stack } from 'expo-router';

import { colors } from '@/lib/theme';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        contentStyle: { backgroundColor: colors.bg },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Welcome' }} />
      <Stack.Screen name="profile" options={{ title: 'Your profile' }} />
    </Stack>
  );
}
