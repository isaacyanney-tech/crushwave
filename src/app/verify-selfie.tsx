import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';

import { Button, Card, H1, P } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { VERIFICATION_POSES } from '@/lib/constants';
import { takeVerificationSelfie } from '@/lib/photos';
import { friendlyError, supabase } from '@/lib/supabase';
import { space, type } from '@/lib/theme';

export default function VerifySelfie() {
  const { session, profile } = useAuth();
  const [pending, setPending] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const pose = useMemo(() => VERIFICATION_POSES[Math.floor(Math.random() * VERIFICATION_POSES.length)], []);

  useEffect(() => {
    supabase
      .from('verification_requests')
      .select('status')
      .eq('status', 'pending')
      .limit(1)
      .then(({ data }) => setPending(!!data?.length));
  }, []);

  const start = async () => {
    try {
      setBusy(true);
      const path = await takeVerificationSelfie(session!.user.id);
      if (!path) return;
      const { error } = await supabase
        .from('verification_requests')
        .insert({ user_id: session!.user.id, selfie_path: path, pose });
      if (error) throw error;
      Alert.alert('Selfie sent', 'We’ll compare it with your profile photos and add your verified tick, usually within a day.');
      router.back();
    } catch (e) {
      Alert.alert('Could not send selfie', friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  if (profile?.is_verified) {
    return (
      <ScrollView contentContainerStyle={styles.wrap}>
        <H1>You’re verified</H1>
        <P muted>Your verified tick shows on your profile.</P>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <H1>Get verified</H1>
      <P muted>A verified tick tells people your photos are really you.</P>
      {pending ? (
        <Card>
          <P>Your selfie is waiting for review. We’ll add your tick as soon as it’s checked.</P>
        </Card>
      ) : (
        <>
          <Card>
            <Text style={styles.poseLabel}>Copy this pose in your selfie</Text>
            <Text style={styles.pose}>{pose}</Text>
          </Card>
          <P muted>
            Your selfie is only seen by our review team, is never shown on your profile, and is deleted when your account
            is deleted.
          </P>
          <Button title="Take selfie" onPress={start} loading={busy} disabled={pending === null} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space(5), paddingBottom: space(16) },
  poseLabel: { ...type.small, marginBottom: space(2) },
  pose: type.title,
});
