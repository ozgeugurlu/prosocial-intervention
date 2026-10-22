/**
 * Calendar: interaction streak plus a day-by-day record of activity across the program.
 */
import { Check, Flame, Trophy } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BadgeCard, type BadgeIconType } from '@/components/badge-card';
import { HomeCard } from '@/components/home-card';
import { PrestartCard } from '@/components/prestart-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useParticipantRecords } from '@/hooks/use-participant-records';
import { useTheme } from '@/hooks/use-theme';
import {
  currentStreak,
  dateForStudyDay,
  dayState,
  isActiveDay,
  longestStreak,
  TASKS,
  type DayState,
} from '@/utils/participation';

const TASK_LABELS: Record<(typeof TASKS)[number], string> = {
  'morning chat': 'Morning chat',
  'morning video': 'Video',
  'night chat': 'Evening chat',
  'night survey': 'Reflection',
};

// Placeholder badge names for weeks 4–9: research team to rename.
const BADGES: { title: string; icon: BadgeIconType }[] = [
  { title: 'First Steps', icon: 'sprout' },
  { title: 'Empathy Builder', icon: 'heart' },
  { title: 'Deep Listener', icon: 'ear' },
  { title: 'Week 4', icon: 'sprout' },
  { title: 'Week 5', icon: 'heart' },
  { title: 'Week 6', icon: 'ear' },
  { title: 'Week 7', icon: 'sprout' },
  { title: 'Week 8', icon: 'heart' },
  { title: 'Week 9', icon: 'ear' },
];
/** A week's badge is earned with at least this many active days in it. */
const BADGE_MIN_ACTIVE_DAYS = 4;

export default function CalendarScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentDay, progress, startDate, hasStarted } = useStudy();
  const { config } = useParticipantRecords();
  const [selected, setSelected] = useState<number>(currentDay);

  const studyLength = config.studyLengthDays;
  const weeks = Math.ceil(studyLength / 7);
  const streak = currentStreak(progress, currentDay);
  const best = longestStreak(progress, currentDay);
  const activeTotal = Array.from({ length: currentDay }, (_, i) => i + 1).filter((d) => isActiveDay(progress[d])).length;

  const colors: Record<DayState, { bg: string; fg: string; border: string }> = {
    full: { bg: '#4CAF50', fg: '#fff', border: 'transparent' },
    partial: { bg: `${theme.primary}55`, fg: theme.text, border: 'transparent' },
    missed: { bg: 'transparent', fg: theme.textSecondary, border: theme.border },
    today: { bg: 'transparent', fg: theme.text, border: theme.primary },
    upcoming: { bg: theme.muted, fg: theme.textSecondary, border: 'transparent' },
  };

  const weekActiveDays = (w: number) => {
    let n = 0;
    for (let d = w * 7 + 1; d <= Math.min((w + 1) * 7, currentDay); d++) if (isActiveDay(progress[d])) n++;
    return n;
  };

  const selectedDate = startDate ? dateForStudyDay(startDate, selected) : null;
  const selectedProgress = progress[selected];

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.six }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>Your journey</ThemedText>
          <ThemedText style={styles.subtitle} themeColor="textSecondary">
            {weeks}-week prosociality program
          </ThemedText>
        </View>

        {!hasStarted && <PrestartCard compact />}

        {/* Streak */}
        <HomeCard style={styles.streakCard}>
          <View style={styles.streakMain}>
            <Flame size={40} color="#E8763A" fill={streak > 0 ? '#E8763A' : 'transparent'} />
            <View>
              <ThemedText style={styles.streakNumber}>{streak}</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.streakLabel}>
                day streak
              </ThemedText>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.streakStats}>
            <View style={styles.stat}>
              <Trophy size={16} color={theme.primary} />
              <ThemedText style={styles.statText}>Best: {best} days</ThemedText>
            </View>
            <View style={styles.stat}>
              <Check size={16} color="#4CAF50" />
              <ThemedText style={styles.statText}>
                {activeTotal} of {currentDay} days active
              </ThemedText>
            </View>
          </View>
        </HomeCard>

        {/* Badges */}
        <HomeCard style={styles.card}>
          <ThemedText style={styles.cardTitle}>Badges</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badges}>
            {BADGES.slice(0, weeks).map((b, w) => (
              <BadgeCard
                key={w}
                title={b.title}
                subtitle={`Week ${w + 1}`}
                iconType={b.icon}
                isEarned={weekActiveDays(w) >= BADGE_MIN_ACTIVE_DAYS}
              />
            ))}
          </ScrollView>
        </HomeCard>

        {/* Activity calendar */}
        <HomeCard style={styles.card}>
          <ThemedText style={styles.cardTitle}>Activity</ThemedText>
          <View style={styles.legend}>
            {(['full', 'partial', 'missed'] as DayState[]).map((s) => (
              <View key={s} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors[s].bg, borderColor: colors[s].border }]} />
                <ThemedText themeColor="textSecondary" style={styles.legendText}>
                  {s === 'full' ? 'All tasks' : s === 'partial' ? 'Some tasks' : 'Missed'}
                </ThemedText>
              </View>
            ))}
          </View>

          {Array.from({ length: weeks }, (_, w) => (
            <View key={w} style={styles.weekRow}>
              <ThemedText style={styles.weekLabel} themeColor="textSecondary">
                W{w + 1}
              </ThemedText>
              <View style={styles.days}>
                {Array.from({ length: 7 }, (_, i) => {
                  const day = w * 7 + i + 1;
                  if (day > studyLength) return <View key={i} style={styles.dayCell} />;
                  const state = hasStarted ? dayState(progress, day, currentDay) : 'upcoming';
                  const c = colors[state];
                  const date = startDate ? dateForStudyDay(startDate, day) : null;
                  const isSel = selected === day;
                  return (
                    <Pressable
                      key={i}
                      onPress={() => setSelected(day)}
                      disabled={state === 'upcoming'}
                      style={[
                        styles.dayCell,
                        styles.day,
                        { backgroundColor: c.bg, borderColor: isSel ? theme.text : c.border, borderWidth: isSel || c.border !== 'transparent' ? 1.5 : 0 },
                      ]}
                      accessibilityLabel={`Day ${day}${date ? `, ${date.toDateString()}` : ''}: ${state}`}
                    >
                      <ThemedText style={[styles.dayDow, { color: c.fg }]}>
                        {date ? date.toLocaleDateString(undefined, { weekday: 'narrow' }) : ''}
                      </ThemedText>
                      <ThemedText style={[styles.dayNum, { color: c.fg }]}>{date ? date.getDate() : day}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Selected day detail */}
          <View style={[styles.detail, { backgroundColor: theme.background }]}>
            <ThemedText style={styles.detailTitle}>
              Day {selected}
              {selectedDate ? ` · ${selectedDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}` : ''}
            </ThemedText>
            <View style={styles.detailTasks}>
              {TASKS.map((t) => {
                const done = !!selectedProgress?.[t];
                return (
                  <View key={t} style={[styles.taskChip, { borderColor: done ? '#4CAF50' : theme.border, backgroundColor: done ? '#4CAF5018' : 'transparent' }]}>
                    {done && <Check size={12} color="#4CAF50" strokeWidth={3} />}
                    <ThemedText style={styles.taskChipText} themeColor={done ? 'text' : 'textSecondary'}>
                      {TASK_LABELS[t]}
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          </View>
        </HomeCard>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.four, maxWidth: 680, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', gap: 4 },
  title: { fontFamily: Fonts.serif, fontSize: 34, fontWeight: '700', lineHeight: 40 },
  subtitle: { fontSize: 16, lineHeight: 22 },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  streakMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakNumber: { fontFamily: Fonts.serif, fontSize: 40, fontWeight: '700', lineHeight: 44 },
  streakLabel: { fontSize: 13, marginTop: -4 },
  divider: { width: 1, alignSelf: 'stretch' },
  streakStats: { flex: 1, gap: 8 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 14 },
  card: { gap: Spacing.three },
  cardTitle: { fontFamily: Fonts.serif, fontSize: 20, fontWeight: '700', lineHeight: 26 },
  badges: { flexDirection: 'row', gap: 12, paddingRight: Spacing.four },
  legend: { flexDirection: 'row', gap: Spacing.three, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 4, borderWidth: 1 },
  legendText: { fontSize: 12 },
  weekRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekLabel: { width: 26, fontSize: 12, fontWeight: '700' },
  days: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  dayCell: { flex: 1, aspectRatio: 0.8, maxWidth: 48 },
  day: { borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayDow: { fontSize: 10, lineHeight: 12 },
  dayNum: { fontSize: 15, fontWeight: '700', lineHeight: 18 },
  detail: { borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  detailTitle: { fontSize: 15, fontWeight: '700' },
  detailTasks: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  taskChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  taskChipText: { fontSize: 13 },
});
