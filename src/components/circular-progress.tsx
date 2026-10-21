import { AnimatedCircularProgress } from 'react-native-circular-progress';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CircularProgressProps {
  /** 0 – 100 */
  percentage: number;
  /** Outer diameter in points. Default 64 */
  size?: number;
  /** Ring thickness in points. Default 6 */
  strokeWidth?: number;
}

/**
 * Themed circular progress ring.
 * Wraps react-native-circular-progress with the app's colour tokens.
 */
export function CircularProgress({
  percentage,
  size = 64,
  strokeWidth = 6,
}: CircularProgressProps) {
  const theme = useTheme();
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <AnimatedCircularProgress
      size={size}
      width={strokeWidth}
      fill={clamped}
      tintColor={theme.primary}
      backgroundColor={theme.muted}
      duration={800}
      rotation={0}
      lineCap="round"
    >
      {(fill: number) => (
        <ThemedText style={{ fontFamily: Fonts.sans, fontWeight: '600', fontSize: size * 0.22 }}>
          {Math.round(fill)}%
        </ThemedText>
      )}
    </AnimatedCircularProgress>
  );
}
