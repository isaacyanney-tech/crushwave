import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Button, Card, H2 } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { deleteAllMyFiles } from '@/lib/photos';
import { unregisterPush } from '@/lib/push';
import { friendlyError, supabase } from '@/lib/supabase';
import { colors, fonts, radius, space, type } from '@/lib/theme';

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <View style={{ flex: 1 }}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {hint ? <Text style={styles.toggleHint}>{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.ink }} accessibilityLabel={label} />
    </View>
  );
}

export default function Settings() {
  const { profile, refreshProfile, signOut, session } = useAuth();
  const [minAge, setMinAge] = useState(String(profile?.min_age ?? 18));
  const [maxAge, setMaxAge] = useState(String(profile?.max_age ?? 35));
  const [busy, setBusy] = useState(false);
  if (!profile) return null;

  const update = async (patch: Record<string, unknown>) => {
    const { error } = await supabase.from('profiles').update(patch).eq('id', profile.id);
    if (error) Alert.alert('Could not save', friendlyError(error));
    await refreshProfile();
  };

  const saveAges = () => {
    const lo = Math.max(18, Number(minAge) || 18);
    const hi = Math.min(99, Math.max(lo, Number(maxAge) || lo));
    setMinAge(String(lo));
    setMaxAge(String(hi));
    update({ min_age: lo, max_age: hi });
  };

  const doSignOut = async () => {
    await unregisterPush();
    await signOut();
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'This permanently deletes your profile, photos, matches and chats. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete forever',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await unregisterPush();
              await deleteAllMyFiles(session!.user.id);
              const { error } = await supabase.rpc('delete_my_account');
              if (error) throw error;
              await signOut();
            } catch (e) {
              Alert.alert('Could not delete account', friendlyError(e));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(16) }}>
      <H2>Privacy</H2>
      <Card>
        <Toggle
          label="Pause my profile"
          hint="Hide from Discover. Your matches and chats keep working."
          value={profile.is_paused}
          onChange={(v) => update({ is_paused: v })}
        />
        <Toggle
          label="Hide me from my programme"
          hint={profile.programme ? `Students in ${profile.programme} won’t see you.` : 'Add your programme to your profile to use this.'}
          value={profile.hide_from_my_programme}
          onChange={(v) => update({ hide_from_my_programme: v })}
        />
        <Toggle
          label="Hide me from my level"
          hint={profile.level ? 'Students in your level won’t see you.' : 'Add your level to your profile to use this.'}
          value={profile.hide_from_my_level}
          onChange={(v) => update({ hide_from_my_level: v })}
        />
      </Card>

      <H2>Who I see</H2>
      <Card>
        <Text style={styles.toggleLabel}>Age range</Text>
        <View style={styles.ageRow}>
          <TextInput style={styles.age} value={minAge} onChangeText={setMinAge} onBlur={saveAges} keyboardType="number-pad" maxLength={2} />
          <Text style={type.small}>to</Text>
          <TextInput style={styles.age} value={maxAge} onChangeText={setMaxAge} onBlur={saveAges} keyboardType="number-pad" maxLength={2} />
        </View>
        <Text style={styles.toggleHint}>To change who you see (men, women or both), go to Edit profile.</Text>
      </Card>

      <H2>About</H2>
      <Card>
        <Button title="Safety Centre" variant="secondary" onPress={() => router.push('/safety')} style={styles.gap} />
        <Button title="Community rules" variant="secondary" onPress={() => router.push('/rules')} style={styles.gap} />
        <Button title="Privacy notice" variant="secondary" onPress={() => router.push('/privacy')} />
      </Card>

      <Button title="Sign out" variant="secondary" onPress={doSignOut} style={[styles.gap, { marginTop: space(4) }]} />
      <Button title="Delete my account" variant="danger" onPress={deleteAccount} loading={busy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space(3), paddingVertical: space(3) },
  toggleLabel: type.label,
  toggleHint: { ...type.small, marginTop: space(1) },
  ageRow: { flexDirection: 'row', alignItems: 'center', gap: space(3), marginTop: space(3), marginBottom: space(3) },
  age: {
    width: 64,
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.control,
    paddingVertical: space(2),
    color: colors.ink,
    backgroundColor: colors.bg,
  },
  gap: { marginBottom: space(3) },
});
