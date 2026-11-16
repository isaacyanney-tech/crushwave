import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/tabs';
import { Platform } from 'react-native';

import { useAuth } from '@/lib/auth';
import { colors } from '@/lib/theme';
import { useUnreadCount } from '@/lib/unread';

type IconName = keyof typeof Ionicons.glyphMap;

function icon(on: IconName, off: IconName) {
  return ({ color, focused }: { color: unknown; focused: boolean }) => (
    <Ionicons name={focused ? on : off} color={color as string} size={26} />
  );
}

export default function TabsLayout() {
  const { profile } = useAuth();
  const unread = useUnreadCount(!!profile);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.line,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleAlign: 'left',
        headerTitleStyle: { fontWeight: '900', fontSize: 26, color: colors.ink },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: icon('flame', 'flame-outline') }} />
      <Tabs.Screen
        name="matches"
        options={{
          title: 'Chats',
          tabBarIcon: icon('chatbubbles', 'chatbubbles-outline'),
          tabBarBadge: unread > 0 ? (unread > 9 ? '9+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.primary, color: '#fff', fontSize: 11, fontWeight: '800' },
        }}
      />
      <Tabs.Screen name="me" options={{ title: 'Profile', tabBarIcon: icon('person-circle', 'person-circle-outline') }} />
    </Tabs>
  );
}
