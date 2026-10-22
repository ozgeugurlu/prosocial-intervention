import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

/**
 * App-wide background: deep navy with a soft light bloom near the top and
 * thin silver arcs and ribbons, after the team's reference images.
 */
export function NavyBackdrop() {
  const theme = useTheme();
  const [glow, mid, deep] = theme.backdrop;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="bloom" cx="0.5" cy="0.12" rx="0.85" ry="0.7">
            <Stop offset="0" stopColor={glow} />
            <Stop offset="0.45" stopColor={mid} />
            <Stop offset="1" stopColor={deep} />
          </RadialGradient>
          <LinearGradient id="arc" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.05} />
            <Stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0.75} />
            <Stop offset="0.7" stopColor="#C9D3E3" stopOpacity={0.35} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.05} />
          </LinearGradient>
          <LinearGradient id="ribbon" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.02} />
            <Stop offset="0.5" stopColor="#DCE5F5" stopOpacity={0.28} />
            <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.04} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="400" height="860" fill="url(#bloom)" />
        {/* Large silver arc sweeping from top left round to the lower right */}
        <Path d="M60 -10 C-40 160 -20 520 150 650 C260 735 360 700 420 610" stroke="url(#arc)" strokeWidth={1.6} fill="none" />
        <Path d="M300 -20 C380 40 420 120 410 200" stroke="url(#arc)" strokeWidth={1.2} fill="none" />
        {/* Soft satin ribbons along the bottom */}
        <Path d="M-20 760 C90 700 210 800 420 690 L420 740 C220 840 100 760 -20 820 Z" fill="url(#ribbon)" />
        <Path d="M-20 820 C120 760 250 860 420 780 L420 800 C250 880 120 790 -20 845 Z" fill="url(#ribbon)" />
      </Svg>
    </View>
  );
}
