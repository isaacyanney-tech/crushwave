import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';

import { colors, radius, space } from '@/lib/theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textColor?: string;
};

export function Button({ title, onPress, variant = 'primary', disabled, loading, style, textColor }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.btn,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'secondary' && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        variant === 'danger' && { backgroundColor: colors.danger },
        pressed && { opacity: 0.85 },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor ?? (variant === 'primary' || variant === 'danger' ? '#fff' : colors.ink)} />
      ) : (
        <Text
          style={[
            styles.btnText,
            (variant === 'secondary' || variant === 'ghost') && { color: colors.ink },
            textColor ? { color: textColor } : null,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label?: string; hint?: string }) {
  return (
    <View style={{ marginBottom: space(4) }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.style]} />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={[styles.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

export function H1({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h1}>{children}</Text>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <Text style={styles.h2}>{children}</Text>;
}

export function P({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return <Text style={[styles.p, muted && { color: colors.muted }]}>{children}</Text>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Banner({ text, tone = 'warning' }: { text: string; tone?: 'warning' | 'info' }) {
  return (
    <View
      style={[
        styles.banner,
        tone === 'warning' ? { backgroundColor: '#FFF4E0', borderColor: colors.warning } : { backgroundColor: '#EEF4FF', borderColor: '#B7CCF5' },
      ]}
    >
      <Text style={styles.bannerText}>{text}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  btn: {
    minHeight: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space(6),
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink, marginBottom: space(2) },
  hint: { fontSize: 12, color: colors.muted, marginTop: space(1) },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space(4),
    paddingVertical: space(3),
    fontSize: 16,
    color: colors.ink,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: space(4),
    paddingVertical: space(2),
  },
  chipText: { fontSize: 14, color: colors.ink, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space(2), marginBottom: space(4) },
  h1: { fontSize: 28, fontWeight: '700', color: colors.ink, marginBottom: space(2) },
  h2: { fontSize: 18, fontWeight: '700', color: colors.ink, marginBottom: space(2), marginTop: space(2) },
  p: { fontSize: 15, lineHeight: 22, color: colors.ink, marginBottom: space(3) },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space(4),
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: space(4),
  },
  banner: { borderWidth: 1, borderRadius: radius.md, padding: space(3), marginBottom: space(3) },
  bannerText: { fontSize: 13, lineHeight: 19, color: colors.ink },
});
