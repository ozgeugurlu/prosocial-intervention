import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

/**
 * Screen background: deep navy with a soft light bloom near the top, after the
 * team's reference images. Kept plain (no lines) so text stays readable.
 */
export function NavyBackdrop() {
  const theme = useTheme();
  const [glow, mid, deep] = theme.backdrop;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="bloom" cx="0.5" cy="0.1" rx="0.9" ry="0.65">
            <Stop offset="0" stopColor={glow} />
            <Stop offset="0.5" stopColor={mid} />
            <Stop offset="1" stopColor={deep} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="860" fill="url(#bloom)" />
      </Svg>
    </View>
  );
}
