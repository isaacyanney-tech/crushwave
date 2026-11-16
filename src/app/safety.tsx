import { Linking, ScrollView, StyleSheet, Text } from 'react-native';

import { Button, Card, H2, P } from '@/components/ui';
import { SUPPORT_EMAIL } from '@/lib/constants';
import { colors, space } from '@/lib/theme';

const NUMBERS = [
  { label: 'Police emergency', number: '191' },
  { label: 'Ambulance', number: '193' },
  { label: 'DOVVSU helpline (domestic violence & victim support)', number: '0551000900' },
];

const TIPS = [
  'Meet in busy public places on or near campus for the first few dates.',
  'Tell a friend where you’re going, who with, and when you’ll be back.',
  'Get yourself there and back. Don’t rely on your date for a ride.',
  'Never send money, MoMo or airtime to someone you met here, whatever the story.',
  'Never share intimate photos. Sharing someone’s private images without consent is a crime in Ghana (Cybersecurity Act, 2020).',
  'Trust your gut. If something feels off, leave, then block and report.',
];

export default function Safety() {
  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(16) }}>
      <H2>If you’re in danger now</H2>
      <Card>
        {NUMBERS.map((n) => (
          <Button
            key={n.number}
            title={`${n.label}: ${n.number}`}
            variant="secondary"
            onPress={() => Linking.openURL(`tel:${n.number}`)}
            style={{ marginBottom: space(2) }}
          />
        ))}
      </Card>

      <H2>Dating safely</H2>
      <Card>
        {TIPS.map((t) => (
          <Text key={t} style={styles.tip}>
            •  {t}
          </Text>
        ))}
      </Card>

      <H2>Reporting</H2>
      <Card>
        <P>
          Tap the ••• on any profile, the shield in any chat, or press and hold a message to report it. Reports are
          private. The person is blocked for you straight away, and our team reviews every report within 24 hours.
        </P>
        <P muted>Reports of someone under 18 or of threats suspend that account immediately while we check.</P>
        {SUPPORT_EMAIL ? (
          <Button title={`Email ${SUPPORT_EMAIL}`} variant="secondary" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tip: { fontSize: 15, lineHeight: 22, color: colors.ink, marginBottom: space(2) },
});
