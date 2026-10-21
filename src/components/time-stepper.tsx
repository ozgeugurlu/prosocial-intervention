import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatTime, parseTime } from '@/utils/notifications';

interface TimeStepperProps {
  label: string;
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  /** Allowed hour range, inclusive */
  minHour?: number;
  maxHour?: number;
  stepMinutes?: number;
}

/** Simple, accessible time chooser in 15-minute steps (no native picker dependency). */
export function TimeStepper({ label, value, onChange, minHour = 0, maxHour = 23, stepMinutes = 15 }: TimeStepperProps) {
  const theme = useTheme();
  const { hour, minute } = parseTime(value);
  const total = hour * 60 + minute;

  const shift = (delta: number) => {
    const min = minHour * 60;
    const max = maxHour * 60 + (60 - stepMinutes);
    const next = Math.min(max, Math.max(min, total + delta));
    onChange(`${String(Math.floor(next / 60)).padStart(2, '0')}:${String(next % 60).padStart(2, '0')}`);
  };

  const btn = [styles.btn, { backgroundColor: theme.background, borderColor: theme.border }];
  return (
    <View style={[styles.row, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <ThemedText style={styles.label}>{label}</ThemedText>
      <View style={styles.controls}>
        <Pressable style={btn} onPress={() => shift(-stepMinutes)} accessibilityLabel={`Earlier ${label}`} hitSlop={6}>
          <Minus size={16} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.time} accessibilityLiveRegion="polite">
          {formatTime(value)}
        </ThemedText>
        <Pressable style={btn} onPress={() => shift(stepMinutes)} accessibilityLabel={`Later ${label}`} hitSlop={6}>
          <Plus size={16} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  label: { fontSize: 15, fontWeight: '600' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  time: { fontFamily: Fonts.serif, fontSize: 20, fontWeight: '700', minWidth: 84, textAlign: 'center' },
});
