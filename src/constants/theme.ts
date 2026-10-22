/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * Navy & silver theme: deep navy for text and primary actions, brushed silver
 * surfaces, and polished-silver highlights. `metal*` hold the gradient stops
 * used by <MetalSurface> for cards, the tab bar and primary buttons.
 */
export const Colors = {
  light: {
    isDark: false,
    text: '#0F1D36',
    background: '#E4E8EE',
    backgroundElement: '#F2F4F7',
    backgroundSelected: '#D3DAE4',
    textSecondary: '#55627A',
    card: '#F5F7FA',
    cardForeground: '#0F1D36',
    popover: '#F5F7FA',
    popoverForeground: '#0F1D36',
    primary: '#1D3461',
    primaryForeground: '#EEF2F7',
    secondary: '#D3DAE4',
    secondaryForeground: '#0F1D36',
    muted: '#DCE1E8',
    mutedForeground: '#55627A',
    accent: '#B9C3D1',
    accentForeground: '#0F1D36',
    destructive: '#B0503B',
    destructiveForeground: '#F5F7FA',
    border: 'rgba(15, 29, 54, 0.13)',
    input: 'transparent',
    inputBackground: '#EDF0F4',
    switchBackground: '#C3CCD8',
    ring: '#1D3461',
    cta: '#1D3461',
    onCta: '#EEF2F7',
    userBubble: '#D6DEEA',
    metalCard: ['#FCFDFE', '#EDF0F4', '#F7F9FB'],
    metalCta: ['#2C4A80', '#152A52', '#22406F'],
    metalBar: ['#FDFDFE', '#E1E6ED'],
  },
  dark: {
    isDark: true,
    text: '#E9EDF4',
    background: '#08111F',
    backgroundElement: '#0F1B30',
    backgroundSelected: '#1A2A47',
    textSecondary: '#97A4B8',
    card: '#0F1B30',
    cardForeground: '#E9EDF4',
    popover: '#0F1B30',
    popoverForeground: '#E9EDF4',
    primary: '#C7D0DC',
    primaryForeground: '#0C1628',
    secondary: '#1A2A47',
    secondaryForeground: '#E9EDF4',
    muted: '#15233C',
    mutedForeground: '#97A4B8',
    accent: '#1A2A47',
    accentForeground: '#E9EDF4',
    destructive: '#E07A62',
    destructiveForeground: '#0C1628',
    border: '#1F3150',
    input: '#1A2A47',
    inputBackground: '#12203A',
    switchBackground: '#1F3150',
    ring: '#8E9CB2',
    cta: '#C7D0DC',
    onCta: '#0C1628',
    userBubble: '#1C2E50',
    metalCard: ['#16264A', '#0D1830', '#13223F'],
    metalCta: ['#F1F4F8', '#A9B5C5', '#DCE3EC'],
    metalBar: ['#1A2B4C', '#0C1628'],
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
