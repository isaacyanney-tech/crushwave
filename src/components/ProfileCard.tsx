import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LEVELS, LOOKING_FOR } from '@/lib/constants';
import type { Prompt } from '@/lib/auth';
import { localPreview, signedUrls } from '@/lib/photos';
import { MarginNote } from '@/components/ui';
import { colors, fonts, radius, space, type } from '@/lib/theme';

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

/**
 * Links for private photos. A photo just picked on this phone shows from the
 * phone straight away; everything else uses a short-lived signed link. Missing
 * links are retried once, in case the upload was still settling.
 */
export function usePhotoUrls(paths: string[]) {
  const [signed, setSigned] = useState<Record<string, string>>({});
  const key = paths.join('|');
  useEffect(() => {
    let alive = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    const run = async (attempt: number) => {
      if (!paths.length) return;
      const u = await signedUrls(paths).catch(() => ({}) as Record<string, string>);
      if (!alive) return;
      setSigned((prev) => ({ ...prev, ...u }));
      if (attempt === 0 && paths.some((p) => !u[p])) retry = setTimeout(() => run(1), 1500);
    };
    run(0);
    return () => {
      alive = false;
      if (retry) clearTimeout(retry);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const out: Record<string, string> = {};
  for (const p of paths) {
    const url = localPreview(p) ?? signed[p];
    if (url) out[p] = url;
  }
  return out;
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
    <ScrollView style={styles.wrap} contentContainerStyle={{ paddingBottom: space(8) }} showsVerticalScrollIndicator={false}>
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
            <View key={p} style={[styles.dot, i === index && { backgroundColor: colors.white }]} />
          ))}
        </View>
        <LinearGradient colors={['rgba(20,17,14,0)', 'rgba(20,17,14,0.6)']} style={styles.nameBar} pointerEvents="box-none">
          <Text style={styles.name}>
            {profile.first_name} <Text style={styles.age}>{profile.age}</Text>
          </Text>
          {profile.is_verified ? (
            <Ionicons name="checkmark-circle" size={20} color={colors.white} accessibilityLabel="Verified" style={{ marginLeft: space(2) }} />
          ) : null}
          <View style={{ flex: 1 }} />
          {onMore ? (
            <Pressable onPress={onMore} hitSlop={12} accessibilityLabel="Report or block" style={styles.more}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.white} />
            </Pressable>
          ) : null}
        </LinearGradient>
      </View>

      <View style={styles.body}>
        {looking || facts.length ? (
          <Text style={styles.facts}>
            {[looking ? `Here for ${looking.label.toLowerCase()}` : null, ...facts].filter(Boolean).join('  ·  ')}
          </Text>
        ) : null}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        {profile.prompts.map((p) => (
          <MarginNote key={p.q} style={styles.prompt}>
            <Text style={styles.promptQ}>{p.q}</Text>
            <Text style={styles.promptA}>{p.a}</Text>
          </MarginNote>
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
    borderRadius: radius.card,
    overflow: 'hidden',
    backgroundColor: colors.raised,
  },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  dots: { position: 'absolute', top: space(3), left: space(3), right: space(3), flexDirection: 'row', gap: space(1) },
  dot: { flex: 1, height: 2, borderRadius: 1, backgroundColor: 'rgba(255,255,255,0.45)' },
  nameBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: space(5),
    paddingTop: space(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: { fontFamily: fonts.display, fontSize: 32, lineHeight: 36, color: colors.white },
  age: { fontFamily: fonts.regular, fontSize: 24, color: 'rgba(255,255,255,0.85)' },
  more: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20,17,14,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingTop: space(5), paddingBottom: space(4), paddingHorizontal: space(1) },
  facts: { ...type.small, marginBottom: space(4) },
  bio: { ...type.body, marginBottom: space(6) },
  prompt: { marginBottom: space(6) },
  promptQ: { ...type.small, marginBottom: space(1) },
  promptA: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.ink },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2) },
  tag: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.tag,
    paddingHorizontal: space(2),
    paddingVertical: space(1),
  },
  tagText: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, color: colors.secondary },
});
