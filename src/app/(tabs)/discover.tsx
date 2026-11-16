import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Easing, Modal, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { ProfileCard, type PublicProfile, usePhotoUrls } from '@/components/ProfileCard';
import { SafetySheet } from '@/components/SafetySheet';
import { Button, H1, P } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { activeFilterCount, useFilters } from '@/lib/filters';
import { friendlyError, supabase } from '@/lib/supabase';
import { colors, fonts, radius, space, type } from '@/lib/theme';
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
        <Pressable
          onPress={() => router.push('/filters')}
          hitSlop={12}
          style={styles.filterBtn}
          accessibilityLabel={nFilters ? `Filters, ${nFilters} on` : 'Filters'}
        >
          <Ionicons name="options-outline" size={22} color={colors.ink} />
          {nFilters ? <Text style={styles.filterCount}>{nFilters}</Text> : null}
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
    Animated.timing(slide, { toValue: liked ? 1 : -1, duration: 240, easing: Easing.bezier(0.22, 1, 0.36, 1), useNativeDriver: true }).start(() => {
      setDeck((d) => d.slice(1));
      slide.setValue(0);
      busy.current = false;
    });

    const { error } = await supabase
      .from('swipes')
      .insert({ swiper_id: session!.user.id, target_id: person.id, liked });
    if (error && !/duplicate/i.test(error.message)) {
      Alert.alert('Could not save that', friendlyError(error));
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
        <ActivityIndicator color={colors.muted} />
      </View>
    );
  }

  if (!current) {
    return (
      <View style={styles.center}>
        <H1>You’ve seen everyone for now</H1>
        <P muted>More students join over time. Check back later, loosen your filters, or invite a friend from your campus.</P>
        <Button
          title="Invite a friend"
          onPress={() =>
            Share.share({
              message: 'I’m on Crushwave, the dating and friends app for verified students. You join with your student email.',
            })
          }
          style={{ alignSelf: 'stretch', marginBottom: space(3) }}
        />
        <Button title="Look again" variant="secondary" onPress={load} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const translateX = slide.interpolate({ inputRange: [-1, 0, 1], outputRange: [-500, 0, 500] });
  const rotate = slide.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-6deg', '0deg', '6deg'] });

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={[styles.cardWrap, { transform: [{ translateX }, { rotate }] }]}>
        <ProfileCard profile={current} onMore={() => setSafetyOpen(true)} />
      </Animated.View>

      <View style={styles.actions}>
        <Button title="Pass" icon="close" variant="secondary" onPress={() => decide(false)} style={{ flex: 1 }} />
        <Button title="Like" icon="heart-outline" variant="accent" onPress={() => decide(true)} style={{ flex: 1 }} />
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
  const { profile } = useAuth();
  const mine = profile?.photos[0];
  const theirs = match?.person.photos[0];
  const urls = usePhotoUrls([mine, theirs].filter(Boolean) as string[]);
  return (
    <Modal visible={!!match} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.matchBg}>
        <View style={styles.matchSheet}>
          {/* The match moment: two photos side by side, like passport photos on a page. */}
          <View style={styles.pair}>
            <View style={[styles.matchPhoto, { transform: [{ rotate: '-4deg' }], marginRight: -space(4) }]}>
              {mine && urls[mine] ? <Image source={{ uri: urls[mine] }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
            </View>
            <View style={[styles.matchPhoto, { transform: [{ rotate: '3deg' }], zIndex: 1 }]}>
              {theirs && urls[theirs] ? <Image source={{ uri: urls[theirs] }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
            </View>
          </View>
          <Text style={styles.matchTitle}>{match?.person.first_name} likes you too</Text>
          <Text style={styles.matchText}>You can message each other now.</Text>
          <Button title="Send a message" variant="accent" onPress={onChat} style={{ alignSelf: 'stretch', marginBottom: space(3) }} />
          <Button title="Keep looking" variant="secondary" onPress={onClose} style={{ alignSelf: 'stretch' }} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: space(6) },
  cardWrap: { flex: 1, paddingHorizontal: space(4), paddingTop: space(2) },
  actions: {
    flexDirection: 'row',
    gap: space(3),
    paddingHorizontal: space(4),
    paddingTop: space(3),
    paddingBottom: space(3),
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.bg,
  },
  filterBtn: { marginRight: space(4), flexDirection: 'row', alignItems: 'center', gap: space(1) },
  filterCount: { ...type.meta, color: colors.ink, fontFamily: fonts.semibold, fontVariant: ['tabular-nums'] },
  matchBg: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'flex-end' },
  matchSheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: space(6),
    paddingTop: space(10),
    paddingBottom: space(12),
    alignItems: 'center',
  },
  pair: { flexDirection: 'row', justifyContent: 'center', marginBottom: space(8) },
  matchPhoto: {
    width: 120,
    height: 150,
    borderRadius: 4,
    backgroundColor: colors.raised,
    borderWidth: 4,
    borderColor: colors.white,
    overflow: 'hidden',
    shadowColor: '#1F1B16',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  matchTitle: { ...type.title, textAlign: 'center', marginBottom: space(2) },
  matchText: { ...type.body, color: colors.secondary, textAlign: 'center', marginBottom: space(8) },
});
