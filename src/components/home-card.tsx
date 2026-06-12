import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

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
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          shadowColor: theme.text,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: Spacing.four,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});
