import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { usePhotoUrls } from '@/components/ProfileCard';
import { H1, P } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';

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
        <P muted>When you and someone both like each other, they’ll show up here and you can start chatting.</P>
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
          <View style={{ paddingTop: space(3) }}>
            <Text style={styles.section}>New matches</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space(4), gap: space(3) }}>
              {fresh.map((r) => (
                <Pressable key={r.match_id} onPress={() => router.push(`/chat/${r.match_id}`)} style={{ alignItems: 'center' }}>
                  <Image source={urls[r.photos[0]] ? { uri: urls[r.photos[0]] } : undefined} style={styles.bigAvatar} />
                  <Text style={styles.freshName}>{r.first_name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={[styles.section, { marginTop: space(5) }]}>Chats</Text>
          </View>
        ) : (
          <Text style={[styles.section, { marginTop: space(3) }]}>Chats</Text>
        )
      }
      ListEmptyComponent={<P muted>{'   '}Say hi to one of your new matches.</P>}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/chat/${item.match_id}`)}>
          <Image source={urls[item.photos[0]] ? { uri: urls[item.photos[0]] } : undefined} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.name}>{item.first_name}</Text>
              {item.is_verified ? <Ionicons name="checkmark-circle" size={16} color={colors.verified} /> : null}
            </View>
            <Text style={[styles.preview, item.unread > 0 && { color: colors.ink, fontWeight: '700' }]} numberOfLines={1}>
              {item.last_message_mine ? 'You: ' : ''}
              {item.last_message}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={styles.time}>{item.last_message_at ? timeAgo(item.last_message_at) : ''}</Text>
            {item.unread > 0 ? (
              <View style={styles.unread}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            ) : null}
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: space(6) },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, marginHorizontal: space(4), marginBottom: space(3) },
  bigAvatar: { width: 76, height: 95, borderRadius: radius.md, backgroundColor: colors.line },
  freshName: { marginTop: space(1), fontWeight: '600', color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingHorizontal: space(4), paddingVertical: space(3) },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.line },
  name: { fontSize: 16, fontWeight: '700', color: colors.ink },
  preview: { fontSize: 14, color: colors.muted, marginTop: 2 },
  time: { fontSize: 12, color: colors.muted },
  unread: { backgroundColor: colors.primary, borderRadius: radius.pill, minWidth: 20, paddingHorizontal: 6, alignItems: 'center' },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
