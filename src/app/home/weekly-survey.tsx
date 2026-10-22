/**
 * Weekly prosociality survey. Items come from Firestore (/surveys/weekly) so the
 * research team controls the instrument; responses and the computed score are
 * saved to participants/{uid}/weeklySurveys/{weekOf}.
 */
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useTheme } from '@/hooks/use-theme';
import { DEMO } from '@/utils/demo';
import { getWeeklyInstrument } from '@/utils/firestore';
import { getWeeklySurveys, saveWeeklySurvey } from '@/utils/participant-data';
import { scoreWeeklySurvey, weekOfFor } from '@/utils/participation';
import type { WeeklySurveyInstrument } from '@/utils/schema';

export default function WeeklySurveyScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { uid, currentWeek } = useStudy();
  const weekOf = weekOfFor();

  const [instrument, setInstrument] = useState<WeeklySurveyInstrument | null>(null);
  const [already, setAlready] = useState(false);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWeeklyInstrument().then(setInstrument);
    // The preview always shows the form so it can be reviewed.
    if (uid && !DEMO) getWeeklySurveys(uid).then((r) => setAlready(r.some((x) => x.weekOf === weekOf)));
  }, [uid, weekOf]);

  const isDark = theme.isDark;
  const accent = theme.cta;
  const onAccent = theme.onCta;

  const complete = !!instrument && instrument.items.every((it) => responses[it.id] != null);

  const submit = async () => {
    if (!instrument || !uid || !complete) return;
    setSaving(true);
    setError(null);
    const s = scoreWeeklySurvey(instrument.items, responses, instrument.scaleMin, instrument.scaleMax);
    try {
      // The survey that opens on a Sunday covers the week that just ended.
      await saveWeeklySurvey(uid, { weekOf, week: Math.max(1, currentWeek - 1), responses, score: s, instrumentVersion: instrument.version });
      setScore(s);
    } catch {
      setError('We could not save your survey. Please check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), backgroundColor: theme.card, borderBottomColor: theme.border }]}>
      <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
        <ArrowLeft size={24} color={theme.text} />
      </Pressable>
      <ThemedText style={styles.headerTitle}>Weekly survey</ThemedText>
      <View style={{ width: 24 }} />
    </View>
  );

  if (score != null || already) {
    return (
      <ThemedView style={styles.container}>
        {header}
        <View style={styles.done}>
          <CheckCircle2 size={72} color="#4CAF50" strokeWidth={1.5} />
          <ThemedText style={styles.doneTitle}>{already && score == null ? 'Already completed' : 'Thank you!'}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.doneText}>
            {score != null
              ? `Your prosociality score this week is ${score.toFixed(2)}. You can see your trend on the Home screen.`
              : "You've completed this week's survey. The next one opens on Sunday."}
          </ThemedText>
          <Pressable style={[styles.submit, { backgroundColor: accent }]} onPress={() => router.back()}>
            <ThemedText style={[styles.submitText, { color: onAccent }]}>Back to Home</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  if (!instrument) {
    return (
      <ThemedView style={styles.container}>
        {header}
        <ActivityIndicator style={{ marginTop: Spacing.six }} />
      </ThemedView>
    );
  }

  const points = Array.from({ length: instrument.scaleMax - instrument.scaleMin + 1 }, (_, i) => instrument.scaleMin + i);

  return (
    <ThemedView style={styles.container}>
      {header}
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.six }]}>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={styles.instructions}>{instrument.instructions}</ThemedText>
          <View style={styles.legend}>
            <ThemedText style={styles.legendText} themeColor="textSecondary">
              {instrument.scaleMin} = {instrument.minLabel}
            </ThemedText>
            <ThemedText style={styles.legendText} themeColor="textSecondary">
              {instrument.scaleMax} = {instrument.maxLabel}
            </ThemedText>
          </View>
        </View>

        {instrument.items.map((item, idx) => (
          <View key={item.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText style={styles.itemText}>
              {idx + 1}. {item.text}
            </ThemedText>
            <View style={styles.scale} accessibilityRole="radiogroup">
              {points.map((p) => {
                const selected = responses[item.id] === p;
                return (
                  <Pressable
                    key={p}
                    onPress={() => setResponses((r) => ({ ...r, [item.id]: p }))}
                    style={[styles.point, { borderColor: theme.border }, selected && { backgroundColor: accent, borderColor: 'transparent' }]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${p}`}
                  >
                    <ThemedText style={[styles.pointText, selected && { color: onAccent, fontWeight: '700' }]}>{p}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        {error && <ThemedText style={{ color: theme.destructive, textAlign: 'center' }}>{error}</ThemedText>}

        <Pressable
          style={[styles.submit, { backgroundColor: accent }, (!complete || saving) && { opacity: 0.5 }]}
          onPress={submit}
          disabled={!complete || saving}
        >
          <ThemedText style={[styles.submitText, { color: onAccent }]}>{saving ? 'Saving…' : 'Submit survey'}</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontFamily: Fonts.serif, fontSize: 22, fontWeight: '700' },
  content: { padding: Spacing.four, gap: Spacing.three, maxWidth: 680, width: '100%', alignSelf: 'center' },
  card: { borderRadius: 18, borderWidth: 1, padding: Spacing.three, gap: Spacing.three },
  instructions: { fontSize: 15, lineHeight: 22 },
  legend: { flexDirection: 'row', justifyContent: 'space-between' },
  legendText: { fontSize: 13, fontWeight: '600' },
  itemText: { fontSize: 16, lineHeight: 23, fontWeight: '600' },
  scale: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  point: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pointText: { fontSize: 16 },
  submit: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.two, alignSelf: 'stretch' },
  submitText: { fontSize: 16, fontWeight: '700' },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, gap: Spacing.three },
  doneTitle: { fontFamily: Fonts.serif, fontSize: 30, fontWeight: '700' },
  doneText: { fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 380 },
});
