import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StepHeader } from '@/components/Steps';
import { Button, H1, P } from '@/components/ui';
import { friendlyError, supabase } from '@/lib/supabase';
import { colors, radius, space } from '@/lib/theme';

const RESEND_SECONDS = 60;
const LENGTH = 6;

export default function VerifyCode() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(RESEND_SECONDS);
  const input = useRef<TextInputInstance>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const verify = async (value = code) => {
    if (value.length < LENGTH || busy) return;
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: String(email), token: value, type: 'email' });
    setBusy(false);
    if (error) {
      setCode('');
      Alert.alert('Code not accepted', 'That code is wrong or has expired. Check the newest email, or ask for a new code.');
      input.current?.focus();
    }
    // On success the app moves on by itself.
  };

  const resend = async () => {
    setWait(RESEND_SECONDS);
    setCode('');
    const { error } = await supabase.auth.signInWithOtp({ email: String(email), options: { shouldCreateUser: true } });
    if (error) Alert.alert('Could not resend', friendlyError(error));
    else Alert.alert('New code sent', 'Use the code in the newest email. Older codes stop working.');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StepHeader step={2} total={2} label="Sign in or join" onBack={() => router.back()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
        <H1>Enter your code</H1>
        <P muted>
          We emailed a 6-digit code to <Text style={{ fontWeight: '700', color: colors.ink }}>{email}</Text>. It can take a
          minute to arrive. Check your spam or junk folder too.
        </P>

        <Pressable onPress={() => input.current?.focus()} style={styles.boxes} accessibilityLabel="Code">
          {Array.from({ length: LENGTH }, (_, i) => (
            <View key={i} style={[styles.box, i === code.length && styles.boxActive, !!code[i] && styles.boxFilled]}>
              <Text style={styles.digit}>{code[i] ?? ''}</Text>
            </View>
          ))}
        </Pressable>
        <TextInput
          ref={input}
          style={styles.hidden}
          value={code}
          onChangeText={(t) => {
            const digits = t.replace(/\D/g, '').slice(0, LENGTH);
            setCode(digits);
            if (digits.length === LENGTH) verify(digits);
          }}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          autoFocus
          maxLength={LENGTH}
        />

        <Button title="Continue" onPress={() => verify()} loading={busy} disabled={code.length < LENGTH} />
        <View style={styles.links}>
          <Text style={[styles.link, wait > 0 && { color: colors.muted }]} onPress={wait > 0 ? undefined : resend}>
            {wait > 0 ? `Resend code in ${wait}s` : 'Resend code'}
          </Text>
          <Text style={styles.link} onPress={() => router.back()}>
            Change email
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: space(5), paddingTop: space(4) },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', gap: space(2), marginVertical: space(5) },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: colors.primary },
  boxFilled: { borderColor: colors.ink },
  digit: { fontSize: 26, fontWeight: '700', color: colors.ink },
  hidden: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space(5) },
  link: { color: colors.primaryDark, fontWeight: '700', fontSize: 15, padding: space(1) },
});
