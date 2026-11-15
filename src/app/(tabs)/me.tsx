import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ProfileCard } from '@/components/ProfileCard';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { colors, radius, space } from '@/lib/theme';

function age(iso: string) {
  const b = new Date(iso);
  const n = new Date();
  let a = n.getFullYear() - b.getUTCFullYear();
  if (n.getMonth() < b.getUTCMonth() || (n.getMonth() === b.getUTCMonth() && n.getDate() < b.getUTCDate())) a--;
  return a;
}

function Row({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <Ionicons name={icon} size={22} color={colors.ink} />
      <Text style={styles.rowText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

export default function Me() {
  const { profile, schoolName } = useAuth();
  if (!profile) return null;

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(12) }}>
      <View style={styles.top}>
        <Text style={styles.school}>{schoolName ? `Verified ${schoolName} student` : 'Verified student'}</Text>
        <Button title="Edit profile" onPress={() => router.push('/edit-profile')} />
      </View>

      {!profile.is_verified ? (
        <Pressable style={styles.verify} onPress={() => router.push('/verify-selfie')}>
          <Ionicons name="checkmark-circle" size={26} color={colors.verified} />
          <View style={{ flex: 1 }}>
            <Text style={styles.verifyTitle}>Get your blue tick</Text>
            <Text style={styles.verifyText}>Take a quick selfie to prove your photos are really you.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </Pressable>
      ) : null}

      <View style={styles.menu}>
        <Row icon="settings-outline" label="Settings & privacy" onPress={() => router.push('/settings')} />
        <Row icon="shield-checkmark-outline" label="Safety Centre" onPress={() => router.push('/safety')} />
        <Row icon="people-outline" label="Community rules" onPress={() => router.push('/rules')} />
      </View>

      <Text style={styles.preview}>This is how others see you</Text>
      <View style={{ height: 760 }}>
        <ProfileCard profile={{ ...profile, age: age(profile.birthdate) }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  top: { marginBottom: space(4), gap: space(3) },
  school: { fontSize: 14, fontWeight: '700', color: colors.success },
  verify: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    padding: space(4),
    backgroundColor: '#EAF5FE',
    borderRadius: radius.md,
    marginBottom: space(4),
  },
  verifyTitle: { fontSize: 15, fontWeight: '700', color: colors.ink },
  verifyText: { fontSize: 13, color: colors.muted, marginTop: 2 },
  menu: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, marginBottom: space(5) },
  row: { flexDirection: 'row', alignItems: 'center', gap: space(3), padding: space(4), borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  rowText: { flex: 1, fontSize: 16, color: colors.ink },
  preview: { fontSize: 13, fontWeight: '800', color: colors.muted, textTransform: 'uppercase', marginBottom: space(3) },
});
