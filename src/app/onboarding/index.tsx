import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, H1, P } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { COMMUNITY_RULES } from '@/lib/constants';
import { colors, radius, space } from '@/lib/theme';

function Check({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={styles.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.box, checked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
        {checked ? <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

export default function Rules() {
  const { signOut } = useAuth();
  const [rules, setRules] = useState(false);
  const [adult, setAdult] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <H1>You’re in! 🎉</H1>
      <P>Crushwave only works if everyone feels safe. Please read and agree to these 5 rules.</P>
      {COMMUNITY_RULES.map((r, i) => (
        <Card key={r.title}>
          <Text style={styles.ruleTitle}>
            {i + 1}. {r.title}
          </Text>
          <Text style={styles.ruleBody}>{r.body}</Text>
        </Card>
      ))}

      <Check checked={rules} onPress={() => setRules(!rules)} label="I agree to the community rules. Breaking them can get me banned." />
      <Check checked={adult} onPress={() => setAdult(!adult)} label="I am 18 or older." />
      <Check
        checked={privacy}
        onPress={() => setPrivacy(!privacy)}
        label="I agree that Crushwave stores my profile, photos and chats to run the app, as explained in the privacy notice. I can delete everything at any time."
      />
      <Pressable onPress={() => router.push('/privacy')}>
        <Text style={styles.link}>Read the privacy notice</Text>
      </Pressable>

      <Button
        title="Continue"
        onPress={() => router.push('/onboarding/profile')}
        disabled={!rules || !adult || !privacy}
        style={{ marginTop: space(4) }}
      />
      <Button title="Sign out" variant="ghost" onPress={signOut} style={{ marginTop: space(2) }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space(5), paddingBottom: space(12) },
  ruleTitle: { fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: space(1) },
  ruleBody: { fontSize: 14, lineHeight: 20, color: colors.muted },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space(3), marginBottom: space(3) },
  box: {
    width: 24,
    height: 24,
    borderRadius: radius.sm / 2,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkLabel: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.ink },
  link: { color: colors.primaryDark, fontWeight: '600', marginBottom: space(2), marginLeft: 36 },
});
