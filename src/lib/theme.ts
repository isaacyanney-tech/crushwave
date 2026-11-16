/**
 * Crushwave design tokens.
 *
 * Direction: a student's exercise book. Off-white paper, dark ink, and one red
 * pen. The chrome stays quiet; colour comes from people's photos, the match
 * moment, and the red margin rule (our signature detail).
 *
 * Redesign follows "unslop" by Damir Sokolovsky (@heydamir), CC BY 4.0.
 */
export const colors = {
  // Neutral ramp, a touch warm like paper.
  bg: '#F6F4F0',
  card: '#FDFCFA',
  raised: '#EEEBE5',
  line: 'rgba(31,27,22,0.10)',
  ink: '#1F1B16', // primary text, primary buttons
  secondary: '#5E554A',
  muted: '#7B7266',

  // The red pen. Used rarely: Like, unread, the margin rule, links.
  accent: '#C8402A',
  accentPressed: '#A93422',

  // Meaning only, toned to sit in the palette.
  positive: '#2E7D5B',
  danger: '#B42318',
  warnBg: '#F7EEDC',
  infoBg: '#ECEAE4',

  white: '#FFFFFF',
  scrim: 'rgba(31,27,22,0.45)',
};

export const fonts = {
  regular: 'Figtree_400Regular',
  medium: 'Figtree_500Medium',
  semibold: 'Figtree_600SemiBold',
  // Large headlines only, never labels or buttons.
  display: 'Newsreader_500Medium',
};

/** Type scale. Hierarchy comes from size and colour, not heavy weights. */
export const type = {
  display: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, letterSpacing: -0.5, color: colors.ink },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: colors.ink },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: colors.ink },
  label: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 20, color: colors.ink },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: colors.secondary },
  meta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.muted },
} as const;

export const radius = { tag: 6, control: 10, card: 14, sheet: 20 };
export const space = (n: number) => n * 4;
export const ICON = 18;
