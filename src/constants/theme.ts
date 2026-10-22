/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Royal navy & silver theme, after the team's reference images: a deep navy
 * backdrop with a soft light bloom and flowing silver arcs (<NavyBackdrop>),
 * frosted navy-glass cards, and polished-silver buttons. The app commits to
 * this one look, so light and dark mode share it.
 */
const NAVY = {
  isDark: true,
  text: '#F3F6FB',
  background: 'rgba(255, 255, 255, 0.07)',
  backgroundElement: 'rgba(255, 255, 255, 0.09)',
  backgroundSelected: 'rgba(255, 255, 255, 0.16)',
  textSecondary: '#AFBCD4',
  card: '#13306A',
  cardForeground: '#F3F6FB',
  popover: '#13306A',
  popoverForeground: '#F3F6FB',
  primary: '#DCE3EE',
  primaryForeground: '#0B1E46',
  secondary: 'rgba(255, 255, 255, 0.12)',
  secondaryForeground: '#F3F6FB',
  muted: 'rgba(255, 255, 255, 0.10)',
  mutedForeground: '#AFBCD4',
  accent: '#1D4189',
  accentForeground: '#F3F6FB',
  destructive: '#FF9C86',
  destructiveForeground: '#0B1E46',
  border: 'rgba(214, 224, 240, 0.22)',
  input: 'rgba(255, 255, 255, 0.10)',
  inputBackground: 'rgba(255, 255, 255, 0.09)',
  switchBackground: 'rgba(255, 255, 255, 0.18)',
  ring: '#DCE3EE',
  cta: '#DCE3EE',
  onCta: '#0B1E46',
  userBubble: 'rgba(220, 227, 238, 0.20)',
  silver: '#C3CCD9',
  // Backdrop: bloom at the top, deep navy at the edges.
  backdrop: ['#3A62B0', '#1A3C82', '#0B1E46'],
  metalCard: ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.11)'],
  metalCta: ['#FFFFFF', '#AEB8C6', '#E6EAF0'],
  metalBar: ['rgba(32,64,130,0.92)', 'rgba(11,30,70,0.96)'],
} as const;

export const Colors = {
  light: NAVY,
  dark: NAVY,
} as const;

type ColorKeys<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T];
export type ThemeColor = ColorKeys<typeof Colors.light> & ColorKeys<typeof Colors.dark>;

export const Fonts = {
  sans: 'DMSans',
  sansItalic: 'DMSans-Italic',
  serif: 'CrimsonPro',
  serifItalic: 'CrimsonPro-Italic',
  mono: 'DMSans',
};

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
