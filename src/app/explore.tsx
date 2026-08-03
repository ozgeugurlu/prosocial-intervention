import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlashcardCard } from '@/components/flashcard-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WeekDrawer } from '@/components/week-drawer';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useTheme } from '@/hooks/use-theme';
import { getFlashcardWeeks } from '@/utils/firestore';
import { type FlashcardWeek } from '@/utils/schema';
import { useEffect, useState } from 'react';

export default function ExploreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();
  const { currentWeek } = useStudy();
  const [weeks, setWeeks] = useState<FlashcardWeek[]>([])

  useEffect(() => {
    const fetchCards = async () => {
      const cards = await getFlashcardWeeks();
      setWeeks(cards);
    };
    fetchCards();
  }, [])

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

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
      showsVerticalScrollIndicator={false}
    >
      <ThemedView style={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <ThemedText style={styles.headerTitle}>Media Library</ThemedText>
          <ThemedText style={styles.headerSubtitle} themeColor="textSecondary">
            Psychoeducational content for your journey
          </ThemedText>
        </View>

        {/* Content Section */}
        <View style={styles.drawersContainer}>
          {weeks.map((week) => {
            const weekNumber = week.week + 1;
            const itemCount = week.cards.length;
            return (
              <WeekDrawer
                key={week.week}
                title={`Week ${weekNumber}`}
                subtitle={`${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
                isCurrent={currentWeek === weekNumber}
                defaultOpen={currentWeek === weekNumber}
              >
                {week.cards.map((card, cardIndex) => (
                  <FlashcardCard
                    key={cardIndex}
                    frontText={card.front}
                    backText={card.back}
                    type={card.type}
                  />
                ))}
              </WeekDrawer>
            );
          })}
        </View>
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
  },
  headerContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.three,
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
  drawersContainer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
});
