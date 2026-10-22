import { View, type ViewProps } from 'react-native';

import { NavyBackdrop } from '@/components/navy-backdrop';
import { ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

/**
 * Without `type`, this is a screen root: a solid navy surface with the soft
 * light bloom behind its content. Each screen paints its own opaque background,
 * so screens never show through one another.
 */
export function ThemedView({ style, lightColor, darkColor, type, children, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();
  if (type) {
    return <View style={[{ backgroundColor: theme[type] }, style]} {...otherProps}>{children}</View>;
  }
  return (
    <View style={[{ backgroundColor: theme.screen }, style]} {...otherProps}>
      <NavyBackdrop />
      {children}
    </View>
  );
}
