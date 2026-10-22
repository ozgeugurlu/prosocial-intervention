/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Metallic theme: brushed platinum in light mode, gunmetal in dark mode,
 * with polished-steel accents. `metal` holds the gradient stops used by
 * <MetalSurface> for cards, the tab bar and primary buttons.
 */
export const Colors = {
  light: {
    isDark: false,
    text: '#1E242B',
    background: '#E3E6EA',
    backgroundElement: '#F3F4F6',
    backgroundSelected: '#D2D7DD',
    textSecondary: '#5B6470',
    card: '#F5F6F8',
    cardForeground: '#1E242B',
    popover: '#F5F6F8',
    popoverForeground: '#1E242B',
    primary: '#52606F',
    primaryForeground: '#F5F6F8',
    secondary: '#D2D7DD',
    secondaryForeground: '#1E242B',
    muted: '#DADEE3',
    mutedForeground: '#5B6470',
    accent: '#AEB7C1',
    accentForeground: '#14181D',
    destructive: '#B0503B',
    destructiveForeground: '#F5F6F8',
    border: 'rgba(30, 36, 43, 0.13)',
    input: 'transparent',
    inputBackground: '#ECEEF1',
    switchBackground: '#C2C9D1',
    ring: '#52606F',
    cta: '#B7C0CA',
    onCta: '#14181D',
    userBubble: '#D3D9E0',
    metalCard: ['#FBFCFD', '#EEF0F3', '#F7F8FA'],
    metalCta: ['#E9EDF1', '#AEB8C3', '#D5DCE3'],
    metalBar: ['#FDFDFE', '#E3E7EB'],
  },
  dark: {
    isDark: true,
    text: '#ECEFF2',
    background: '#0E1114',
    backgroundElement: '#161A1F',
    backgroundSelected: '#232A31',
    textSecondary: '#98A2AD',
    card: '#161A1F',
    cardForeground: '#ECEFF2',
    popover: '#161A1F',
    popoverForeground: '#ECEFF2',
    primary: '#C3CCD5',
    primaryForeground: '#11151A',
    secondary: '#232A31',
    secondaryForeground: '#ECEFF2',
    muted: '#20262C',
    mutedForeground: '#98A2AD',
    accent: '#2A3139',
    accentForeground: '#ECEFF2',
    destructive: '#E07A62',
    destructiveForeground: '#11151A',
    border: '#2A3139',
    input: '#232A31',
    inputBackground: '#1B2026',
    switchBackground: '#2A3139',
    ring: '#7C8A98',
    cta: '#C3CCD5',
    onCta: '#11151A',
    userBubble: '#2A323B',
    metalCard: ['#1E242A', '#14181C', '#1A1F25'],
    metalCta: ['#EEF2F5', '#9EA9B5', '#D7DEE5'],
    metalBar: ['#232A31', '#15191E'],
  },
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
