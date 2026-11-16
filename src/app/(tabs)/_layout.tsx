import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/tabs';
import { Platform } from 'react-native';

import { useAuth } from '@/lib/auth';
import { colors, fonts } from '@/lib/theme';
import { useUnreadCount } from '@/lib/unread';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(on: IconName, off: IconName) {
  return ({ color, focused }: { color: unknown; focused: boolean }) => (
    <Ionicons name={focused ? on : off} color={color as string} size={24} />
  );
}

export default function TabsLayout() {
  const { profile } = useAuth();
  const unread = useUnreadCount(!!profile);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
        tabBarStyle: {
          backgroundColor: colors.bg,
          borderTopColor: colors.line,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleAlign: 'left',
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: icon('albums', 'albums-outline') }} />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Chats',
          tabBarIcon: icon('chatbubbles', 'chatbubbles-outline'),
          tabBarBadge: unread > 0 ? (unread > 9 ? '9+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.white, fontFamily: fonts.semibold, fontSize: 11 },
        }}
      />
      <Tabs.Screen name="me" options={{ title: 'Profile', tabBarIcon: icon('person', 'person-outline') }} />
    </Tabs>
  );
}
