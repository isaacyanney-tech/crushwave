import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepHeader } from '@/components/Steps';
import { Button, Field, H1, P } from '@/components/ui';
import { friendlyError, supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const sendCode = async () => {
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) return Alert.alert('Check your email', 'Type your full student email address.');
    setBusy(true);
    try {
      const { data: school, error: schoolErr } = await supabase.rpc('check_school_email', { p_email: clean });
      if (schoolErr) throw schoolErr;
      if (!school || (Array.isArray(school) && school.length === 0)) {
        Alert.alert(
          'Use your student email',
          'Crushwave is only open to verified students. Use your school email address, not Gmail or Yahoo.',
        );
        return;
      }
      const { error } = await supabase.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true } });
      if (error) throw error;
      router.push({ pathname: '/verify-code', params: { email: clean } });
    } catch (e) {
      Alert.alert('Could not send your code', friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StepHeader
        step={1}
        total={2}
        label="Sign in or join"
        onBack={router.canGoBack() ? () => router.back() : () => router.replace('/welcome')}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <H1>Your student email</H1>
          <P muted>New here or coming back, it’s the same. We’ll email you a 6-digit code. No password needed.</P>
          <Field
            placeholder="e.g. 10326626@upsamail.edu.gh"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            autoFocus
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={sendCode}
          />
          <View style={styles.note}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.primaryDark} />
            <Text style={styles.noteText}>
              Your email only proves you’re a student. Nobody on Crushwave ever sees it.
            </Text>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button title="Send my code" onPress={sendCode} loading={busy} disabled={!email.trim()} />
          <Text style={styles.small}>By continuing you confirm you are 18 or older.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space(5), paddingTop: space(4) },
  note: {
    flexDirection: 'row',
    gap: space(2),
    alignItems: 'flex-start',
    backgroundColor: colors.tint,
    borderRadius: radius.md,
    padding: space(3),
  },
  noteText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.ink },
  footer: { paddingHorizontal: space(5), paddingBottom: space(3) },
  small: { fontSize: 12, color: colors.muted, marginTop: space(3), textAlign: 'center' },
});
