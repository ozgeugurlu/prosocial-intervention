/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#3D3428',
    background: '#F5F1E8',
    backgroundElement: '#FDFCF9',
    backgroundSelected: '#E8DCC8',
    textSecondary: '#7A6F5D',
    card: '#FDFCF9',
    cardForeground: '#3D3428',
    popover: '#FDFCF9',
    popoverForeground: '#3D3428',
    primary: '#C9A961',
    primaryForeground: '#3D3428',
    secondary: '#E8DCC8',
    secondaryForeground: '#3D3428',
    muted: '#EAE4D8',
    mutedForeground: '#7A6F5D',
    accent: '#D4AF37',
    accentForeground: '#3D3428',
    destructive: '#C87D5F',
    destructiveForeground: '#FDFCF9',
    border: 'rgba(61, 52, 40, 0.12)',
    input: 'transparent',
    inputBackground: '#FAF7F0',
    switchBackground: '#D4C4A8',
    ring: '#C9A961',
  },
  dark: {
    text: '#FAFAFA',
    background: '#0A0A0A',
    backgroundElement: '#171717',
    backgroundSelected: '#262626',
    textSecondary: '#A1A1A1',
    card: '#0A0A0A',
    cardForeground: '#FAFAFA',
    popover: '#0A0A0A',
    popoverForeground: '#FAFAFA',
    primary: '#FAFAFA',
    primaryForeground: '#171717',
    secondary: '#262626',
    secondaryForeground: '#FAFAFA',
    muted: '#262626',
    mutedForeground: '#A1A1A1',
    accent: '#262626',
    accentForeground: '#FAFAFA',
    destructive: '#82181A',
    destructiveForeground: '#FB2C36',
    border: '#262626',
    input: '#262626',
    inputBackground: '#262626',
    switchBackground: '#262626',
    ring: '#525252',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
