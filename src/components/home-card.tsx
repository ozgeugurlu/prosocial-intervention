import { PropsWithChildren } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';

import { MetalSurface } from '@/components/metal-surface';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface HomeCardProps {
  style?: ViewStyle;
}

/**
 * Reusable card container used throughout the home screen.
 * Provides the white rounded card with subtle shadow.
 */
export function HomeCard({ children, style }: PropsWithChildren<HomeCardProps>) {
  const theme = useTheme();

  return (
    <MetalSurface
      finish="card"
      style={[
        styles.card,
        {
          shadowColor: theme.isDark ? '#000000' : '#2A3440',
          borderColor: theme.border,
        },
        style,
      ]}
    >
      {children}
    </MetalSurface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: Spacing.four,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
