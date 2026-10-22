/**
 * Library: every video, audio clip and informational message the participant
 * has unlocked (sent by Percy in a chat, or released on a scheduled study day),
 * plus the weekly flashcards for weeks they have reached.
 */
import { useFocusEffect } from 'expo-router';
import { BookOpen, FileText, Headphones, Lock, PlayCircle, X } from 'lucide-react-native';
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
import { useTheme } from '@/hooks/use-theme';
import { getFlashcardWeeks, getMediaItems } from '@/utils/firestore';
import { getUnlockedMediaIds } from '@/utils/participant-data';
import type { FlashcardWeek, MediaItem } from '@/utils/schema';

type Filter = 'all' | 'video' | 'audio' | 'text' | 'cards';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'video', label: 'Videos' },
  { key: 'audio', label: 'Audio' },
  { key: 'text', label: 'Messages' },
  { key: 'cards', label: 'Flashcards' },
];

const ICONS = { video: PlayCircle, audio: Headphones, text: FileText } as const;

export default function LibraryScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { uid, currentDay, currentWeek } = useStudy();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [weeks, setWeeks] = useState<(FlashcardWeek & { id: string })[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<MediaItem | null>(null);

  useFocusEffect(
    useCallback(() => {
      getMediaItems().then(setMedia).catch(() => undefined);
      getFlashcardWeeks().then(setWeeks).catch(() => undefined);
      if (uid) getUnlockedMediaIds(uid).then(setUnlocked).catch(() => undefined);
    }, [uid]),
  );

  const available = useMemo(
    () =>
      media
        .filter((m) => unlocked.has(m.id) || (m.availableFromDay != null && m.availableFromDay <= currentDay))
        .sort((a, b) => (b.week ?? 0) - (a.week ?? 0) || a.title.localeCompare(b.title)),
    [media, unlocked, currentDay],
  );
  const lockedCount = media.length - available.length;
  const shown = filter === 'all' ? available : available.filter((m) => m.type === filter);
  const cardWeeks = weeks.filter((w) => w.week + 1 <= currentWeek);

  const isDark = theme.isDark;
  const accent = theme.cta;
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
            Everything Percy has shared with you
          </ThemedText>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                style={[styles.filter, { borderColor: active ? 'transparent' : theme.border, backgroundColor: active ? accent : theme.card }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <ThemedText style={[styles.filterText, active && { color: theme.onCta, fontWeight: '700' }]}>{f.label}</ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {filter !== 'cards' && (
          <View style={styles.list}>
            {shown.length === 0 && (
              <View style={[styles.empty, { backgroundColor: theme.card }]}>
                <BookOpen size={28} color={theme.textSecondary} />
                <ThemedText themeColor="textSecondary" style={styles.emptyText}>
                  Nothing here yet. Videos, audio and messages appear here after Percy sends them to you.
                </ThemedText>
              </View>
            )}
            {shown.map((m) => {
              const Icon = ICONS[m.type] ?? FileText;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setOpen(m)}
                  style={({ pressed }) => [styles.item, { backgroundColor: theme.card, borderColor: theme.border }, pressed && { opacity: 0.75 }]}
                >
                  <View style={[styles.itemIcon, { backgroundColor: `${theme.primary}22` }]}>
                    <Icon size={22} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText style={styles.itemTitle} numberOfLines={2}>
                      {m.title}
                    </ThemedText>
                    <ThemedText themeColor="textSecondary" style={styles.itemMeta}>
                      {[m.week ? `Week ${m.week}` : null, m.type === 'text' ? 'Message' : m.type === 'audio' ? 'Audio' : 'Video', m.durationLabel]
                        .filter(Boolean)
                        .join(' · ')}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
            {lockedCount > 0 && (
              <View style={styles.lockedRow}>
                <Lock size={14} color={theme.textSecondary} />
                <ThemedText themeColor="textSecondary" style={styles.lockedText}>
                  {lockedCount} more {lockedCount === 1 ? 'item unlocks' : 'items unlock'} as the program goes on
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {(filter === 'cards' || filter === 'all') && cardWeeks.length > 0 && (
          <View style={{ gap: Spacing.two }}>
            {filter === 'all' && <ThemedText style={styles.sectionTitle}>Flashcards</ThemedText>}
            {cardWeeks.map((week) => (
              <WeekDrawer
                key={week.id}
                title={`Week ${week.week + 1}${week.name ? `: ${week.name}` : ''}`}
                subtitle={`${week.cards.length} ${week.cards.length === 1 ? 'card' : 'cards'}`}
                isCurrent={currentWeek === week.week + 1}
                defaultOpen={filter === 'cards' && currentWeek === week.week + 1}
              >
                {week.cards.map((card, i) => (
                  <FlashcardCard key={i} frontText={card.front} backText={card.back} type={card.type} />
                ))}
              </WeekDrawer>
            ))}
          </View>
        )}
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
  filters: { gap: 8 },
  filter: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  filterText: { fontSize: 14 },
  list: { gap: Spacing.two },
  empty: { borderRadius: 18, padding: Spacing.four, alignItems: 'center', gap: Spacing.two },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: Spacing.three },
  itemIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 16, fontWeight: '600', lineHeight: 21 },
  itemMeta: { fontSize: 13 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.two },
  lockedText: { fontSize: 13 },
  sectionTitle: { fontFamily: Fonts.serif, fontSize: 22, fontWeight: '700' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.four, gap: Spacing.three },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  sheetTitle: { fontFamily: Fonts.serif, fontSize: 24, fontWeight: '700', lineHeight: 30, flex: 1 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { fontSize: 16, lineHeight: 25 },
});
