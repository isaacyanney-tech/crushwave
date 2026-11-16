import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePhotoUrls } from '@/components/ProfileCard';
import { H1, P } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, fonts, radius, space, type } from '@/lib/theme';

export type MatchRow = {
  match_id: string;
  matched_at: string;
  user_id: string;
  first_name: string;
  age: number;
  programme: string | null;
  level: number | null;
  hall: string | null;
  bio: string;
  interests: string[];
  prompts: { q: string; a: string }[];
  photos: string[];
  is_verified: boolean;
  last_message: string | null;
  last_message_at: string | null;
  last_message_mine: boolean | null;
  unread: number;
};

function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export default function Matches() {
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_my_matches');
    setRows((data ?? []) as MatchRow[]);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Live updates: new messages or new matches refresh the list.
  useEffect(() => {
    const ch = supabase
      .channel('matches-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const fresh = rows.filter((r) => !r.last_message);
  const chats = rows.filter((r) => r.last_message);
  const urls = usePhotoUrls(rows.map((r) => r.photos[0]).filter(Boolean));

  if (!rows.length && !loading) {
    return (
      <ScrollView
        contentContainerStyle={styles.empty}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <H1>No matches yet</H1>
        <P muted>When you and someone like each other, they appear here and you can start a chat.</P>
      </ScrollView>
    );
  }

  return (
    <FlatList
      data={chats}
      keyExtractor={(r) => r.match_id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      ListHeaderComponent={
        fresh.length ? (
          <View style={{ paddingTop: space(2) }}>
            <Text style={styles.section}>New matches</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(4), gap: space(3) }}>
              {fresh.map((r) => (
                <Pressable key={r.match_id} onPress={() => router.push(`/chat/${r.match_id}`)} style={{ alignItems: 'center' }}>
                  <Image source={urls[r.photos[0]] ? { uri: urls[r.photos[0]] } : undefined} style={styles.bigAvatar} />
                  <Text style={styles.freshName}>{r.first_name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={[styles.section, { marginTop: space(8) }]}>Chats</Text>
          </View>
        ) : (
          <Text style={[styles.section, { marginTop: space(2) }]}>Chats</Text>
        )
      }
      ListEmptyComponent={<Text style={styles.emptyChats}>No chats yet. Pick one of your new matches above and say hello.</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/chat/${item.match_id}`)}>
          <Image source={urls[item.photos[0]] ? { uri: urls[item.photos[0]] } : undefined} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space(1) }}>
              <Text style={styles.name}>{item.first_name}</Text>
              {item.is_verified ? <Ionicons name="checkmark-circle" size={16} color={colors.positive} accessibilityLabel="Verified" /> : null}
            </View>
            <Text style={[styles.preview, item.unread > 0 && { color: colors.ink, fontFamily: fonts.medium }]} numberOfLines={1}>
              {item.last_message_mine ? 'You: ' : ''}
              {item.last_message}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: space(1) }}>
            <Text style={styles.time}>{item.last_message_at ? timeAgo(item.last_message_at) : ''}</Text>
            {item.unread > 0 ? <View style={styles.unreadDot} accessibilityLabel={`${item.unread} unread`} /> : null}
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1, justifyContent: 'center', padding: space(6) },
  emptyChats: { ...type.small, marginHorizontal: space(4) },
  section: { ...type.heading, marginHorizontal: space(4), marginBottom: space(3) },
  bigAvatar: { width: 76, height: 96, borderRadius: radius.control, backgroundColor: colors.raised },
  freshName: { ...type.label, fontSize: 14, marginTop: space(2) },
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingHorizontal: space(4), height: 76 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.raised },
  name: { ...type.label, fontSize: 16 },
  preview: { ...type.small, color: colors.muted, marginTop: 2 },
  time: { ...type.meta, fontVariant: ['tabular-nums'] },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
});
