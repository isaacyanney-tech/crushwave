import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LEVELS, LOOKING_FOR } from '@/lib/constants';
import type { Prompt } from '@/lib/auth';
import { signedUrls } from '@/lib/photos';
import { colors, radius, space } from '@/lib/theme';

export type PublicProfile = {
  id: string;
  first_name: string;
  age: number;
  looking_for?: string | null;
  bio: string;
  programme: string | null;
  level: number | null;
  hall: string | null;
  interests: string[];
  prompts: Prompt[];
  photos: string[];
  is_verified: boolean;
};

export function usePhotoUrls(paths: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = paths.join('|');
  useEffect(() => {
    let alive = true;
    if (paths.length) signedUrls(paths).then((u) => alive && setUrls(u));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls;
}

export function ProfileCard({
  profile,
  onMore,
  footer,
}: {
  profile: PublicProfile;
  onMore?: () => void;
  footer?: React.ReactNode;
}) {
  const urls = usePhotoUrls(profile.photos);
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [profile.id]);

  const photo = profile.photos[index];
  const level = LEVELS.find((l) => l.value === profile.level)?.label;
  const looking = LOOKING_FOR.find((l) => l.value === profile.looking_for);
  const facts = [profile.programme, level, profile.hall].filter(Boolean) as string[];

  return (
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: space(28) }} showsVerticalScrollIndicator={false}>
      <View style={styles.photoBox}>
        {photo && urls[photo] ? (
          <Image source={{ uri: urls[photo] }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.photoPlaceholder]}>
            <Ionicons name="image-outline" size={40} color={colors.muted} />
          </View>
        )}
        {/* Tap the left or right half to move between photos. */}
        <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]}>
          <Pressable style={{ flex: 1 }} onPress={() => setIndex((i) => Math.max(0, i - 1))} />
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setIndex((i) => Math.min(profile.photos.length - 1, i + 1))}
          />
        </View>
        <View style={styles.dots}>
          {profile.photos.map((p, i) => (
            <View key={p} style={[styles.dot, i === index && { backgroundColor: '#fff' }]} />
          ))}
        </View>
        <View style={styles.nameBar}>
          <Text style={styles.name}>
            {profile.first_name}, {profile.age}{' '}
          </Text>
          {profile.is_verified ? <Ionicons name="checkmark-circle" size={24} color={colors.verified} /> : null}
          <View style={{ flex: 1 }} />
          {onMore ? (
            <Pressable onPress={onMore} hitSlop={12} accessibilityLabel="Report or block">
              <Ionicons name="ellipsis-horizontal-circle" size={30} color="#fff" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        {looking ? (
          <Text style={styles.looking}>
            {looking.emoji} Here for {looking.label.toLowerCase()}
          </Text>
        ) : null}
        {facts.length ? <Text style={styles.facts}>{facts.join('  ·  ')}</Text> : null}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        {profile.prompts.map((p) => (
          <View key={p.q} style={styles.prompt}>
            <Text style={styles.promptQ}>{p.q}</Text>
            <Text style={styles.promptA}>{p.a}</Text>
          </View>
        ))}

        {profile.interests.length ? (
          <View style={styles.tags}>
            {profile.interests.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {footer}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  photoBox: {
    aspectRatio: 4 / 5,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.line,
  },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', top: space(3), left: space(3), right: space(3), flexDirection: 'row', gap: 4 },
  dot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.45)' },
  nameBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: space(4),
    paddingTop: space(10),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  name: { color: '#fff', fontSize: 28, fontWeight: '800' },
  body: { paddingVertical: space(4) },
  looking: { fontSize: 15, fontWeight: '600', color: colors.primaryDark, marginBottom: space(2) },
  facts: { fontSize: 14, color: colors.muted, marginBottom: space(3) },
  bio: { fontSize: 16, lineHeight: 23, color: colors.ink, marginBottom: space(4) },
  prompt: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(4),
    marginBottom: space(3),
  },
  promptQ: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: space(1) },
  promptA: { fontSize: 18, fontWeight: '700', color: colors.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), marginTop: space(1) },
  tag: { backgroundColor: '#FFE3E9', borderRadius: radius.pill, paddingHorizontal: space(3), paddingVertical: space(1.5) },
  tagText: { color: colors.primaryDark, fontWeight: '600', fontSize: 13 },
});
