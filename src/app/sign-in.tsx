import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Field } from '@/components/ui';
import { friendlyError, supabase } from '@/lib/supabase';
import { colors, space } from '@/lib/theme';

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
          'Crushwave is only open to verified students. Sign in with your school email address, not Gmail or Yahoo.',
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
    <LinearGradient colors={[colors.primary, colors.wave]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
          <View style={styles.hero}>
            <Text style={styles.logo}>crushwave</Text>
            <Text style={styles.tagline}>Date, make friends and find study partners. Only verified students.</Text>
          </View>
          <View style={styles.panel}>
            <Text style={styles.title}>Sign in with your student email</Text>
            <Field
              placeholder="yourID@school-email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="send"
              onSubmitEditing={sendCode}
            />
            <Button title="Send me a code" onPress={sendCode} loading={busy} />
            <Text style={styles.small}>
              We’ll email you a 6-digit code. No password needed. By continuing you confirm you are 18 or older.
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'space-between', padding: space(6) },
  hero: { marginTop: space(16) },
  logo: { color: '#fff', fontSize: 46, fontWeight: '900', letterSpacing: -1 },
  tagline: { color: 'rgba(255,255,255,0.92)', fontSize: 18, lineHeight: 26, marginTop: space(3), maxWidth: 320 },
  panel: { backgroundColor: colors.bg, borderRadius: 24, padding: space(5) },
  title: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: space(4) },
  small: { fontSize: 12, color: colors.muted, marginTop: space(3), lineHeight: 18, textAlign: 'center' },
});
