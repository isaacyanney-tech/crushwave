import { ScrollView, Text, View } from 'react-native';

import { MarginNote, P } from '@/components/ui';
import { COMMUNITY_RULES } from '@/lib/constants';
import { space, type } from '@/lib/theme';

export default function Rules() {
  return (
    <ScrollView contentContainerStyle={{ padding: space(5), paddingBottom: space(16) }}>
      <P muted>Everyone on Crushwave agreed to these rules. Breaking them can get an account banned for good.</P>
      <MarginNote style={{ marginTop: space(2) }}>
        {COMMUNITY_RULES.map((r, i) => (
          <View key={r.title} style={{ marginBottom: i === COMMUNITY_RULES.length - 1 ? 0 : space(5) }}>
            <Text style={[type.label, { marginBottom: space(1) }]}>
              {i + 1}. {r.title}
            </Text>
            <Text style={type.small}>{r.body}</Text>
          </View>
        ))}
      </MarginNote>
    </ScrollView>
  );
}
