import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ICON, colors, fonts, radius, space, type } from '@/lib/theme';

/** Top bar for step-by-step screens: back arrow, "2 of 7" and a thin progress line. */
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
        <Text style={styles.headerLabel}>{label ?? 'Your profile'}</Text>
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
      <Ionicons name={icon} size={ICON} color={colors.secondary} style={styles.optionIcon} />
      <View style={{ flex: 1 }}>
        <Text style={type.label}>{title}</Text>
        {body ? <Text style={[type.small, { marginTop: space(1) }]}>{body}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioOn]}>{selected ? <View style={styles.radioDot} /> : null}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: space(5), paddingTop: space(2), paddingBottom: space(4) },
  headerRow: { flexDirection: 'row', alignItems: 'center', height: 40, marginBottom: space(3) },
  back: { width: 40, height: 40, justifyContent: 'center' },
  headerLabel: { flex: 1, textAlign: 'center', fontFamily: fonts.medium, fontSize: 15, color: colors.ink },
  stepText: { width: 40, textAlign: 'right', ...type.meta, fontVariant: ['tabular-nums'] },
  track: { height: 2, backgroundColor: colors.line, overflow: 'hidden' },
  fill: { height: 2, backgroundColor: colors.ink },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space(3),
    minHeight: 72,
    paddingHorizontal: space(4),
    paddingVertical: space(4),
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    marginBottom: space(3),
  },
  optionOn: { borderColor: colors.ink },
  optionIcon: { width: 20 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.ink },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.ink },
});
