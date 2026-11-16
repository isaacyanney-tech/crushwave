import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import type { Prompt } from '@/lib/auth';
import {
  GENDERS,
  INTERESTS,
  LEVELS,
  LOOKING_FOR,
  MIN_PHOTOS,
  PROMPTS,
  type Gender,
  type LookingFor,
} from '@/lib/constants';
import { colors, fonts, radius, space, type } from '@/lib/theme';
import { PhotoGrid } from './PhotoGrid';
import { Chip, ChipRow, Field, FieldLabel, H2, P, TextLink } from './ui';

export type ProfileFormValues = {
  first_name: string;
  gender: Gender | null;
  show_me: Gender[];
  looking_for: LookingFor;
  programme: string;
  level: number | null;
  hall: string;
  bio: string;
  interests: string[];
  prompts: Prompt[];
  photos: string[];
};

export const emptyProfileForm: ProfileFormValues = {
  first_name: '',
  gender: null,
  show_me: [],
  looking_for: 'dating',
  programme: '',
  level: null,
  hall: '',
  bio: '',
  interests: [],
  prompts: [],
  photos: [],
};

/** Returns a message describing what is missing, or null when the form is complete. */
export function validateProfileForm(v: ProfileFormValues): string | null {
  if (!v.first_name.trim()) return 'Add your first name.';
  if (!v.gender) return 'Choose your gender.';
  if (!v.show_me.length) return 'Choose who you’d like to see.';
  if (v.photos.length < MIN_PHOTOS) return 'Add at least one photo of yourself.';
  if (v.prompts.some((p) => !p.a.trim())) return 'Answer each prompt you picked, or remove it.';
  return null;
}

export function toProfileColumns(v: ProfileFormValues) {
  return {
    first_name: v.first_name.trim(),
    gender: v.gender!,
    show_me: v.show_me,
    looking_for: v.looking_for,
    programme: v.programme.trim() || null,
    level: v.level,
    hall: v.hall.trim() || null,
    bio: v.bio.trim(),
    interests: v.interests,
    prompts: v.prompts.map((p) => ({ q: p.q, a: p.a.trim() })),
    photos: v.photos,
  };
}

export function ProfileForm({
  userId,
  value,
  onChange,
}: {
  userId: string;
  value: ProfileFormValues;
  onChange: (next: ProfileFormValues) => void;
}) {
  const set = <K extends keyof ProfileFormValues>(key: K, v: ProfileFormValues[K]) => onChange({ ...value, [key]: v });
  const [showAllPrompts, setShowAllPrompts] = useState(false);

  const toggle = <T,>(list: T[], item: T, max = 99) =>
    list.includes(item) ? list.filter((x) => x !== item) : list.length >= max ? list : [...list, item];

  const togglePrompt = (q: string) => {
    const has = value.prompts.find((p) => p.q === q);
    if (has) set('prompts', value.prompts.filter((p) => p.q !== q));
    else if (value.prompts.length < 3) set('prompts', [...value.prompts, { q, a: '' }]);
  };

  return (
    <View>
      <H2>Photos</H2>
      <P muted>Up to 6 recent photos. Your main photo should clearly show your face.</P>
      <PhotoGrid userId={userId} photos={value.photos} onChange={(p) => set('photos', p)} />

      <View style={{ height: space(6) }} />
      <Field
        label="First name"
        value={value.first_name}
        onChangeText={(t) => set('first_name', t)}
        maxLength={30}
        autoCapitalize="words"
        hint="Only your first name is shown. Never your surname."
      />

      <FieldLabel>I am a</FieldLabel>
      <ChipRow>
        {GENDERS.map((g) => (
          <Chip key={g.value} label={g.label} selected={value.gender === g.value} onPress={() => set('gender', g.value)} />
        ))}
      </ChipRow>

      <FieldLabel>Show me</FieldLabel>
      <ChipRow>
        {GENDERS.map((g) => (
          <Chip
            key={g.value}
            label={g.plural}
            selected={value.show_me.includes(g.value)}
            onPress={() => set('show_me', toggle(value.show_me, g.value))}
          />
        ))}
      </ChipRow>

      <FieldLabel>I’m here for</FieldLabel>
      <ChipRow>
        {LOOKING_FOR.map((l) => (
          <Chip
            key={l.value}
            label={l.label}
            selected={value.looking_for === l.value}
            onPress={() => set('looking_for', l.value)}
          />
        ))}
      </ChipRow>

      <Field
        label="Programme (optional)"
        placeholder="e.g. BSc Accounting"
        value={value.programme}
        onChangeText={(t) => set('programme', t)}
        maxLength={80}
      />

      <FieldLabel>Level (optional)</FieldLabel>
      <ChipRow>
        {LEVELS.map((l) => (
          <Chip
            key={l.value}
            label={l.label}
            selected={value.level === l.value}
            onPress={() => set('level', value.level === l.value ? null : l.value)}
          />
        ))}
      </ChipRow>

      <Field
        label="Hall or hostel (optional)"
        placeholder="e.g. your hall or hostel name"
        value={value.hall}
        onChangeText={(t) => set('hall', t)}
        maxLength={80}
        hint="We never use or show your exact location."
      />

      <Field
        label="About me"
        placeholder="A few lines about you"
        value={value.bio}
        onChangeText={(t) => set('bio', t)}
        maxLength={500}
        multiline
        style={{ minHeight: 90, textAlignVertical: 'top' }}
        hint={`${value.bio.length} of 500`}
      />

      <H2>Interests</H2>
      <P muted>Pick up to 10.</P>
      <ChipRow>
        {INTERESTS.map((i) => (
          <Chip
            key={i}
            label={i}
            selected={value.interests.includes(i)}
            onPress={() => set('interests', toggle(value.interests, i, 10))}
          />
        ))}
      </ChipRow>

      <H2>Prompts</H2>
      <P muted>Pick up to 3 and answer them. They give people something to reply to.</P>
      <ChipRow>
        {(showAllPrompts ? PROMPTS : PROMPTS.slice(0, 5)).map((q) => (
          <Chip key={q} label={q} selected={!!value.prompts.find((p) => p.q === q)} onPress={() => togglePrompt(q)} />
        ))}
        {!showAllPrompts ? <Chip label="More prompts" onPress={() => setShowAllPrompts(true)} /> : null}
      </ChipRow>
      {value.prompts.map((p, idx) => (
        <View key={p.q} style={styles.promptBox}>
          <Text style={styles.promptQ}>{p.q}</Text>
          <TextInput
            style={styles.promptInput}
            placeholder="Your answer"
            placeholderTextColor={colors.muted}
            value={p.a}
            maxLength={200}
            multiline
            onChangeText={(a) => {
              const next = [...value.prompts];
              next[idx] = { q: p.q, a };
              set('prompts', next);
            }}
          />
          <View style={{ marginTop: space(2) }}>
            <TextLink title="Remove" muted onPress={() => togglePrompt(p.q)} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  promptBox: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space(4),
    marginBottom: space(3),
  },
  promptQ: { ...type.small, marginBottom: space(2) },
  promptInput: { fontFamily: fonts.regular, fontSize: 16, color: colors.ink, minHeight: 44 },
});
