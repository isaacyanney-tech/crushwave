import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileCard, usePhotoUrls } from '@/components/ProfileCard';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { LOOKING_FOR } from '@/lib/constants';
import { colors, radius, space } from '@/lib/theme';

function age(iso: string) {
  const b = new Date(iso);
  const n = new Date();
  let a = n.getFullYear() - b.getUTCFullYear();
  if (n.getMonth() < b.getUTCMonth() || (n.getMonth() === b.getUTCMonth() && n.getDate() < b.getUTCDate())) a--;
  return a;
}

type IconName = keyof typeof Ionicons.glyphMap;

function Row({ icon, label, sub, onPress, last }: { icon: IconName; label: string; sub?: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, !last && styles.rowLine, pressed && { opacity: 0.6 }]}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={20} color={colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowText}>{label}</Text>
        {sub ? <Text style={styles.rowSub}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function Me() {
  const { profile, schoolName } = useAuth();
  const [preview, setPreview] = useState(false);
  const urls = usePhotoUrls(profile?.photos.slice(0, 1) ?? []);
  if (!profile) return null;

  const main = profile.photos[0];
  const looking = LOOKING_FOR.find((l) => l.value === profile.looking_for);

  // Simple "profile strength" to nudge people to finish what sign-up skipped.
  const todo: { label: string; done: boolean }[] = [
    { label: 'Add 3 or more photos', done: profile.photos.length >= 3 },
    { label: 'Write a short bio', done: profile.bio.trim().length > 0 },
    { label: 'Answer a prompt', done: profile.prompts.length > 0 },
    { label: 'Pick some interests', done: profile.interests.length > 0 },
    { label: 'Get your blue tick', done: profile.is_verified },
  ];
  const done = todo.filter((t) => t.done).length;
  const pct = Math.round((done / todo.length) * 100);

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(12) }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/edit-profile')} style={styles.avatarWrap}>
          {main && urls[main] ? <Image source={{ uri: urls[main] }} style={styles.avatar} contentFit="cover" /> : <View style={styles.avatar} />}
          <View style={styles.avatarEdit}>
            <Ionicons name="pencil" size={13} color="#fff" />
          </View>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space(3) }}>
          <Text style={styles.name}>
            {profile.first_name}, {age(profile.birthdate)}
          </Text>
          {profile.is_verified ? <Ionicons name="checkmark-circle" size={20} color={colors.verified} /> : null}
        </View>
        <Text style={styles.meta}>
          {[schoolName ? `${schoolName} student` : 'Student', looking?.label].filter(Boolean).join(' · ')}
        </Text>
        <View style={styles.headerBtns}>
          <Button title="Edit profile" onPress={() => router.push('/edit-profile')} style={{ flex: 1 }} />
          <Button title="Preview" variant="secondary" onPress={() => setPreview(true)} style={{ flex: 1 }} />
        </View>
      </View>

      {done < todo.length ? (
        <Pressable style={styles.strength} onPress={() => router.push('/edit-profile')}>
          <View style={styles.strengthTop}>
            <Text style={styles.strengthTitle}>Profile strength</Text>
            <Text style={styles.strengthPct}>{pct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct}%` }]} />
          </View>
          {todo
            .filter((t) => !t.done)
            .slice(0, 2)
            .map((t) => (
              <View key={t.label} style={styles.todo}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.todoText}>{t.label}</Text>
              </View>
            ))}
        </Pressable>
      ) : null}

      {!profile.is_verified ? (
        <View style={styles.group}>
          <Row icon="checkmark-circle-outline" label="Get verified" sub="Take a quick selfie to get a blue tick" onPress={() => router.push('/verify-selfie')} last />
        </View>
      ) : null}

      <Text style={styles.groupTitle}>Account</Text>
      <View style={styles.group}>
        <Row icon="options-outline" label="Discovery filters" sub="Level, programme, hall and more" onPress={() => router.push('/filters')} />
        <Row icon="settings-outline" label="Settings & privacy" sub="Pause, hide, age range, delete account" onPress={() => router.push('/settings')} last />
      </View>

      <Text style={styles.groupTitle}>Safety</Text>
      <View style={styles.group}>
        <Row icon="shield-checkmark-outline" label="Safety Centre" sub="Tips and emergency numbers" onPress={() => router.push('/safety')} />
        <Row icon="document-text-outline" label="Community rules" onPress={() => router.push('/rules')} />
        <Row icon="lock-closed-outline" label="Privacy notice" onPress={() => router.push('/privacy')} last />
      </View>

      <Modal visible={preview} animationType="slide" onRequestClose={() => setPreview(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: space(4) }}>
          <Text style={styles.previewTitle}>This is how others see you</Text>
          <ProfileCard
            profile={{ ...profile, age: age(profile.birthdate) }}
            footer={<Button title="Close" variant="secondary" onPress={() => setPreview(false)} />}
          />
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(5),
    marginBottom: space(4),
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.line },
  avatarEdit: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 24, fontWeight: '700', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted, marginTop: 4 },
  headerBtns: { flexDirection: 'row', gap: space(3), marginTop: space(5), alignSelf: 'stretch' },
  strength: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(4),
    marginBottom: space(4),
  },
  strengthTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: space(2) },
  strengthTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  strengthPct: { fontSize: 15, fontWeight: '700', color: colors.primaryDark },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden', marginBottom: space(3) },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  todo: { flexDirection: 'row', alignItems: 'center', gap: space(2), marginTop: space(1) },
  todoText: { fontSize: 14, color: colors.ink },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    marginTop: space(2),
    marginBottom: space(2),
    marginLeft: space(1),
  },
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: space(4),
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingHorizontal: space(4), paddingVertical: space(3) },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  rowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  rowText: { fontSize: 16, fontWeight: '600', color: colors.ink },
  rowSub: { fontSize: 13, color: colors.muted, marginTop: 1 },
  previewTitle: { fontSize: 13, fontWeight: '700', color: colors.muted, textAlign: 'center', marginBottom: space(3) },
});
