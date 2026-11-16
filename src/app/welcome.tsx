import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { ScrollViewInstance } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors, radius, space } from '@/lib/theme';

const SLIDES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: 'school',
    title: 'Only real students',
    body: 'Everyone signs up with their school email, so you know the people you meet are students like you.',
  },
  {
    icon: 'heart',
    title: 'Dates, friends or a study buddy',
    body: 'Say what you’re here for. Like someone, and if they like you back, it’s a match and you can chat.',
  },
  {
    icon: 'shield-checkmark',
    title: 'Safe by design',
    body: 'Your surname, birthday and number stay private. Report or block anyone in one tap.',
  },
];

export default function Welcome() {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const scroller = useRef<ScrollViewInstance>(null);
  const last = page === SLIDES.length - 1;

  const next = () => {
    if (last) return router.push('/sign-in');
    scroller.current?.scrollTo({ x: (page + 1) * width, animated: true });
    setPage(page + 1);
  };

  return (
    <LinearGradient colors={[colors.primary, colors.wave]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.top}>
          <Text style={styles.logo}>crushwave</Text>
          {!last ? (
            <Text style={styles.skip} onPress={() => router.push('/sign-in')}>
              Skip
            </Text>
          ) : null}
        </View>

        <ScrollView
          ref={scroller}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
          style={{ flex: 1 }}
        >
          {SLIDES.map((s) => (
            <View key={s.title} style={[styles.slide, { width }]}>
              <View style={styles.iconCircle}>
                <Ionicons name={s.icon} size={64} color="#fff" />
              </View>
              <Text style={styles.title}>{s.title}</Text>
              <Text style={styles.body}>{s.body}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {SLIDES.map((s, i) => (
              <View key={s.title} style={[styles.dot, i === page && styles.dotOn]} />
            ))}
          </View>
          <Button title={last ? 'Get started' : 'Next'} onPress={next} style={styles.cta} textColor={colors.primaryDark} />
          <Text style={styles.small} onPress={() => router.push('/sign-in')}>
            Already have an account? <Text style={{ fontWeight: '800' }}>Sign in</Text>
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space(6), paddingTop: space(3) },
  logo: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  skip: { color: 'rgba(255,255,255,0.9)', fontSize: 16, fontWeight: '600', padding: space(2) },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space(8) },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space(8),
  },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  body: { color: 'rgba(255,255,255,0.92)', fontSize: 17, lineHeight: 25, textAlign: 'center', marginTop: space(3) },
  bottom: { paddingHorizontal: space(6), paddingBottom: space(4) },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: space(2), marginBottom: space(5) },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotOn: { width: 24, backgroundColor: '#fff' },
  cta: { backgroundColor: '#fff', borderRadius: radius.pill },
  small: { color: '#fff', textAlign: 'center', marginTop: space(4), fontSize: 15 },
});
