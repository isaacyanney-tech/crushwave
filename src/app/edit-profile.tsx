import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { ProfileForm, type ProfileFormValues, toProfileColumns, validateProfileForm } from '@/components/ProfileForm';
import { Button } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { deletePhoto } from '@/lib/photos';
import { friendlyError, supabase } from '@/lib/supabase';
import { space } from '@/lib/theme';

export default function EditProfile() {
  const { profile, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<ProfileFormValues>(() => ({
    first_name: profile?.first_name ?? '',
    gender: profile?.gender ?? null,
    show_me: profile?.show_me ?? [],
    looking_for: profile?.looking_for ?? 'dating',
    programme: profile?.programme ?? '',
    level: profile?.level ?? null,
    hall: profile?.hall ?? '',
    bio: profile?.bio ?? '',
    interests: profile?.interests ?? [],
    prompts: profile?.prompts ?? [],
    photos: profile?.photos ?? [],
  }));
  if (!profile) return null;

  const save = async () => {
    const problem = validateProfileForm(form);
    if (problem) return Alert.alert('Almost there', problem);
    setBusy(true);
    const { error } = await supabase.from('profiles').update(toProfileColumns(form)).eq('id', profile.id);
    if (!error) {
      // Remove photo files that are no longer on the profile.
      const removed = profile.photos.filter((p) => !form.photos.includes(p));
      await Promise.all(removed.map(deletePhoto));
      await refreshProfile();
    }
    setBusy(false);
    if (error) return Alert.alert('Could not save', friendlyError(error));
    router.back();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: space(5), paddingBottom: space(16) }} keyboardShouldPersistTaps="handled">
        <ProfileForm userId={profile.id} value={form} onChange={setForm} />
        <Button title="Save" onPress={save} loading={busy} style={{ marginTop: space(4) }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
