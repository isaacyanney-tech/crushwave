import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';

import { Button, Chip, ChipRow, Field } from '@/components/ui';
import { LEVELS, LOOKING_FOR } from '@/lib/constants';
import { setFilters, useFilters } from '@/lib/filters';
import { colors, space } from '@/lib/theme';

export default function FiltersScreen() {
  const current = useFilters();
  const [f, setF] = useState(current);

  const label = { fontSize: 14, fontWeight: '600' as const, color: colors.ink, marginBottom: space(2) };

  return (
    <ScrollView contentContainerStyle={{ padding: space(5), paddingBottom: space(16) }} keyboardShouldPersistTaps="handled">
      <Text style={label}>Here for</Text>
      <ChipRow>
        {LOOKING_FOR.map((l) => (
          <Chip
            key={l.value}
            label={l.label}
            selected={f.lookingFor === l.value}
            onPress={() => setF({ ...f, lookingFor: f.lookingFor === l.value ? null : l.value })}
          />
        ))}
      </ChipRow>

      <Text style={label}>Level</Text>
      <ChipRow>
        {LEVELS.map((l) => (
          <Chip
            key={l.value}
            label={l.label}
            selected={f.level === l.value}
            onPress={() => setF({ ...f, level: f.level === l.value ? null : l.value })}
          />
        ))}
      </ChipRow>

      <Field label="Programme" placeholder="Any" value={f.programme} onChangeText={(t) => setF({ ...f, programme: t })} />
      <Field label="Hall or hostel" placeholder="Any" value={f.hall} onChangeText={(t) => setF({ ...f, hall: t })} />

      <Button
        title="Show people"
        onPress={() => {
          setFilters(f);
          router.back();
        }}
        style={{ marginBottom: space(3) }}
      />
      <Button
        title="Clear filters"
        variant="ghost"
        onPress={() => {
          setFilters({ level: null, programme: '', hall: '', lookingFor: null });
          router.back();
        }}
      />
    </ScrollView>
  );
}
