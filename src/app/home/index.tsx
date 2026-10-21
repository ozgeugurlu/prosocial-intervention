import { useRouter, type Href } from 'expo-router';
import { Check, ChevronRight, ClipboardList, Flame, Lock, MessageCircle, Moon, PlayCircle, Sun } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircularProgress } from '@/components/circular-progress';
import { GoalBoard } from '@/components/goal-board';
import { HomeCard } from '@/components/home-card';
import { ProsocialityCard } from '@/components/prosociality-card';
import { RollingScoreCard } from '@/components/rolling-score-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EVENING_OPENS_AT_HOUR, formatHour } from '@/constants/study';
import { BottomTabInset, Fonts, Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useParticipantRecords } from '@/hooks/use-participant-records';
import { useTheme } from '@/hooks/use-theme';
import { currentStreak, weeklySurveyWindow } from '@/utils/participation';
import type { DailyProgress } from '@/utils/storage';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface TaskRowProps {
  icon: typeof Sun;
  label: string;
  done: boolean;
  locked?: boolean;
  lockedNote?: string;
  onPress?: () => void;
}

function TaskRow({ icon: Icon, label, done, locked, lockedNote, onPress }: TaskRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={locked || done ? undefined : onPress}
      style={({ pressed }) => [styles.taskRow, { backgroundColor: theme.background }, pressed && !locked && !done && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked || done, checked: done }}
    >
      <Icon size={20} color={locked ? theme.textSecondary : theme.primary} />
      <View style={{ flex: 1 }}>
        <ThemedText style={[styles.taskLabel, done && styles.taskDone]} themeColor={locked ? 'textSecondary' : 'text'}>
          {label}
        </ThemedText>
        {locked && lockedNote ? (
          <ThemedText style={styles.taskNote} themeColor="textSecondary">
            {lockedNote}
          </ThemedText>
        ) : null}
      </View>
      {done ? (
        <View style={[styles.check, { backgroundColor: '#4CAF50' }]}>
          <Check size={14} color="#fff" strokeWidth={3} />
        </View>
      ) : locked ? (
        <Lock size={16} color={theme.textSecondary} />
      ) : (
        <ChevronRight size={18} color={theme.textSecondary} />
      )}
    </Pressable>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentWeek, currentDay, daysElapsed, progress, userName, startDate } = useStudy();
  const { goals, weekly, config } = useParticipantRecords();

  const today: Partial<DailyProgress> = progress[currentDay] ?? {};
  const eveningOpen = new Date().getHours() >= EVENING_OPENS_AT_HOUR;
  const eveningNote = `Opens at ${formatHour(EVENING_OPENS_AT_HOUR)}`;
  const streak = currentStreak(progress, currentDay);
  const studyLength = config.studyLengthDays;
  const daysRemaining = Math.max(0, studyLength - daysElapsed);
  const pct = Math.min(100, (daysElapsed / studyLength) * 100);
  const window = weeklySurveyWindow(startDate, config.weeklySurveyOpenDays ?? 3);
  const weeklyDone = weekly.some((w) => w.weekOf === window.weekOf);
  const studyOver = currentDay > studyLength;

  const isDark = theme.background === '#0A0A0A';
  const accent = isDark ? theme.primary : theme.accent;
  const go = (href: Href) => router.push(href);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.four, paddingBottom: BottomTabInset + Spacing.six }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { borderColor: theme.primary }]}>
            <View style={[styles.badgeDot, { backgroundColor: theme.primary }]} />
            <ThemedText style={styles.badgeText}>
              Week {currentWeek} • {DAY_NAMES[new Date().getDay()]}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => go('/calendar')}
            style={[styles.badge, { borderColor: streak > 0 ? '#E8763A' : theme.border }]}
            accessibilityLabel={`${streak} day streak`}
          >
            <Flame size={16} color={streak > 0 ? '#E8763A' : theme.textSecondary} fill={streak > 0 ? '#E8763A' : 'transparent'} />
            <ThemedText style={styles.badgeText}>{streak}-day streak</ThemedText>
          </Pressable>
        </View>

        <View style={styles.greeting}>
          <ThemedText style={styles.greetingTitle}>
            {getGreeting()}
            {userName ? `, ${userName}` : ''}
          </ThemedText>
          <ThemedText style={styles.greetingSub} themeColor="textSecondary">
            {studyOver ? 'You have completed the program. Thank you!' : 'Your journey continues.'}
          </ThemedText>
        </View>

        {/* Weekly survey (Sun–Tue by default) */}
        {window.isOpen && !weeklyDone && (
          <Pressable onPress={() => go('/home/weekly-survey')} style={[styles.weeklyCta, { backgroundColor: accent }]}>
            <ClipboardList size={22} color={isDark ? '#171717' : '#3D3428'} />
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.weeklyTitle, { color: isDark ? '#171717' : '#3D3428' }]}>Your weekly survey is open</ThemedText>
              <ThemedText style={[styles.weeklySub, { color: isDark ? '#171717' : '#3D3428' }]}>
                About 3 minutes. It updates your prosociality score.
              </ThemedText>
            </View>
            <ChevronRight size={20} color={isDark ? '#171717' : '#3D3428'} />
          </Pressable>
        )}

        <GoalBoard goals={goals} />

        {/* Today's tasks */}
        <HomeCard>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Today</ThemedText>
            <ThemedText style={styles.cardMeta} themeColor="textSecondary">
              Day {currentDay} of {studyLength}
            </ThemedText>
          </View>
          <View style={styles.tasks}>
            <ThemedText style={styles.section} themeColor="textSecondary">
              Morning
            </ThemedText>
            <TaskRow icon={Sun} label="Morning chat with Percy" done={!!today['morning chat']} onPress={() => go('/chat')} />
            <TaskRow icon={PlayCircle} label="Watch today's video" done={!!today['morning video']} onPress={() => go('/chat')} />
            <ThemedText style={styles.section} themeColor="textSecondary">
              Evening
            </ThemedText>
            <TaskRow
              icon={Moon}
              label="Evening chat with Percy"
              done={!!today['night chat']}
              locked={!eveningOpen}
              lockedNote={eveningNote}
              onPress={() => go('/chat')}
            />
            <TaskRow
              icon={MessageCircle}
              label="Evening reflection"
              done={!!today['night survey']}
              locked={!eveningOpen}
              lockedNote={eveningNote}
              onPress={() => go('/home/survey')}
            />
          </View>
        </HomeCard>

        {/* Study progress */}
        <HomeCard>
          <View style={styles.progressRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText style={styles.cardTitle}>Program progress</ThemedText>
              <ThemedText themeColor="textSecondary" style={styles.cardMeta}>
                {daysRemaining} days remaining
              </ThemedText>
            </View>
            <CircularProgress percentage={pct} size={64} strokeWidth={6} />
          </View>
        </HomeCard>

        <ProsocialityCard records={weekly} />
        <RollingScoreCard />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.four, gap: Spacing.four, maxWidth: 680, width: '100%', alignSelf: 'center' },
  badgeRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
  badge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, gap: 8 },
  badgeDot: { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 14, fontWeight: '600' },
  greeting: { alignItems: 'center', gap: 4 },
  greetingTitle: { fontFamily: Fonts.serif, fontSize: 34, fontWeight: '700', lineHeight: 40, textAlign: 'center' },
  greetingSub: { fontSize: 16, lineHeight: 22, textAlign: 'center' },
  weeklyCta: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: Spacing.three },
  weeklyTitle: { fontSize: 16, fontWeight: '700' },
  weeklySub: { fontSize: 13, opacity: 0.85 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { fontFamily: Fonts.serif, fontSize: 20, fontWeight: '700', lineHeight: 24 },
  cardMeta: { fontSize: 13 },
  tasks: { marginTop: Spacing.two, gap: Spacing.two },
  section: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: Spacing.two },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  taskLabel: { fontSize: 15, fontWeight: '600' },
  taskDone: { textDecorationLine: 'line-through', opacity: 0.6 },
  taskNote: { fontSize: 12 },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
