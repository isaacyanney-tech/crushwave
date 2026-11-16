import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileCard, usePhotoUrls } from '@/components/ProfileCard';
import { SafetySheet } from '@/components/SafetySheet';
import { Banner, Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { MONEY_WARNING, PHONE_WARNING, containsPhoneNumber, looksLikeMoneyRequest } from '@/lib/safety';
import { friendlyError, supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';
import type { MatchRow } from '../(tabs)/matches';

type Message = { id: number; match_id: string; sender_id: string; body: string; created_at: string; read_at: string | null };

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const me = session!.user.id;
  const navigation = useNavigation();
  const [other, setOther] = useState<MatchRow | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [safety, setSafety] = useState<{ messageId?: number } | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);
  const urls = usePhotoUrls(other ? other.photos.slice(0, 1) : []);

  const loadOther = useCallback(async () => {
    const { data } = await supabase.rpc('get_my_matches');
    const row = ((data ?? []) as MatchRow[]).find((r) => r.match_id === id) ?? null;
    if (!row) {
      Alert.alert('Chat not available', 'This match has ended.');
      router.back();
      return;
    }
    setOther(row);
  }, [id]);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', id)
      .order('created_at', { ascending: false })
      .limit(200);
    setMessages((data ?? []) as Message[]);
    supabase.rpc('mark_match_read', { p_match: id }).then(() => undefined);
  }, [id]);

  useEffect(() => {
    loadOther();
    loadMessages();
    const ch = supabase
      .channel(`chat-${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${id}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [m, ...prev]));
          if (m.sender_id !== me) supabase.rpc('mark_match_read', { p_match: id }).then(() => undefined);
        },
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${id}` }, () => {
        Alert.alert('Chat ended', 'This match has ended.');
        router.back();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, me, loadOther, loadMessages]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () =>
        other ? (
          <Pressable onPress={() => setShowProfile(true)} style={styles.header}>
            {urls[other.photos[0]] ? <Image source={{ uri: urls[other.photos[0]] }} style={styles.headerAvatar} /> : null}
            <Text style={styles.headerName}>{other.first_name}</Text>
            {other.is_verified ? <Ionicons name="checkmark-circle" size={16} color={colors.verified} /> : null}
          </Pressable>
        ) : null,
      headerRight: () => (
        <Pressable onPress={() => setSafety({})} hitSlop={12} accessibilityLabel="Safety options">
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.ink} />
        </Pressable>
      ),
    });
  }, [navigation, other, urls]);

  const reallySend = async (body: string) => {
    setSending(true);
    const { data, error } = await supabase
      .from('messages')
      .insert({ match_id: id, sender_id: me, body })
      .select()
      .single<Message>();
    setSending(false);
    if (error) return Alert.alert('Not sent', friendlyError(error));
    setText('');
    setMessages((prev) => (prev.some((p) => p.id === data.id) ? prev : [data, ...prev]));
  };

  const send = () => {
    const body = text.trim();
    if (!body || sending) return;
    if (looksLikeMoneyRequest(body)) {
      Alert.alert('Talking about money?', `${MONEY_WARNING} Send anyway?`, [
        { text: 'Edit', style: 'cancel' },
        { text: 'Send', onPress: () => reallySend(body) },
      ]);
      return;
    }
    reallySend(body);
  };

  const showMoneyBanner = messages.some((m) => m.sender_id !== me && looksLikeMoneyRequest(m.body));
  const showPhoneBanner = !showMoneyBanner && messages.some((m) => containsPhoneNumber(m.body));

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90} style={{ flex: 1 }}>
        {showMoneyBanner ? (
          <View style={{ paddingHorizontal: space(4), paddingTop: space(2) }}>
            <Banner text={MONEY_WARNING} />
          </View>
        ) : showPhoneBanner ? (
          <View style={{ paddingHorizontal: space(4), paddingTop: space(2) }}>
            <Banner tone="info" text={PHONE_WARNING} />
          </View>
        ) : null}
        <FlatList
          ref={listRef}
          inverted
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: space(4) }}
          ListFooterComponent={
            other && !messages.length ? (
              <Text style={styles.starter}>
                You matched with {other.first_name}. {other.prompts[0] ? `Ask about “${other.prompts[0].q}”` : 'Say hi'}
              </Text>
            ) : undefined
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === me;
            return (
              <Pressable
                onLongPress={() => (!mine ? setSafety({ messageId: item.id }) : undefined)}
                style={[styles.bubble, mine ? styles.mine : styles.theirs]}
              >
                <Text style={[styles.bubbleText, mine && { color: '#fff' }]}>{item.body}</Text>
              </Pressable>
            );
          }}
        />
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={2000}
          />
          <Pressable onPress={send} disabled={!text.trim() || sending} style={[styles.send, (!text.trim() || sending) && { opacity: 0.4 }]}>
            <Ionicons name="send" size={20} color="#fff" />
          </Pressable>
        </View>
        <Text style={styles.hint}>Press and hold a message to report it.</Text>
      </KeyboardAvoidingView>

      {other ? (
        <SafetySheet
          visible={!!safety}
          targetId={other.user_id}
          targetName={other.first_name}
          matchId={id}
          messageId={safety?.messageId}
          canUnmatch
          onClose={() => setSafety(null)}
          onDone={() => router.back()}
        />
      ) : null}

      <Modal visible={showProfile} animationType="slide" onRequestClose={() => setShowProfile(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: space(4) }}>
          {other ? (
            <ProfileCard
              profile={{ ...other, id: other.user_id }}
              footer={<Button title="Close" variant="secondary" onPress={() => setShowProfile(false)} />}
            />
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  headerAvatar: { width: 32, height: 32, borderRadius: 16 },
  headerName: { fontSize: 17, fontWeight: '700', color: colors.ink },
  starter: { textAlign: 'center', color: colors.muted, marginVertical: space(6), fontSize: 15 },
  bubble: { maxWidth: '80%', borderRadius: radius.lg, paddingHorizontal: space(4), paddingVertical: space(2.5), marginVertical: 3 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: 6 },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderBottomLeftRadius: 6 },
  bubbleText: { fontSize: 16, lineHeight: 22, color: colors.ink },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: space(2), paddingHorizontal: space(3), paddingTop: space(2) },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    fontSize: 16,
    color: colors.ink,
  },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 11, color: colors.muted, textAlign: 'center', paddingVertical: space(1.5) },
});
