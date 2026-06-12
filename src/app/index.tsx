import { Lock, Play, Sun } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircularProgress } from '@/components/circular-progress';
import { CollapsibleCard } from '@/components/collapsible-card';
import { HomeCard } from '@/components/home-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useTheme } from '@/hooks/use-theme';
import { storage } from '@/utils/storage';

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULTS = {
  credits: 0,
  status: 'Bronze',
  studyLength: 50, // total study duration in days
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentWeek, daysElapsed } = useStudy();

  const [credits, setCredits] = useState(DEFAULTS.credits);
  const [status, setStatus] = useState(DEFAULTS.status);

  // Load persisted values on mount
  useEffect(() => {
    (async () => {
      const storedCredits = await storage.getItem('@peach_credits', DEFAULTS.credits);
      const storedStatus = await storage.getItem('@peach_status', DEFAULTS.status);
      setCredits(storedCredits);
      setStatus(storedStatus);
    })();
  }, []);

  // Derived values
  const weekDay = {
    week: currentWeek,
    dayName: DAY_NAMES[new Date().getDay()],
  };

  const daysRemaining = Math.max(0, DEFAULTS.studyLength - daysElapsed);
  const studyPercentage = Math.min(100, (daysElapsed / DEFAULTS.studyLength) * 100);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: BottomTabInset + Spacing.six,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Week Badge ─────────────────────────────────────────────── */}
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { borderColor: theme.primary }]}>
            <View style={[styles.badgeDot, { backgroundColor: theme.primary }]} />
            <ThemedText style={[styles.badgeText, { color: theme.text }]}>
              Week {weekDay.week} • {weekDay.dayName}
            </ThemedText>
          </View>
        </View>

        {/* ── Greeting ───────────────────────────────────────────────── */}
        <View style={styles.greetingContainer}>
          <ThemedText style={styles.greetingTitle}>{getGreeting()}</ThemedText>
          <ThemedText style={styles.greetingSubtitle} themeColor="textSecondary">
            Your journey continues.
          </ThemedText>
        </View>

        {/* ── Progress Status ────────────────────────────────────────── */}
        <CollapsibleCard
          title="Progress Status"
          leading={<View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />}
        >
          <View style={styles.goalSection}>
            <ThemedText style={styles.goalLabel} themeColor="textSecondary">
              Your Change Goal
            </ThemedText>
            <ThemedText style={styles.goalText}>
              Be more helpful, kind, and generous to others.
            </ThemedText>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: theme.background }]}>
              <ThemedText style={[styles.statValue, { color: theme.primary }]}>
                {credits}
              </ThemedText>
              <ThemedText style={styles.statLabel} themeColor="textSecondary">
                Credits Earned
              </ThemedText>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.background }]}>
              <ThemedText style={[styles.statValue, { color: theme.primary }]}>
                {status}
              </ThemedText>
              <ThemedText style={styles.statLabel} themeColor="textSecondary">
                Current Status
              </ThemedText>
            </View>
          </View>
        </CollapsibleCard>

        {/* ── This Morning's Tasks ───────────────────────────────────── */}
        <CollapsibleCard
          title="This Morning's Tasks"
          leading={
            <View style={[styles.iconCircle, { backgroundColor: '#E8980820' }]}>
              <Sun size={20} color="#E89808" strokeWidth={2.2} />
            </View>
          }
        >
          <View style={[styles.intentionBox, { backgroundColor: theme.background }]}>
            <ThemedText style={styles.intentionLabel} themeColor="textSecondary">
              Implementation Intention
            </ThemedText>
            <ThemedText style={styles.intentionText}>
              If I see someone struggling with groceries, then I will offer to help carry them.
            </ThemedText>
          </View>

          <Pressable
            style={[styles.videoCta, { backgroundColor: theme.primary }]}
            onPress={() => {
              // TODO: navigate to video player
            }}
          >
            <View style={styles.videoCtaLeft}>
              <Play size={18} color={theme.text} fill={theme.text} />
              <ThemedText style={[styles.videoCtaText, { color: theme.text }]}>
                Watch today's video
              </ThemedText>
            </View>
            <ThemedText style={[styles.videoDuration, { color: theme.text }]}>
              4:30
            </ThemedText>
          </Pressable>
        </CollapsibleCard>

        {/* ── Locked Evening Card ────────────────────────────────────── */}
        <HomeCard style={styles.lockedCard}>
          <Lock size={28} color={theme.textSecondary} strokeWidth={1.6} />
          <ThemedText style={styles.lockedText} themeColor="textSecondary">
            Available this evening
          </ThemedText>
        </HomeCard>

        {/* ── Study Progress ─────────────────────────────────────────── */}
        <HomeCard>
          <View style={styles.studyRow}>
            <View style={styles.studyTextGroup}>
              <ThemedText style={styles.studyLabel} themeColor="textSecondary">
                Study Progress
              </ThemedText>
              <ThemedText style={styles.studyValue}>
                {daysRemaining} days remaining
              </ThemedText>
            </View>
            <CircularProgress percentage={2} size={64} strokeWidth={6} />
          </View>
        </HomeCard>
      </ScrollView>
    </ThemedView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },

  // Badge
  badgeContainer: {
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '600',
  },

  // Greeting
  greetingContainer: {
    alignItems: 'center',
    gap: 4,
  },
  greetingTitle: {
    fontFamily: Fonts.serif,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
    textAlign: 'center',
  },
  greetingSubtitle: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },

  // Shared card innards
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Goal section
  goalSection: {
    marginTop: Spacing.three,
    gap: 4,
  },
  goalLabel: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  goalText: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 24,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.three,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 2,
  },
  statValue: {
    fontFamily: Fonts.serif,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  statLabel: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Implementation intention
  intentionBox: {
    marginTop: Spacing.three,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  intentionLabel: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  intentionText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 23,
  },

  // Video CTA
  videoCta: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  videoCtaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  videoCtaText: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  videoDuration: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '500',
  },

  // Locked card
  lockedCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 10,
  },
  lockedText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '500',
  },

  // Study progress
  studyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studyTextGroup: {
    flex: 1,
    gap: 2,
    marginRight: Spacing.three,
    position: 'relative'
  },
  studyLabel: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  studyValue: {
    fontFamily: Fonts.serif,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28
  },
});
