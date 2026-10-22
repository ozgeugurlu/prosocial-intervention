/**
 * Preview builds only (EXPO_PUBLIC_DEMO=1): a floating "Screens" menu that jumps
 * straight to any screen, switching to the right sample participant first.
 */
import { useRouter, type Href } from 'expo-router';
import { LayoutGrid, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useStudy } from '@/contexts/study-context';
import { useTheme } from '@/hooks/use-theme';
import type { DemoPersona } from '@/utils/demo';

interface Entry {
  label: string;
  note?: string;
  persona: DemoPersona | null;
  path?: Href;
}

const GROUPS: { title: string; entries: Entry[] }[] = [
  {
    title: 'Getting started',
    entries: [
      { label: 'Sign in / create account', persona: null },
      { label: "Percy's welcome chat", note: 'Right after creating an account', persona: 'new' },
      { label: 'App tour + reminder times', persona: 'tour' },
      { label: 'Waiting for Sunday', note: 'Countdown before Day 1', persona: 'prestart', path: '/home' },
    ],
  },
  {
    title: 'Main tabs (participant on Day 11)',
    entries: [
      { label: 'Home', persona: 'returning', path: '/home' },
      { label: 'Chat with Percy', persona: 'returning', path: '/chat' },
      { label: 'Library', persona: 'returning', path: '/explore' },
      { label: 'Calendar & streak', persona: 'returning', path: '/calendar' },
      { label: 'Me', persona: 'returning', path: '/profile' },
    ],
  },
  {
    title: 'Other screens',
    entries: [
      { label: 'Weekly goal & if-then plan', persona: 'returning', path: '/home/goal' },
      { label: 'Evening reflection', persona: 'returning', path: '/home/survey' },
      { label: 'Weekly survey', persona: 'returning', path: '/home/weekly-survey' },
      { label: 'My participation', persona: 'returning', path: '/profile/feedback' },
      { label: 'Reminder settings', persona: 'returning', path: '/profile/reminders' },
      { label: 'FAQ', persona: 'returning', path: '/profile/faq' },
      { label: 'Contact the research team', persona: 'returning', path: '/profile/contact' },
    ],
  },
];

export function DemoPanel() {
  const theme = useTheme();
  const router = useRouter();
  const { user, demoSwitch } = useAuth();
  const { isLoading, isOnboarded, isTutorialCompleted } = useStudy();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<Href | null>(null);

  // Navigate once the newly selected participant has loaded and the tabs exist.
  useEffect(() => {
    if (!pending || !user || isLoading || !isOnboarded || !isTutorialCompleted) return;
    const target = pending;
    const t = setTimeout(() => {
      setPending(null);
      router.navigate('/home');
      if (target !== '/home') setTimeout(() => router.push(target), 60);
    }, 120);
    return () => clearTimeout(t);
  }, [pending, user, isLoading, isOnboarded, isTutorialCompleted, router]);

  const go = (e: Entry) => {
    setOpen(false);
    demoSwitch(e.persona);
    setPending(e.path ?? null);
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.fab, { backgroundColor: theme.cta }]}
        accessibilityRole="button"
        accessibilityLabel="Jump to a screen"
      >
        <LayoutGrid size={16} color={theme.onCta} />
        <ThemedText style={[styles.fabText, { color: theme.onCta }]}>Screens</ThemedText>
      </Pressable>

      {open && (
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel="Close" />
          <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sheetHeader}>
              <ThemedText style={styles.sheetTitle}>Jump to a screen</ThemedText>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityLabel="Close">
                <X size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={{ gap: Spacing.three, paddingBottom: Spacing.three }}>
              {GROUPS.map((g) => (
                <View key={g.title} style={{ gap: 6 }}>
                  <ThemedText style={styles.groupTitle} themeColor="textSecondary">
                    {g.title}
                  </ThemedText>
                  {g.entries.map((e) => (
                    <Pressable
                      key={e.label}
                      onPress={() => go(e)}
                      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? theme.backgroundSelected : theme.background }]}
                    >
                      <ThemedText style={styles.rowLabel}>{e.label}</ThemedText>
                      {e.note ? (
                        <ThemedText style={styles.rowNote} themeColor="textSecondary">
                          {e.note}
                        </ThemedText>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ))}
              <ThemedText style={styles.foot} themeColor="textSecondary">
                Preview only. Sample data, nothing is saved.
              </ThemedText>
            </ScrollView>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  fabText: { fontSize: 13, fontWeight: '700' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1001, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,10,20,0.45)' },
  sheet: { maxHeight: '82%', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: Spacing.four, gap: Spacing.three },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetTitle: { fontFamily: Fonts.serif, fontSize: 22, fontWeight: '700' },
  groupTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowNote: { fontSize: 12 },
  foot: { fontSize: 12, textAlign: 'center' },
});
