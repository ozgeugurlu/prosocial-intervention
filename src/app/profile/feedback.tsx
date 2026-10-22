/**
 * Participation summary and feedback.
 * Metrics are computed in-app (utils/participation.ts); written feedback comes
 * from the research team (participants/{uid}/feedback/{week}).
 */
import { useFocusEffect } from 'expo-router';
import { MessageSquareQuote, Sparkles } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeCard } from '@/components/home-card';
import { ProsocialityCard } from '@/components/prosociality-card';
import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useParticipantRecords } from '@/hooks/use-participant-records';
import { useTheme } from '@/hooks/use-theme';
import { getTeamFeedback, type TeamFeedback } from '@/utils/participant-data';
import { computeMetrics, evaluateParticipation, weeklySurveysOffered } from '@/utils/participation';

function Meter({ label, value, hint }: { label: string; value: number | null; hint: string }) {
  const theme = useTheme();
  const pct = value == null ? 0 : Math.round(value * 100);
  return (
    <View style={styles.meter} accessible accessibilityLabel={`${label}: ${value == null ? 'not yet available' : `${pct} percent`}`}>
      <View style={styles.meterTop}>
        <ThemedText style={styles.meterLabel}>{label}</ThemedText>
        <ThemedText style={[styles.meterValue, { color: theme.primary }]}>{value == null ? '—' : `${pct}%`}</ThemedText>
      </View>
      <View style={[styles.track, { backgroundColor: theme.muted }]}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: theme.primary }]} />
      </View>
      <ThemedText themeColor="textSecondary" style={styles.meterHint}>
        {hint}
      </ThemedText>
    </View>
  );
}

export default function FeedbackScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { uid, progress, currentDay, startDate } = useStudy();
  const { daily, weekly } = useParticipantRecords();
  const [team, setTeam] = useState<TeamFeedback[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (uid) getTeamFeedback(uid).then(setTeam).catch(() => undefined);
    }, [uid]),
  );

  const m = computeMetrics(progress, currentDay, daily, weekly, weeklySurveysOffered(startDate));
  const evaluation = evaluateParticipation(m);

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader title="My participation" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.six }]}>
        <HomeCard style={styles.evalCard}>
          <Sparkles size={24} color={theme.primary} />
          <ThemedText style={styles.evalTitle}>{evaluation.headline}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.evalText}>
            {evaluation.message}
          </ThemedText>
        </HomeCard>

        <HomeCard style={{ gap: Spacing.three }}>
          <ThemedText style={styles.cardTitle}>Your numbers so far</ThemedText>
          <Meter label="Check-in days" value={m.interactionRate} hint={`${m.activeDays} ${m.activeDays === 1 ? 'day' : 'days'} with at least one activity`} />
          <Meter label="Percy chats" value={m.chatRate} hint="Morning and evening sessions completed" />
          <Meter label="Evening reflections" value={m.dailySurveyRate} hint={`${daily.length} ${daily.length === 1 ? 'reflection' : 'reflections'} completed`} />
          <Meter label="Activities done" value={m.behaviorRate} hint="Days you said you completed the suggested activity" />
          <Meter label="Weekly surveys" value={m.weeklySurveyRate} hint={`${weekly.length} weekly ${weekly.length === 1 ? 'survey' : 'surveys'} completed`} />
          <View style={styles.streaks}>
            <ThemedText style={styles.streakText}>🔥 Current streak: {m.currentStreak} days</ThemedText>
            <ThemedText style={styles.streakText} themeColor="textSecondary">
              Best: {m.longestStreak} days
            </ThemedText>
          </View>
        </HomeCard>

        <ProsocialityCard records={weekly} />

        <View style={{ gap: Spacing.two }}>
          <ThemedText style={styles.sectionTitle}>Notes from the research team</ThemedText>
          {team.length === 0 ? (
            <ThemedText themeColor="textSecondary" style={styles.evalText}>
              The research team may leave you personal notes here during the program.
            </ThemedText>
          ) : (
            team.map((f) => (
              <View key={f.week} style={[styles.note, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.noteHeader}>
                  <MessageSquareQuote size={18} color={theme.primary} />
                  <ThemedText style={styles.noteWeek}>Week {f.week}</ThemedText>
                </View>
                <ThemedText style={styles.noteText}>{f.message}</ThemedText>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.four, maxWidth: 680, width: '100%', alignSelf: 'center' },
  evalCard: { alignItems: 'center', gap: Spacing.two },
  evalTitle: { fontFamily: Fonts.serif, fontSize: 22, fontWeight: '700', lineHeight: 27, textAlign: 'center' },
  evalText: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  cardTitle: { fontFamily: Fonts.serif, fontSize: 17, fontWeight: '700' },
  meter: { gap: 6 },
  meterTop: { flexDirection: 'row', justifyContent: 'space-between' },
  meterLabel: { fontSize: 15, fontWeight: '600' },
  meterValue: { fontSize: 15, fontWeight: '700' },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  meterHint: { fontSize: 12 },
  streaks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.one },
  streakText: { fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontFamily: Fonts.serif, fontSize: 18, fontWeight: '700' },
  note: { borderRadius: 16, borderWidth: 1, padding: Spacing.three, gap: 8 },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteWeek: { fontSize: 13, fontWeight: '700' },
  noteText: { fontSize: 15, lineHeight: 22 },
});
