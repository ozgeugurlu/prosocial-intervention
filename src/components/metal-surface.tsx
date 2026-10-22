import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

type Finish = 'card' | 'cta' | 'bar';

/**
 * Brushed-metal background: a soft diagonal gradient with a light top edge,
 * like light catching a machined surface. Use it behind cards, the tab bar
 * and primary buttons.
 */
export function MetalSurface({ finish = 'card', style, children }: PropsWithChildren<{ finish?: Finish; style?: StyleProp<ViewStyle> }>) {
  const theme = useTheme();
  const colors = finish === 'cta' ? theme.metalCta : finish === 'bar' ? theme.metalBar : theme.metalCard;
  return (
    <LinearGradient
      colors={colors as unknown as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, { borderColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.9)' }, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: { borderTopWidth: StyleSheet.hairlineWidth * 2 },
});
