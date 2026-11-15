import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { ProfileCard, type PublicProfile, usePhotoUrls } from '@/components/ProfileCard';
import { SafetySheet } from '@/components/SafetySheet';
import { Button, H1, P } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { activeFilterCount, useFilters } from '@/lib/filters';
import { friendlyError, supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';
import { Image } from 'expo-image';

export default function Discover() {
  const { session, profile } = useAuth();
  const filters = useFilters();
  const navigation = useNavigation();
  const [deck, setDeck] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [match, setMatch] = useState<{ id: string; person: PublicProfile } | null>(null);
  const slide = useRef(new Animated.Value(0)).current;
  const busy = useRef(false);

  const nFilters = activeFilterCount(filters);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable onPress={() => router.push('/filters')} hitSlop={12} style={{ marginRight: space(4), flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="options" size={24} color={colors.ink} />
          {nFilters ? <Text style={styles.filterBadge}>{nFilters}</Text> : null}
        </Pressable>
      ),
    });
  }, [navigation, nFilters]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_discovery', {
      p_limit: 20,
      p_level: filters.level,
      p_programme: filters.programme.trim() || null,
      p_hall: filters.hall.trim() || null,
      p_looking_for: filters.lookingFor,
    });
    setLoading(false);
    if (error) return Alert.alert('Could not load people', friendlyError(error));
    setDeck((data ?? []) as PublicProfile[]);
  }, [filters]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const current = deck[0];

  const decide = async (liked: boolean) => {
    if (!current || busy.current) return;
    busy.current = true;
    Haptics.impactAsync(liked ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    const person = current;
    Animated.timing(slide, { toValue: liked ? 1 : -1, duration: 220, useNativeDriver: true }).start(() => {
      setDeck((d) => d.slice(1));
      slide.setValue(0);
      busy.current = false;
    });

    const { error } = await supabase
      .from('swipes')
      .insert({ swiper_id: session!.user.id, target_id: person.id, liked });
    if (error && !/duplicate/i.test(error.message)) {
      Alert.alert('Hmm', friendlyError(error));
      return;
    }
    if (liked) {
      const { data } = await supabase
        .from('matches')
        .select('id')
        .or(`user_a.eq.${person.id},user_b.eq.${person.id}`)
        .maybeSingle<{ id: string }>();
      if (data) setMatch({ id: data.id, person });
    }
    if (deck.length <= 3) load();
  };

  if (profile?.is_paused) {
    return (
      <View style={styles.center}>
        <H1>Your profile is paused</H1>
        <P muted>Nobody new can see you right now, and you won’t see new people. Your matches and chats still work.</P>
        <Button title="Open settings" onPress={() => router.push('/settings')} />
      </View>
    );
  }

  if (loading && !current) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 56 }}>🌊</Text>
        <H1>You’ve seen everyone for now</H1>
        <P muted>New students join every day. Check back later, change your filters, or invite your friends.</P>
        <Button
          title="Invite friends"
          onPress={() =>
            Share.share({
              message: 'I’m on Crushwave, the dating and friends app just for verified students. Join with your student email!',
            })
          }
          style={{ alignSelf: 'stretch', marginBottom: space(3) }}
        />
        <Button title="Refresh" variant="secondary" onPress={load} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const translateX = slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [-500, 0, 500] });
  const rotate = slide.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-12deg', '0deg', '12deg'] });

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[styles.cardWrap, { transform: [{ translateX }, { rotate }] }]}>
        <ProfileCard profile={current} onMore={() => setSafetyOpen(true)} />
      </Animated.View>

      <View style={styles.actions}>
        <Pressable style={[styles.round, styles.pass]} onPress={() => decide(false)} accessibilityLabel="Pass">
          <Ionicons name="close" size={34} color={colors.danger} />
        </Pressable>
        <Pressable style={[styles.round, styles.like]} onPress={() => decide(true)} accessibilityLabel="Like">
          <Ionicons name="heart" size={34} color="#fff" />
        </Pressable>
      </View>

      <SafetySheet
        visible={safetyOpen}
        targetId={current.id}
        targetName={current.first_name}
        onClose={() => setSafetyOpen(false)}
        onDone={() => setDeck((d) => d.filter((p) => p.id !== current.id))}
      />

      <MatchModal
        match={match}
        onClose={() => setMatch(null)}
        onChat={() => {
          const id = match!.id;
          setMatch(null);
          router.push(`/chat/${id}`);
        }}
      />
    </View>
  );
}

function MatchModal({
  match,
  onClose,
  onChat,
}: {
  match: { id: string; person: PublicProfile } | null;
  onClose: () => void;
  onChat: () => void;
}) {
  const urls = usePhotoUrls(match ? match.person.photos.slice(0, 1) : []);
  const photo = match?.person.photos[0];
  return (
    <Modal visible={!!match} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.matchBg}>
        <Text style={styles.matchTitle}>It’s a match! 💘</Text>
        {photo && urls[photo] ? <Image source={{ uri: urls[photo] }} style={styles.matchPhoto} /> : null}
        <Text style={styles.matchText}>You and {match?.person.first_name} liked each other.</Text>
        <Button title="Send a message" onPress={onChat} style={{ alignSelf: 'stretch', marginBottom: space(3) }} />
        <Button title="Keep swiping" variant="secondary" onPress={onClose} style={{ alignSelf: 'stretch' }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space(6) },
  cardWrap: { flex: 1, paddingHorizontal: space(4), paddingTop: space(2) },
  actions: {
    position: 'absolute',
    bottom: space(5),
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space(10),
  },
  round: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  pass: { backgroundColor: '#fff' },
  like: { backgroundColor: colors.primary },
  filterBadge: {
    marginLeft: 4,
    backgroundColor: colors.primary,
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  matchBg: { flex: 1, backgroundColor: 'rgba(27,27,58,0.92)', alignItems: 'center', justifyContent: 'center', padding: space(8) },
  matchTitle: { color: '#fff', fontSize: 34, fontWeight: '900', marginBottom: space(6) },
  matchPhoto: { width: 180, height: 225, borderRadius: radius.lg, marginBottom: space(5), borderWidth: 4, borderColor: '#fff' },
  matchText: { color: '#fff', fontSize: 17, marginBottom: space(8), textAlign: 'center' },
});
