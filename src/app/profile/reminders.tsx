import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TimeStepper } from '@/components/time-stepper';
import { Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useTheme } from '@/hooks/use-theme';
import { DEFAULT_REMINDERS, scheduleReminders } from '@/utils/notifications';

export default function RemindersScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { reminders, setReminders } = useStudy();
  const [times, setTimes] = useState(reminders ?? DEFAULT_REMINDERS);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isDark = theme.isDark;
  const accent = theme.cta;

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await setReminders(times);
      const ok = await scheduleReminders(times);
      if (ok || Platform.OS === 'web') router.back();
      else setStatus('Notifications are turned off for this app. Turn them on in your phone\'s Settings so reminders can appear.');
    } catch {
      setStatus('Could not save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader title="Reminders" />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.six }]}>
        <ThemedText themeColor="textSecondary" style={styles.intro}>
          Percy will remind you once in the morning and once in the evening, every day of the program.
        </ThemedText>
        <TimeStepper label="Morning" value={times.morning} minHour={5} maxHour={12} onChange={(v) => setTimes({ ...times, morning: v })} />
        <TimeStepper label="Evening" value={times.evening} minHour={16} maxHour={23} onChange={(v) => setTimes({ ...times, evening: v })} />
        {status && <ThemedText style={{ color: theme.destructive }}>{status}</ThemedText>}
        <Pressable style={[styles.save, { backgroundColor: accent }, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
          <ThemedText style={[styles.saveText, { color: theme.onCta }]}>{saving ? 'Saving…' : 'Save reminder times'}</ThemedText>
        </Pressable>
        <ThemedText themeColor="textSecondary" style={styles.note}>
          Reminders are scheduled on your phone. Your chosen times are also saved to your study record so they come back if you
          reinstall the app.
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three, maxWidth: 560, width: '100%', alignSelf: 'center' },
  intro: { fontSize: 15, lineHeight: 22 },
  save: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.two },
  saveText: { fontSize: 16, fontWeight: '700' },
  note: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
