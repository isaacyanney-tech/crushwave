import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, TextLink } from '@/components/ui';
import { colors, fonts, radius, space, type } from '@/lib/theme';

// Written on the "exercise book page" below. Same three promises as before.
const NOTES = [
  'Only students. Everyone joins with their school email.',
  'Like someone. If they like you back, you can chat.',
  'Your surname, birthday and number stay private.',
];

const RULE = 28; // distance between the ruled lines

/** The welcome moment: a page from a school exercise book, red margin and all. */
function NotebookPage() {
  return (
    <View style={styles.page}>
      {Array.from({ length: 16 }, (_, i) => (
        <View key={i} style={[styles.ruled, { top: space(4) + RULE * (i + 1) - 5 }]} />
      ))}
      <View style={styles.marginLine} />
      <View style={styles.pageText}>
        {NOTES.map((n, i) => (
          <View key={n} style={styles.noteRow}>
            <Text style={styles.noteNum}>{i + 1}</Text>
            <Text style={styles.note}>{n}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function Welcome() {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Text style={styles.logo}>Crushwave</Text>

      <View style={styles.middle}>
        <Text style={styles.headline}>Dates, friends and study partners from your campus</Text>
        <NotebookPage />
      </View>

      <View style={styles.actions}>
        <Button title="Get started" onPress={() => router.push('/sign-in')} />
        <View style={styles.signIn}>
          <Text style={type.small}>Already joined? </Text>
          <TextLink title="Sign in" onPress={() => router.push('/sign-in')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space(6) },
  logo: { fontFamily: fonts.semibold, fontSize: 18, lineHeight: 24, color: colors.ink, marginTop: space(4) },
  middle: { flex: 1, justifyContent: 'center' },
  headline: { ...type.display, marginBottom: space(8) },
  page: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    height: space(4) * 2 + RULE * 8,
    overflow: 'hidden',
    transform: [{ rotate: '-1.5deg' }],
    shadowColor: '#1F1B16',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  ruled: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(60,90,140,0.14)' },
  marginLine: { position: 'absolute', top: 0, bottom: 0, left: 44, width: 1.5, backgroundColor: colors.accent },
  pageText: { paddingTop: space(4), paddingRight: space(4) },
  noteRow: { flexDirection: 'row', marginBottom: RULE },
  noteNum: { width: 44, textAlign: 'center', fontFamily: fonts.medium, fontSize: 15, lineHeight: RULE, color: colors.accent },
  note: { flex: 1, paddingLeft: space(3), fontFamily: fonts.regular, fontSize: 15, lineHeight: RULE, color: colors.ink },
  actions: { paddingBottom: space(4) },
  signIn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: space(4) },
});
