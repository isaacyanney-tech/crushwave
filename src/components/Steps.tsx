import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, space } from '@/lib/theme';

/** Top bar for step-by-step screens: back arrow, "Step 2 of 6" and a progress bar. */
export function StepHeader({
  step,
  total,
  onBack,
  label,
}: {
  step: number;
  total: number;
  onBack?: () => void;
  label?: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.back} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <Text style={styles.headerLabel}>{label ?? 'Create your profile'}</Text>
        <Text style={styles.stepText}>
          {step} of {total}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(4, (step / total) * 100)}%` }]} />
      </View>
    </View>
  );
}

/** A large tappable choice with an icon, title and short description. */
export function OptionCard({
  icon,
  title,
  body,
  selected,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.option, selected && styles.optionOn]}
    >
      <View style={[styles.optionIcon, selected && { backgroundColor: colors.primary }]}>
        <Ionicons name={icon} size={22} color={selected ? '#fff' : colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.optionTitle}>{title}</Text>
        {body ? <Text style={styles.optionBody}>{body}</Text> : null}
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={selected ? colors.primary : colors.line}
      />
    </Pressable>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(3) },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: space(3) },
  back: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
  },
  headerLabel: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '700', color: colors.ink },
  stepText: { width: 38, textAlign: 'right', fontSize: 12, fontWeight: '600', color: colors.muted },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    padding: space(4),
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    marginBottom: space(3),
  },
  optionOn: { borderColor: colors.primary, backgroundColor: colors.tint },
  optionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  optionBody: { fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 2 },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    marginBottom: space(1),
  },
});
