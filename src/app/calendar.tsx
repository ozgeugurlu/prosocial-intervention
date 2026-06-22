import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BadgeCard } from '@/components/badge-card';
import { CalendarWeekRow } from '@/components/calendar-week-row';
import { HomeCard } from '@/components/home-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BADGES = {
  1: {
    title: 'First Steps',
    subtitle: 'Week 1',
    iconType: 'sprout',
  },
  2: {
    title: 'Empathy Builder',
    subtitle: 'Week 2',
    iconType: 'heart',
  },
  3: {
    title: 'Deep Listener',
    subtitle: 'Week 3',
    iconType: 'ear',
  },
  4: {
    title: 'Placeholder 1',
    subtitle: 'Week 4',
    iconType: 'ear',
  },
  5: {
    title: 'Placeholder 2',
    subtitle: 'Week 5',
    iconType: 'ear',
  },
  6: {
    title: 'Placeholder 3',
    subtitle: 'Week 6',
    iconType: 'ear',
  },
  7: {
    title: 'Placeholder 4',
    subtitle: 'Week 7',
    iconType: 'ear',
  },
  8: {
    title: 'Placeholder 5',
    subtitle: 'Week 8',
    iconType: 'sprout',
  },
  9: {
    title: 'Placeholder 6',
    subtitle: 'Week 9',
    iconType: 'heart',
  },
}

export default function CalendarScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const { currentDay, currentWeek } = useStudy();

  const contentPlatformStyle = Platform.select({
    android: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    ios: {
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
    web: {
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
  });

  // Mock progress data for 7 weeks calculated dynamically
  const getDaysForWeek = (weekNum: number) => {
    const startDay = (weekNum - 1) * 7 + 1;
    return Array.from({ length: 7 }, (_, i) => {
      const dayNum = startDay + i;
      let status: 'completed' | 'active' | 'locked' = 'locked';

      if (dayNum < currentDay) {
        status = 'completed';
      } else if (dayNum === currentDay) {
        status = 'active'; // Today
      }

      return { dayNumber: dayNum, status };
    });
  };

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <ThemedText style={styles.headerTitle}>Your Journey</ThemedText>
          <ThemedText style={styles.headerSubtitle} themeColor="textSecondary">
            7-week prosociality intervention
          </ThemedText>
        </View>

        {/* Badges Earned Section */}
        <HomeCard style={styles.card}>
          <ThemedText style={styles.cardTitle}>Badges Earned</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.badgesScroll}
          >
            {Object.keys(BADGES).map((key) => (
              <BadgeCard
                key={key}
                title={BADGES[key].title}
                subtitle={BADGES[key].subtitle}
                iconType={BADGES[key].iconType}
                isEarned={currentWeek >= Number(key)}
              />
            ))}
          </ScrollView>
        </HomeCard>

        {/* Progress Section */}
        <HomeCard style={styles.card}>
          <ThemedText style={styles.cardTitle}>Progress</ThemedText>

          {/* Weekdays Headers */}
          <View style={styles.weekdaysRow}>
            {WEEKDAYS.map((day) => (
              <ThemedText key={day} style={styles.weekdayText} themeColor="textSecondary">
                {day}
              </ThemedText>
            ))}
          </View>

          {/* Weeks List */}
          <View style={styles.weeksList}>
            <CalendarWeekRow
              weekNumber={1}
              badgeIconType="sprout"
              isBadgeEarned={currentWeek > 1}
              days={getDaysForWeek(1)}
            />
            <CalendarWeekRow
              weekNumber={2}
              badgeIconType="heart"
              isBadgeEarned={currentWeek > 2}
              days={getDaysForWeek(2)}
            />
            <CalendarWeekRow
              weekNumber={3}
              badgeIconType="ear"
              isBadgeEarned={currentWeek > 3}
              days={getDaysForWeek(3)}
            />
            <CalendarWeekRow
              weekNumber={4}
              badgeIconType="sprout"
              isBadgeEarned={currentWeek > 4}
              days={getDaysForWeek(4)}
            />
            <CalendarWeekRow
              weekNumber={5}
              badgeIconType="heart"
              isBadgeEarned={currentWeek > 5}
              days={getDaysForWeek(5)}
            />
            <CalendarWeekRow
              weekNumber={6}
              badgeIconType="ear"
              isBadgeEarned={currentWeek > 6}
              days={getDaysForWeek(6)}
            />
            <CalendarWeekRow
              weekNumber={7}
              badgeIconType="sprout"
              isBadgeEarned={currentWeek >= 7}
              days={getDaysForWeek(7)}
            />
            <CalendarWeekRow
              weekNumber={8}
              badgeIconType="ear"
              isBadgeEarned={currentWeek > 8}
              days={getDaysForWeek(8)}
            />
            <CalendarWeekRow
              weekNumber={9}
              badgeIconType="sprout"
              isBadgeEarned={currentWeek >= 9}
              days={getDaysForWeek(9)}
            />
          </View>
        </HomeCard>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  headerContainer: {
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    gap: 4,
  },
  headerTitle: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
  },
  headerSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
  },
  card: {
    gap: Spacing.three,
  },
  cardTitle: {
    fontFamily: Fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  badgesScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: Spacing.four,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: Spacing.two,
    marginTop: Spacing.two,
  },
  weekdayText: {
    width: 42, // Matches CalendarDay width
    textAlign: 'center',
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '600',
  },
  weeksList: {
    width: '100%',
    marginTop: Spacing.one,
  },
});
