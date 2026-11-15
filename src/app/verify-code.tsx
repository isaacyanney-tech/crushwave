import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, H1, P } from '@/components/ui';
import { friendlyError, supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';

const RESEND_SECONDS = 60;

export default function VerifyCode() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = async (value = code) => {
    if (value.length < 6) return;
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: String(email), token: value, type: 'email' });
    setBusy(false);
    if (error) {
      setCode('');
      Alert.alert('Code not accepted', friendlyError(error));
    }
    // On success the Gate moves you on automatically.
  };

  const resend = async () => {
    setWait(RESEND_SECONDS);
    const { error } = await supabase.auth.signInWithOtp({ email: String(email), options: { shouldCreateUser: true } });
    if (error) Alert.alert('Could not resend', friendlyError(error));
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
      <H1>Check your email</H1>
      <P muted>
        We sent a 6-digit code to {email}. It works once and expires soon. Check your spam folder if you don’t see it.
      </P>
      <TextInput
        style={styles.code}
        value={code}
        onChangeText={(t) => {
          const digits = t.replace(/\D/g, '').slice(0, 8);
          setCode(digits);
          if (digits.length === 6) verify(digits);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
        maxLength={8}
        placeholder="••••••"
        placeholderTextColor={colors.line}
      />
      <Button title="Continue" onPress={() => verify()} loading={busy} disabled={code.length < 6} />
      <View style={{ height: space(3) }} />
      <Button
        title={wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
        variant="ghost"
        onPress={resend}
        disabled={wait > 0}
      />
      <Button title="Use a different email" variant="ghost" onPress={() => router.back()} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: space(6), backgroundColor: colors.bg },
  code: {
    fontSize: 34,
    letterSpacing: 12,
    textAlign: 'center',
    fontWeight: '800',
    color: colors.ink,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingVertical: space(4),
    marginVertical: space(5),
  },
});
