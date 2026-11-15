import { ScrollView, Text } from 'react-native';

import { Card, P } from '@/components/ui';
import { COMMUNITY_RULES } from '@/lib/constants';
import { colors, space } from '@/lib/theme';

export default function Rules() {
  return (
    <ScrollView contentContainerStyle={{ padding: space(4), paddingBottom: space(16) }}>
      <P>Everyone on Crushwave agreed to these rules. Breaking them can get an account banned for good.</P>
      {COMMUNITY_RULES.map((r, i) => (
        <Card key={r.title}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink, marginBottom: 4 }}>
            {i + 1}. {r.title}
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: colors.muted }}>{r.body}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}
