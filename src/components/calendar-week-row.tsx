import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Sprout, Heart, Ear } from 'lucide-react-native';

import { CalendarDay, DayStatus } from '@/components/calendar-day';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface DayData {
  dayNumber: number;
  status: DayStatus;
}

interface CalendarWeekRowProps {
  weekNumber: number;
  badgeIconType?: 'sprout' | 'heart' | 'ear';
  isBadgeEarned?: boolean;
  days: DayData[];
}

export function CalendarWeekRow({
  weekNumber,
  badgeIconType,
  isBadgeEarned = false,
  days,
}: CalendarWeekRowProps) {
  const theme = useTheme();

  // Colors for the small weekly badge icons on the right
  const badgeColors = {
    sprout: {
      bg: '#8B9A4725',
      icon: '#8B9A47',
    },
    heart: {
      bg: '#4CAF5025',
      icon: '#4CAF50',
    },
    ear: {
      bg: '#E8980825',
      icon: '#E89808',
    },
  };

  const renderBadge = () => {
    if (!badgeIconType) return null;

    const colors = badgeColors[badgeIconType];
    const iconSize = 15;

    // If badge is not earned yet, show a greyed out outline circle or don't show
    if (!isBadgeEarned) {
      return (
        <View style={[styles.badgeCircle, { backgroundColor: theme.muted }]} />
      );
    }

    return (
      <View style={[styles.badgeCircle, { backgroundColor: colors.bg }]}>
        {badgeIconType === 'sprout' && (
          <Sprout size={iconSize} color={colors.icon} fill={colors.icon} />
        )}
        {badgeIconType === 'heart' && (
          <Heart size={iconSize} color={colors.icon} fill={colors.icon} />
        )}
        {badgeIconType === 'ear' && (
          <Ear size={iconSize} color={colors.icon} fill={colors.icon} />
        )}
      </View>
    );
  };

  const isFutureWeek = days.every(day => day.status === 'locked');

  return (
    <View style={styles.container}>
      {/* Week Header */}
      <View style={styles.headerRow}>
        <ThemedText
          style={[
            styles.weekTitle,
            {
              color: isFutureWeek ? theme.textSecondary + '70' : theme.text,
            },
          ]}
        >
          Week {weekNumber}
        </ThemedText>
        {renderBadge()}
      </View>

      {/* Days Row */}
      <View style={styles.daysRow}>
        {days.map((day) => (
          <CalendarDay
            key={day.dayNumber}
            dayNumber={day.dayNumber}
            status={day.status}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.four,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  weekTitle: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  badgeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});
