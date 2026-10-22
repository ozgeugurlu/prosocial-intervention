/**
 * Library: one drop-down per program week. Each open week lists, in order:
 *   1. the participant's if-then plan for that week,
 *   2. the week's psychoeducation video (unless an item's `order` places it earlier),
 *   3. the rest of the week's videos, audio, messages and flashcards.
 * Weeks after the current one stay locked until the participant reaches them.
 */
import { useFocusEffect, useRouter } from 'expo-router';
import { FileText, Headphones, Play, Target, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FlashcardCard } from '@/components/flashcard-card';
import { MediaPlayer } from '@/components/media-player';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WeekDrawer } from '@/components/week-drawer';
import { BottomTabInset, Fonts, Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useParticipantRecords } from '@/hooks/use-participant-records';
import { useTheme } from '@/hooks/use-theme';
import { getFlashcardWeeks, getMediaItems } from '@/utils/firestore';
import type { WeeklyGoal } from '@/utils/participant-data';
import { dateForStudyDay, toDateKey } from '@/utils/participation';
import type { Flashcard, MediaItem } from '@/utils/schema';

type Entry = { kind: 'media'; item: MediaItem; order: number } | { kind: 'card'; card: Flashcard; order: number };

const PROGRAM_WEEKS = 9;

function IfThenReminder({ goal, isCurrent }: { goal?: WeeklyGoal; isCurrent: boolean }) {
  const theme = useTheme();
  const router = useRouter();
  return (
    <View style={[styles.reminder, { backgroundColor: theme.background, borderColor: theme.border }]}>
      <View style={styles.reminderHead}>
        <Target size={16} color={theme.primary} />
        <ThemedText style={styles.reminderLabel} themeColor="textSecondary">
          Your if-then plan
        </ThemedText>
      </View>
      {goal ? (
        <>
          <ThemedText style={styles.reminderGoal}>{goal.goal}</ThemedText>
          <ThemedText style={styles.reminderPlan}>
            <ThemedText style={styles.kw}>If </ThemedText>
            {goal.ifThen.if}
            <ThemedText style={styles.kw}>, then </ThemedText>
            {goal.ifThen.then}.
          </ThemedText>
        </>
      ) : isCurrent ? (
        <Pressable onPress={() => router.push('/home/goal')} accessibilityRole="button">
          <ThemedText style={[styles.reminderPlan, { color: theme.primary, fontWeight: '700' }]}>
            Set this week&apos;s goal and if-then plan →
          </ThemedText>
        </Pressable>
      ) : (
        <ThemedText style={styles.reminderPlan} themeColor="textSecondary">
          No plan was set this week.
        </ThemedText>
      )}
    </View>
  );
}

function MediaRow({ item, onPress }: { item: MediaItem; onPress: () => void }) {
  const theme = useTheme();
  const Icon = item.type === 'audio' ? Headphones : item.type === 'text' ? FileText : Play;
  const meta = [item.psychoed ? 'Psychoeducation' : item.day, item.durationLabel].filter(Boolean).join(' • ');
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.mediaRow, { backgroundColor: theme.background, borderColor: theme.border }, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityLabel={`${item.type === 'text' ? 'Read' : 'Play'} ${item.title}`}
    >
      <View style={[styles.playTile, { backgroundColor: theme.cta }]}>
        <Icon size={22} color={theme.onCta} fill={item.type === 'video' ? theme.onCta : 'transparent'} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <ThemedText style={styles.mediaTitle} numberOfLines={1}>
          {item.title}
        </ThemedText>
        {meta ? (
          <ThemedText style={styles.mediaMeta} themeColor="textSecondary">
            {meta}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function LibraryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentWeek, startDate, hasStarted } = useStudy();
  const { goals, config } = useParticipantRecords();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [cardWeeks, setCardWeeks] = useState<Record<number, Flashcard[]>>({});
  const [open, setOpen] = useState<MediaItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      getMediaItems().then(setMedia).catch(() => undefined);
      getFlashcardWeeks()
        .then((ws) => setCardWeeks(Object.fromEntries(ws.map((w) => [w.week + 1, w.cards]))))
        .catch(() => undefined);
    }, []),
  );

  const weeks = Math.ceil((config.studyLengthDays || PROGRAM_WEEKS * 7) / 7);
  const reachedWeek = hasStarted ? currentWeek : 0;

  const entriesFor = useMemo(
    () => (week: number): Entry[] => {
      const items: Entry[] = media
        .filter((m) => m.week === week)
        .map((m) => ({ kind: 'media' as const, item: m, order: m.order ?? (m.psychoed ? 0 : 500) }));
      (cardWeeks[week] ?? []).forEach((c, i) => items.push({ kind: 'card', card: c, order: c.order ?? 600 + i }));
      return items.sort((a, b) => a.order - b.order);
    },
    [media, cardWeeks],
  );

  const goalFor = (week: number) => {
    if (!startDate) return undefined;
    const weekOf = toDateKey(dateForStudyDay(startDate, (week - 1) * 7 + 1));
    return goals.find((g) => g.weekOf === weekOf);
  };

  const unlockLabel = (week: number) => {
    if (!startDate) return 'Unlocks as you progress';
    const d = dateForStudyDay(startDate, (week - 1) * 7 + 1);
    return `Unlocks ${d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`;
  };

  const playerWidth = Math.min(Dimensions.get('window').width - 48, 600);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.six }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>Library</ThemedText>
          <ThemedText style={styles.subtitle} themeColor="textSecondary">
            Your plans, videos and cards, week by week
          </ThemedText>
        </View>

        <View>
          {Array.from({ length: weeks }, (_, i) => i + 1).map((week) => {
            const locked = week > reachedWeek;
            const entries = locked ? [] : entriesFor(week);
            const count = entries.length + 1; // + the if-then plan
            return (
              <WeekDrawer
                key={week}
                title={`Week ${week}`}
                subtitle={locked ? unlockLabel(week) : `${count} ${count === 1 ? 'item' : 'items'}`}
                isCurrent={week === reachedWeek}
                defaultOpen={week === reachedWeek}
                locked={locked}
              >
                <IfThenReminder goal={goalFor(week)} isCurrent={week === reachedWeek} />
                {entries.map((e, i) =>
                  e.kind === 'media' ? (
                    <MediaRow key={e.item.id} item={e.item} onPress={() => setOpen(e.item)} />
                  ) : (
                    <FlashcardCard key={`card-${i}`} frontText={e.card.front} backText={e.card.back} type={e.card.type} />
                  ),
                )}
              </WeekDrawer>
            );
          })}
        </View>
      </ScrollView>

      <Modal visible={!!open} transparent animationType="slide" onRequestClose={() => setOpen(null)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(null)} />
        {open && (
          <View style={[styles.sheet, { backgroundColor: theme.card, paddingBottom: insets.bottom + Spacing.four }]}>
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>{open.title}</ThemedText>
              <Pressable onPress={() => setOpen(null)} style={[styles.close, { backgroundColor: theme.background }]} accessibilityLabel="Close">
                <X size={18} color={theme.textSecondary} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: Spacing.three }}>
              {open.type !== 'text' && <MediaPlayer item={open} width={playerWidth} />}
              {open.body ? <ThemedText style={styles.body}>{open.body}</ThemedText> : null}
              {open.description ? (
                <ThemedText themeColor="textSecondary" style={styles.body}>
                  {open.description}
                </ThemedText>
              ) : null}
            </ScrollView>
          </View>
        )}
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.four, maxWidth: 800, width: '100%', alignSelf: 'center' },
  header: { gap: 4 },
  title: { fontFamily: Fonts.serif, fontSize: 34, fontWeight: '700', lineHeight: 40 },
  subtitle: { fontSize: 16, lineHeight: 22 },
  reminder: { borderRadius: 18, borderWidth: 1, padding: Spacing.three, gap: 6 },
  reminderHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reminderLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  reminderGoal: { fontFamily: Fonts.serif, fontSize: 18, fontWeight: '600', lineHeight: 24 },
  reminderPlan: { fontSize: 15, lineHeight: 22 },
  kw: { fontWeight: '700', fontSize: 15 },
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, borderWidth: 1, padding: 14 },
  playTile: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  mediaTitle: { fontSize: 16, fontWeight: '600', lineHeight: 21 },
  mediaMeta: { fontSize: 14 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.four, gap: Spacing.three },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  sheetTitle: { fontFamily: Fonts.serif, fontSize: 24, fontWeight: '700', lineHeight: 30, flex: 1 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { fontSize: 16, lineHeight: 25 },
});
