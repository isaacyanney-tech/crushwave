import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { ScrollViewInstance, TextInputInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PhotoGrid } from '@/components/PhotoGrid';
import { emptyProfileForm, toProfileColumns, type ProfileFormValues } from '@/components/ProfileForm';
import { OptionCard, StepHeader } from '@/components/Steps';
import { Button, Chip, ChipRow, Field, FieldLabel, H1, MarginNote, P, TextLink } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { COMMUNITY_RULES, GENDERS, INTERESTS, LEVELS, LOOKING_FOR } from '@/lib/constants';
import { friendlyError, supabase } from '@/lib/supabase';
import { colors, fonts, radius, space, type } from '@/lib/theme';

const LOOKING_FOR_ICON = { dating: 'heart-outline', friendship: 'people-outline', study_partner: 'book-outline' } as const;

const LOOKING_FOR_TEXT: Record<string, string> = {
  dating: 'Meet someone special on campus.',
  friendship: 'Find people to hang out with.',
  study_partner: 'Find someone to study and revise with.',
};

function parseBirthdate(d: string, m: string, y: string): string | null {
  const day = Number(d);
  const month = Number(m);
  const year = Number(y);
  if (!day || !month || y.length !== 4) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function ageFrom(iso: string) {
  const b = new Date(iso);
  const now = new Date();
  let age = now.getFullYear() - b.getUTCFullYear();
  const m = now.getMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getUTCDate())) age--;
  return age;
}

function Check({ checked, onPress, label }: { checked: boolean; onPress: () => void; label: string }) {
  return (
    <Pressable onPress={onPress} style={styles.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked }}>
      <View style={[styles.box, checked && { backgroundColor: colors.ink, borderColor: colors.ink }]}>
        {checked ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

const TOTAL = 7;

export default function Onboarding() {
  const { session, refreshProfile, signOut } = useAuth();
  const userId = session!.user.id;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProfileFormValues>(emptyProfileForm);
  const set = <K extends keyof ProfileFormValues>(key: K, v: ProfileFormValues[K]) => setForm((f) => ({ ...f, [key]: v }));

  // Step 1
  const [agreed, setAgreed] = useState({ rules: false, adult: false, privacy: false });
  // Step 2
  const [dd, setDd] = useState('');
  const [mm, setMm] = useState('');
  const [yyyy, setYyyy] = useState('');
  const mmRef = useRef<TextInputInstance>(null);
  const yyRef = useRef<TextInputInstance>(null);
  const birthdate = parseBirthdate(dd, mm, yyyy);
  const age = birthdate ? ageFrom(birthdate) : null;

  const [busy, setBusy] = useState(false);
  const scroll = useRef<ScrollViewInstance>(null);

  const go = (n: number) => {
    setStep(n);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const back = step > 1 ? () => go(step - 1) : undefined;

  const toggle = <T,>(list: T[], item: T, max = 99) =>
    list.includes(item) ? list.filter((x) => x !== item) : list.length >= max ? list : [...list, item];

  // What each step needs before Continue works.
  const ready: Record<number, boolean> = {
    1: agreed.rules && agreed.adult && agreed.privacy,
    2: form.first_name.trim().length > 0 && age !== null && age >= 18 && age < 100,
    3: !!form.gender && form.show_me.length > 0,
    4: !!form.looking_for,
    5: true,
    6: form.photos.length >= 1,
    7: true,
  };

  const finish = async () => {
    if (!birthdate) return go(2);
    setBusy(true);
    const { error } = await supabase.from('profiles').insert({ id: userId, birthdate, ...toProfileColumns(form) });
    setBusy(false);
    if (error) return Alert.alert('Could not save your profile', friendlyError(error));
    await refreshProfile(); // The app opens Discover by itself.
  };

  const next = () => (step < TOTAL ? go(step + 1) : finish());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <StepHeader step={step} total={TOTAL} onBack={back} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scroll} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {step === 1 ? (
            <>
              <H1>Five rules before you start</H1>
              <P muted>Crushwave only works if everyone feels safe here.</P>
              <MarginNote style={{ marginBottom: space(6) }}>
                {COMMUNITY_RULES.map((r, i) => (
                  <View key={r.title} style={[styles.rule, i === COMMUNITY_RULES.length - 1 && { marginBottom: 0 }]}>
                    <Text style={styles.ruleTitle}>
                      {i + 1}. {r.title}
                    </Text>
                    <Text style={styles.ruleBody}>{r.body}</Text>
                  </View>
                ))}
              </MarginNote>
              <Check
                checked={agreed.rules}
                onPress={() => setAgreed((a) => ({ ...a, rules: !a.rules }))}
                label="I agree to the community rules."
              />
              <Check checked={agreed.adult} onPress={() => setAgreed((a) => ({ ...a, adult: !a.adult }))} label="I am 18 or older." />
              <Check
                checked={agreed.privacy}
                onPress={() => setAgreed((a) => ({ ...a, privacy: !a.privacy }))}
                label="I agree that Crushwave keeps my profile, photos and chats to run the app. I can delete everything at any time."
              />
              <View style={{ marginLeft: space(9) }}>
                <TextLink title="Read the privacy notice" onPress={() => router.push('/privacy')} />
              </View>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <H1>What should we call you?</H1>
              <P muted>People see your first name and age, never your surname or birthday.</P>
              <Field
                label="First name"
                value={form.first_name}
                onChangeText={(t) => set('first_name', t)}
                maxLength={30}
                autoCapitalize="words"
                autoFocus
                returnKeyType="next"
              />
              <FieldLabel>Date of birth</FieldLabel>
              <View style={styles.dobRow}>
                <TextInput
                  style={[styles.dob, { flex: 1 }]}
                  placeholder="DD"
                  value={dd}
                  maxLength={2}
                  onChangeText={(t) => {
                    const v = t.replace(/\D/g, '').slice(0, 2);
                    setDd(v);
                    if (v.length === 2) mmRef.current?.focus();
                  }}
                  keyboardType="number-pad"
                  placeholderTextColor={colors.muted}
                />
                <TextInput
                  ref={mmRef}
                  style={[styles.dob, { flex: 1 }]}
                  placeholder="MM"
                  value={mm}
                  maxLength={2}
                  onChangeText={(t) => {
                    const v = t.replace(/\D/g, '').slice(0, 2);
                    setMm(v);
                    if (v.length === 2) yyRef.current?.focus();
                  }}
                  keyboardType="number-pad"
                  placeholderTextColor={colors.muted}
                />
                <TextInput
                  ref={yyRef}
                  style={[styles.dob, { flex: 1.6 }]}
                  placeholder="YYYY"
                  value={yyyy}
                  maxLength={4}
                  onChangeText={(t) => setYyyy(t.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  placeholderTextColor={colors.muted}
                />
              </View>
              {yyyy.length === 4 && !birthdate ? <Text style={styles.bad}>That date doesn’t look right.</Text> : null}
              {age !== null && age < 18 ? <Text style={styles.bad}>You must be 18 or older to use Crushwave.</Text> : null}
              {age !== null && age >= 18 ? (
                <Text style={styles.good}>You’re {age}. You can’t change your date of birth later, so check it’s right.</Text>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <H1>I am a</H1>
              <ChipRow>
                {GENDERS.map((g) => (
                  <Chip key={g.value} label={g.label} selected={form.gender === g.value} onPress={() => set('gender', g.value)} />
                ))}
              </ChipRow>
              <H1>Show me</H1>
              <P muted>Pick one or more. You can change this later.</P>
              <ChipRow>
                {GENDERS.map((g) => (
                  <Chip
                    key={g.value}
                    label={g.plural}
                    selected={form.show_me.includes(g.value)}
                    onPress={() => set('show_me', toggle(form.show_me, g.value))}
                  />
                ))}
              </ChipRow>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <H1>What are you here for?</H1>
              <P muted>This shows on your profile so people know what you want.</P>
              {LOOKING_FOR.map((l) => (
                <OptionCard
                  key={l.value}
                  icon={LOOKING_FOR_ICON[l.value]}
                  title={l.label}
                  body={LOOKING_FOR_TEXT[l.value]}
                  selected={form.looking_for === l.value}
                  onPress={() => set('looking_for', l.value)}
                />
              ))}
            </>
          ) : null}

          {step === 5 ? (
            <>
              <H1>Your campus</H1>
              <P muted>Optional. It helps coursemates and people in your hall find you.</P>
              <Field
                label="Programme"
                placeholder="e.g. BSc Accounting"
                value={form.programme}
                onChangeText={(t) => set('programme', t)}
                maxLength={80}
              />
              <FieldLabel>Level</FieldLabel>
              <ChipRow>
                {LEVELS.map((l) => (
                  <Chip
                    key={l.value}
                    label={l.label}
                    selected={form.level === l.value}
                    onPress={() => set('level', form.level === l.value ? null : l.value)}
                  />
                ))}
              </ChipRow>
              <Field
                label="Hall or hostel"
                placeholder="e.g. your hall or hostel name"
                value={form.hall}
                onChangeText={(t) => set('hall', t)}
                maxLength={80}
                hint="We never use or show your exact location."
              />
            </>
          ) : null}

          {step === 6 ? (
            <>
              <H1>Add your main photo</H1>
              <P muted>
                One clear photo of your face is all you need to start. You can add up to 5 more later from your profile.
              </P>
              <PhotoGrid userId={userId} photos={form.photos} onChange={(p) => set('photos', p)} max={1} />
              <MarginNote style={{ marginTop: space(6) }}>
                <Text style={styles.tipText}>Good light, just you, no sunglasses. In a group photo nobody knows which one is you.</Text>
              </MarginNote>
            </>
          ) : null}

          {step === 7 ? (
            <>
              <H1>Your interests</H1>
              <P muted>Pick a few so people have something to talk about. Optional.</P>
              <ChipRow>
                {INTERESTS.map((i) => (
                  <Chip
                    key={i}
                    label={i}
                    selected={form.interests.includes(i)}
                    onPress={() => set('interests', toggle(form.interests, i, 10))}
                  />
                ))}
              </ChipRow>
              <Field
                label="About me (optional)"
                placeholder="A line or two about you"
                value={form.bio}
                onChangeText={(t) => set('bio', t)}
                maxLength={500}
                multiline
                style={{ minHeight: 90, textAlignVertical: 'top' }}
                hint={`${form.bio.length} of 500. You can add prompts and more photos later.`}
              />
            </>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={step === TOTAL ? 'Create my profile' : step === 5 && !form.programme && !form.level && !form.hall ? 'Skip for now' : 'Continue'}
            onPress={next}
            disabled={!ready[step]}
            loading={busy}
          />
          {step === 1 ? <Button title="Sign out" variant="ghost" onPress={signOut} style={{ marginTop: space(2) }} /> : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: space(5), paddingTop: space(4), paddingBottom: space(8) },
  footer: { paddingHorizontal: space(5), paddingTop: space(3), paddingBottom: space(3), backgroundColor: colors.bg },
  rule: { marginBottom: space(4) },
  ruleTitle: { ...type.label, marginBottom: space(1) },
  ruleBody: type.small,
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: space(3), marginBottom: space(4) },
  box: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: { ...type.body, flex: 1, fontSize: 15, lineHeight: 22 },
  dobRow: { flexDirection: 'row', gap: space(2) },
  dob: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radius.control,
    paddingVertical: space(3),
    fontFamily: fonts.medium,
    fontSize: 20,
    textAlign: 'center',
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  bad: { ...type.small, color: colors.danger, marginTop: space(2) },
  good: { ...type.small, marginTop: space(2) },
  tipText: type.small,
});
