import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Check, Sun, Moon } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type DayStatus = 'completed' | 'active' | 'locked';

interface CalendarDayProps {
  dayNumber: number;
  status: DayStatus;
}

export function CalendarDay({ dayNumber, status }: CalendarDayProps) {
  const theme = useTheme();

  // Color constants
  const morningColor = '#E89808';
  const eveningColor = '#4B66E7';

  const isLocked = status === 'locked';
  const isActive = status === 'active';
  const isCompleted = status === 'completed';

  return (
    <View
      style={[
        styles.capsule,
        {
          backgroundColor: isLocked ? theme.muted + '40' : theme.background,
        },
      ]}
    >
      <ThemedText
        style={[
          styles.dayText,
          {
            color: isLocked ? theme.textSecondary + '60' : theme.text,
          },
        ]}
      >
        {dayNumber}
      </ThemedText>

      {!isLocked && (
        <View style={styles.indicators}>
          {/* Morning Indicator */}
          <View
            style={[
              styles.indicatorBox,
              {
                backgroundColor: isCompleted ? morningColor : morningColor + '20',
              },
            ]}
          >
            {isCompleted ? (
              <Check size={9} color="#FFFFFF" strokeWidth={4} />
            ) : (
              <Sun size={9} color={morningColor} strokeWidth={2.5} />
            )}
          </View>

          {/* Evening Indicator */}
          <View
            style={[
              styles.indicatorBox,
              {
                backgroundColor: isCompleted ? eveningColor : eveningColor + '20',
              },
            ]}
          >
            {isCompleted ? (
              <Check size={9} color="#FFFFFF" strokeWidth={4} />
            ) : (
              <Moon size={9} color={eveningColor} strokeWidth={2.5} />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  capsule: {
    width: 42,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 6,
  },
  dayText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  indicators: {
    flexDirection: 'row',
    gap: 3,
  },
  indicatorBox: {
    width: 14,
    height: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
