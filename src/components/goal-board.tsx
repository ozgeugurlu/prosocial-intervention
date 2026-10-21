import { useRouter } from 'expo-router';
import { Pencil, Target } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { HomeCard } from '@/components/home-card';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WeeklyGoal } from '@/utils/participant-data';
import { formatWeekOf, weekOfFor } from '@/utils/participation';

/** Reminder board: this week's goal and if-then plan, updated by the participant each Sunday. */
export function GoalBoard({ goals }: { goals: WeeklyGoal[] }) {
  const theme = useTheme();
  const router = useRouter();
  const thisWeek = weekOfFor();
  const current = goals.find((g) => g.weekOf === thisWeek);
  const previous = goals.find((g) => g.weekOf < thisWeek);
  const isSunday = new Date().getDay() === 0;
  const isDark = theme.background === '#0A0A0A';
  const accent = isDark ? theme.primary : theme.accent;

  return (
    <HomeCard>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.icon, { backgroundColor: `${theme.primary}25` }]}>
            <Target size={20} color={theme.primary} strokeWidth={2.2} />
          </View>
          <View>
            <ThemedText style={styles.title}>Reminder board</ThemedText>
            <ThemedText style={styles.subtitle} themeColor="textSecondary">
              Week of {formatWeekOf(thisWeek)}
            </ThemedText>
          </View>
        </View>
        {current && (
          <Pressable onPress={() => router.push('/home/goal')} hitSlop={10} accessibilityLabel="Edit goal">
            <Pencil size={18} color={theme.textSecondary} />
          </Pressable>
        )}
      </View>

      {current ? (
        <View style={styles.body}>
          <View style={[styles.box, { backgroundColor: theme.background }]}>
            <ThemedText style={styles.label} themeColor="textSecondary">
              This week&apos;s goal
            </ThemedText>
            <ThemedText style={styles.goal}>{current.goal}</ThemedText>
          </View>
          <View style={[styles.box, { backgroundColor: theme.background }]}>
            <ThemedText style={styles.label} themeColor="textSecondary">
              If-then plan
            </ThemedText>
            <ThemedText style={styles.plan}>
              <ThemedText style={styles.kw}>If </ThemedText>
              {current.ifThen.if}
              <ThemedText style={styles.kw}>, then </ThemedText>
              {current.ifThen.then}.
            </ThemedText>
          </View>
        </View>
      ) : (
        <View style={styles.body}>
          <ThemedText style={styles.empty} themeColor="textSecondary">
            {isSunday
              ? "It's Sunday: time to set your goal and if-then plan for the week ahead."
              : "You haven't set a goal for this week yet. You can set one now."}
          </ThemedText>
          {previous && (
            <ThemedText style={styles.prev} themeColor="textSecondary">
              Last week: {previous.goal}
            </ThemedText>
          )}
          <Pressable style={[styles.cta, { backgroundColor: accent }]} onPress={() => router.push('/home/goal')}>
            <ThemedText style={[styles.ctaText, { color: isDark ? '#171717' : '#3D3428' }]}>Set this week&apos;s goal</ThemedText>
          </Pressable>
        </View>
      )}
    </HomeCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.serif, fontSize: 20, fontWeight: '700', lineHeight: 24 },
  subtitle: { fontSize: 13 },
  body: { marginTop: Spacing.three, gap: Spacing.two },
  box: { borderRadius: 14, padding: Spacing.three, gap: 4 },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  goal: { fontFamily: Fonts.serif, fontSize: 19, lineHeight: 25, fontWeight: '600' },
  plan: { fontSize: 15, lineHeight: 22 },
  kw: { fontWeight: '700', fontSize: 15 },
  empty: { fontSize: 15, lineHeight: 22 },
  prev: { fontSize: 13, fontStyle: 'italic' },
  cta: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: Spacing.one },
  ctaText: { fontSize: 15, fontWeight: '700' },
});
