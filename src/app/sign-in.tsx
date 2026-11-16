import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepHeader } from '@/components/Steps';
import { Button, Field, H1, P } from '@/components/ui';
import { friendlyError, supabase } from '@/lib/supabase';
import { ICON, colors, space, type } from '@/lib/theme';

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
          <P muted>New or returning, it works the same way. We email you a 6-digit code, so there’s no password to remember.</P>
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
            <Ionicons name="lock-closed-outline" size={ICON} color={colors.muted} />
            <Text style={styles.noteText}>
              Your email only proves you’re a student. Nobody on Crushwave ever sees it.
            </Text>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <Button title="Send my code" onPress={sendCode} loading={busy} disabled={!email.trim()} />
          <Text style={styles.small}>By continuing you confirm you’re 18 or older</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space(5), paddingTop: space(6) },
  note: { flexDirection: 'row', gap: space(2), alignItems: 'flex-start' },
  noteText: { ...type.small, flex: 1 },
  footer: { paddingHorizontal: space(5), paddingBottom: space(3) },
  small: { ...type.meta, marginTop: space(3), textAlign: 'center' },
});
