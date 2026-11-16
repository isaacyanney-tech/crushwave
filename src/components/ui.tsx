import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextInputProps, TextStyle, ViewStyle } from 'react-native';

import { ICON, colors, fonts, radius, space, type } from '@/lib/theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  /** primary = ink, accent = the red pen (Like and the match moment only). */
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, onPress, variant = 'primary', icon, disabled, loading, style }: ButtonProps) {
  const isDisabled = disabled || loading;
  const filled = variant === 'primary' || variant === 'accent';
  const fg = filled ? colors.white : variant === 'danger' ? colors.danger : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && { backgroundColor: colors.ink },
        variant === 'accent' && { backgroundColor: pressed ? colors.accentPressed : colors.accent },
        (variant === 'secondary' || variant === 'danger') && styles.btnSecondary,
        pressed && { transform: [{ scale: 0.98 }] },
        pressed && variant !== 'accent' && { opacity: 0.88 },
        isDisabled && { opacity: 0.4 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.btnInner}>
          {icon ? <Ionicons name={icon} size={ICON} color={fg} /> : null}
          <Text style={[styles.btnText, { color: fg }]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

/** A plain text link in the red pen. */
export function TextLink({ title, onPress, muted }: { title: string; onPress?: () => void; muted?: boolean }) {
  return (
    <Text
      onPress={onPress}
      suppressHighlighting
      style={[styles.link, (muted || !onPress) && { color: colors.muted }]}
      accessibilityRole="link"
    >
      {title}
    </Text>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label?: string; hint?: string }) {
  return (
    <View style={{ marginBottom: space(5) }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.style]} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipText, selected && { color: colors.white }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

export function H1({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.h1, style]}>{children}</Text>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h2}>{children}</Text>;
}

export function P({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <Text style={[styles.p, muted && { color: colors.secondary }]}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/**
 * The signature detail: the red margin line of a school exercise book.
 * Used beside prompt answers, rules, tips and notes, nowhere else.
 */
export function MarginNote({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.margin, style]}>{children}</View>;
}

export function Banner({ text, tone = 'warning' }: { text: string; tone?: 'warning' | 'info' }) {
  return (
    <View style={[styles.banner, { backgroundColor: tone === 'warning' ? colors.warnBg : colors.infoBg }]}>
      <Ionicons
        name={tone === 'warning' ? 'alert-circle-outline' : 'information-circle-outline'}
        size={ICON}
        color={colors.secondary}
      />
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  btn: {
    minHeight: 48,
    borderRadius: radius.control,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(5),
  },
  btnSecondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: space(2) },
  btnText: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 20 },
  link: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20, color: colors.accent },
  label: { ...type.label, marginBottom: space(2) },
  hint: { ...type.meta, marginTop: space(2) },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radius.control,
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: space(3),
    paddingVertical: space(2),
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: colors.ink },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), marginBottom: space(6) },
  h1: { ...type.title, marginBottom: space(2) },
  h2: { ...type.heading, marginBottom: space(2), marginTop: space(2) },
  p: { ...type.body, marginBottom: space(4) },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: space(5),
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: space(4),
  },
  margin: { borderLeftWidth: 2, borderLeftColor: colors.accent, paddingLeft: space(4) },
  banner: {
    flexDirection: 'row',
    gap: space(2),
    alignItems: 'flex-start',
    borderRadius: radius.control,
    padding: space(3),
    marginBottom: space(3),
  },
  bannerText: { ...type.small, flex: 1, color: colors.ink },
});
