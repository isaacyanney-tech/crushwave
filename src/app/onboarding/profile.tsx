import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ProfileForm, emptyProfileForm, toProfileColumns, validateProfileForm } from '@/components/ProfileForm';
import { Button, H1, P } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { friendlyError, supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';

function parseBirthdate(d: string, m: string, y: string): string | null {
  const day = Number(d);
  const month = Number(m);
  const year = Number(y);
  if (!day || !month || y.length !== 4) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function ageFrom(iso: string) {
  const b = new Date(iso);
  const now = new Date();
  let age = now.getFullYear() - b.getUTCFullYear();
  const m = now.getMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getUTCDate())) age--;
  return age;
}

export default function OnboardingProfile() {
  const { session, refreshProfile } = useAuth();
  const userId = session!.user.id;
  const [form, setForm] = useState(emptyProfileForm);
  const [dd, setDd] = useState('');
  const [mm, setMm] = useState('');
  const [yyyy, setYyyy] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const birthdate = parseBirthdate(dd, mm, yyyy);
    if (!birthdate) return Alert.alert('Check your date of birth', 'Enter it as day, month and year, e.g. 21 / 04 / 2004.');
    if (ageFrom(birthdate) < 18) return Alert.alert('Sorry', 'You must be 18 or older to use Crushwave.');
    const problem = validateProfileForm(form);
    if (problem) return Alert.alert('Almost there', problem);

    Alert.alert(
      'Is your date of birth right?',
      `You are ${ageFrom(birthdate)}. You can’t change your date of birth later.`,
      [
        { text: 'Fix it', style: 'cancel' },
        {
          text: 'Yes, create profile',
          onPress: async () => {
            setBusy(true);
            const { error } = await supabase.from('profiles').insert({ id: userId, birthdate, ...toProfileColumns(form) });
            setBusy(false);
            if (error) return Alert.alert('Could not save your profile', friendlyError(error));
            await refreshProfile();
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <H1>Make your profile</H1>
        <P muted>Takes about 3 minutes. You can change everything except your date of birth later.</P>

        <Text style={styles.label}>Date of birth</Text>
        <View style={styles.dobRow}>
          <TextInput style={[styles.dob, { flex: 1 }]} placeholder="DD" value={dd} onChangeText={(t) => setDd(t.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" placeholderTextColor={colors.muted} />
          <TextInput style={[styles.dob, { flex: 1 }]} placeholder="MM" value={mm} onChangeText={(t) => setMm(t.replace(/\D/g, '').slice(0, 2))} keyboardType="number-pad" placeholderTextColor={colors.muted} />
          <TextInput style={[styles.dob, { flex: 2 }]} placeholder="YYYY" value={yyyy} onChangeText={(t) => setYyyy(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" placeholderTextColor={colors.muted} />
        </View>
        <Text style={styles.hint}>Only your age is shown, never your birthday.</Text>

        <View style={{ height: space(4) }} />
        <ProfileForm userId={userId} value={form} onChange={setForm} />

        <Button title="Create my profile" onPress={save} loading={busy} style={{ marginTop: space(4) }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space(5), paddingBottom: space(16) },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink, marginBottom: space(2) },
  dobRow: { flexDirection: 'row', gap: space(2) },
  dob: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: space(3),
    fontSize: 18,
    textAlign: 'center',
    color: colors.ink,
  },
  hint: { fontSize: 12, color: colors.muted, marginTop: space(1) },
});
