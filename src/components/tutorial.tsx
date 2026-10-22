/**
 * App walkthrough shown once after account creation (and replayable from the Me tab).
 * The last step lets the participant choose their reminder times.
 */
import {
  BookOpen,
  Flame,
  HelpCircle,
  Home,
  MessageCircle,
  Bell,
  Target,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TimeStepper } from '@/components/time-stepper';
import { Fonts, Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_REMINDERS, scheduleReminders } from '@/utils/notifications';

interface Step {
  icon: LucideIcon;
  tab?: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: Home,
    tab: 'Home tab',
    title: 'Your day at a glance',
    body: "Home shows today's tasks: a morning chat with Percy (often with a short video) and an evening chat plus a 2-minute reflection. Your morning chat is open all day. Your evening chat and reflection open at 5 pm.",
  },
  {
    icon: MessageCircle,
    tab: 'Chat tab',
    title: 'Check in with Percy',
    body: 'Percy is your coach. Switch between the Morning and Evening sessions at the top. Answer by tapping a reply or typing a short message. Percy is fully scripted by the research team, not an AI.',
  },
  {
    icon: Target,
    tab: 'Home tab',
    title: 'Your weekly goal and if-then plan',
    body: 'Every Sunday you will set one goal for the week and an if-then plan: "If [situation], then I will [action]." They stay pinned to your Reminder board all week.',
  },
  {
    icon: Flame,
    tab: 'Calendar tab',
    title: 'Keep your streak going',
    body: 'The calendar records each day you check in. A day turns green when you finish all four activities. Turn 4 days green in a week to earn that week\'s badge, and keep checking in to build your streak.',
  },
  {
    icon: BookOpen,
    tab: 'Library tab',
    title: 'Revisit what you have learned',
    body: 'Every video, audio clip and message Percy sends you is saved in your Library, so you can come back to it any time.',
  },
  {
    icon: HelpCircle,
    tab: 'Me tab',
    title: 'Help is always close',
    body: 'In the Me tab you will find the FAQ, your participation summary, reminder settings, and a direct line to the research team.',
  },
];

export function Tutorial({ onDone, askForReminders = true }: { onDone: () => void; askForReminders?: boolean }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { reminders, setReminders } = useStudy();
  const [index, setIndex] = useState(0);
  const [times, setTimes] = useState(reminders ?? DEFAULT_REMINDERS);
  const [saving, setSaving] = useState(false);

  const total = STEPS.length + (askForReminders ? 1 : 0);
  const onReminderStep = askForReminders && index === STEPS.length;
  const isLast = index === total - 1;

  const isDark = theme.isDark;
  const accent = theme.cta;
  const onAccent = theme.onCta;

  const finish = async () => {
    if (askForReminders) {
      setSaving(true);
      await setReminders(times).catch(() => undefined);
      await scheduleReminders(times).catch(() => false);
      setSaving(false);
    }
    onDone();
  };

  const step = STEPS[index];
  const Icon = onReminderStep ? Bell : step.icon;

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + Spacing.four }]}>
      <View style={styles.topRow}>
        <ThemedText themeColor="textSecondary" style={styles.counter}>
          {index + 1} of {total}
        </ThemedText>
        {!isLast && (
          <Pressable onPress={() => setIndex(total - 1)} hitSlop={10}>
            <ThemedText themeColor="textSecondary" style={styles.skip}>
              Skip
            </ThemedText>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: `${theme.primary}25` }]}>
          <Icon size={44} color={theme.primary} strokeWidth={1.6} />
        </View>
        {!onReminderStep && step.tab ? (
          <View style={[styles.tabChip, { borderColor: theme.primary }]}>
            <ThemedText style={styles.tabChipText}>{step.tab}</ThemedText>
          </View>
        ) : null}
        <ThemedText style={styles.title}>{onReminderStep ? 'When should Percy remind you?' : step.title}</ThemedText>
        <ThemedText style={styles.text} themeColor="textSecondary">
          {onReminderStep
            ? 'Pick a morning and an evening time that fit your routine. You can change these any time in Me → Reminder settings.'
            : step.body}
        </ThemedText>

        {onReminderStep && (
          <View style={styles.reminders}>
            <TimeStepper label="Morning" value={times.morning} minHour={5} maxHour={12} onChange={(v) => setTimes({ ...times, morning: v })} />
            <TimeStepper label="Evening" value={times.evening} minHour={16} maxHour={23} onChange={(v) => setTimes({ ...times, evening: v })} />
            {Platform.OS !== 'web' && (
              <ThemedText themeColor="textSecondary" style={styles.small}>
                Your phone will ask permission to send notifications. Reminders are set on your phone only.
              </ThemedText>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.dots}>
        {Array.from({ length: total }).map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i === index ? accent : theme.border, width: i === index ? 20 : 8 }]} />
        ))}
      </View>

      <View style={styles.buttons}>
        {index > 0 ? (
          <Pressable style={[styles.secondary, { borderColor: theme.border }]} onPress={() => setIndex(index - 1)}>
            <ThemedText style={styles.btnText}>Back</ThemedText>
          </Pressable>
        ) : (
          <View style={{ flex: 1 }} />
        )}
        <Pressable
          style={[styles.primary, { backgroundColor: accent }, saving && { opacity: 0.6 }]}
          disabled={saving}
          onPress={() => (isLast ? finish() : setIndex(index + 1))}
        >
          <ThemedText style={[styles.btnText, { color: onAccent }]}>{isLast ? (askForReminders ? "Let's begin" : 'Done') : 'Next'}</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: Spacing.four },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  counter: { fontSize: 13 },
  skip: { fontSize: 15, fontWeight: '600' },
  body: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingVertical: Spacing.four },
  iconWrap: { width: 104, height: 104, borderRadius: 52, alignItems: 'center', justifyContent: 'center' },
  tabChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  tabChipText: { fontSize: 12, fontWeight: '600' },
  title: { fontFamily: Fonts.serif, fontSize: 30, lineHeight: 36, fontWeight: '700', textAlign: 'center', maxWidth: 360 },
  text: { fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 380 },
  reminders: { width: '100%', maxWidth: 400, gap: 12, marginTop: Spacing.two },
  small: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: Spacing.three },
  dot: { height: 8, borderRadius: 4 },
  buttons: { flexDirection: 'row', gap: 12 },
  primary: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  secondary: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1 },
  btnText: { fontSize: 16, fontWeight: '700' },
});
