import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlashcardCard } from '@/components/flashcard-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { VideoCard } from '@/components/video-card';
import { WeekDrawer } from '@/components/week-drawer';
import { BottomTabInset, MaxContentWidth, Spacing, Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ExploreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.three,
  };
  const theme = useTheme();

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
          <WeekDrawer title="Week 1" subtitle="6 items" />
          <WeekDrawer title="Week 2" subtitle="6 items" />
          <WeekDrawer title="Week 3" subtitle="6 items" isCurrent={true} defaultOpen={true}>
            <VideoCard
              title="The Power of Active Listening"
              metadata="Monday • 4:30"
              onPress={() => {
                // Video action
              }}
            />
            <FlashcardCard
              frontText="Deep Listening"
              backText="Listening with undivided attention, fully present without planning your reply."
            />
            <VideoCard
              title="Communication and Connection"
              metadata="Wednesday • 5:20"
              onPress={() => {
                // Video action
              }}
            />
            <FlashcardCard
              frontText="Being Fully Present"
              backText="Bringing your complete attention to the current moment without distraction or judgment."
            />
          </WeekDrawer>
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
