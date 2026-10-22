import { useRouter } from 'expo-router';
import { ArrowLeft, Bird } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Spacing } from '@/constants/theme';
import { IF_THEN_INSTRUCTION, WEEKLY_INTROS } from '@/constants/weekly-intros';
import { useStudy } from '@/contexts/study-context';
import { useTheme } from '@/hooks/use-theme';
import { getGoals, saveGoal } from '@/utils/participant-data';
import { formatWeekOf, weekOfFor } from '@/utils/participation';

const MAX = 200;

export default function GoalScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { uid, currentWeek, userName } = useStudy();
  const weekIntro = WEEKLY_INTROS[currentWeek];
  const weekOf = weekOfFor();

  const [goal, setGoal] = useState('');
  const [ifPart, setIf] = useState('');
  const [thenPart, setThen] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    getGoals(uid)
      .then((goals) => {
        const current = goals.find((g) => g.weekOf === weekOf);
        if (current) {
          setGoal(current.goal);
          setIf(current.ifThen.if);
          setThen(current.ifThen.then);
        }
      })
      .finally(() => setLoading(false));
  }, [uid, weekOf]);

  const valid = goal.trim() && ifPart.trim() && thenPart.trim();
  const isDark = theme.isDark;
  const accent = theme.cta;

  const save = async () => {
    if (!uid || !valid) return;
    setSaving(true);
    setError(null);
    try {
      await saveGoal(uid, {
        weekOf,
        goal: goal.trim(),
        // Strip a leading "if"/"then" if the participant typed it themselves.
        ifThen: { if: ifPart.trim().replace(/^if\s+/i, ''), then: thenPart.trim().replace(/^then\s+/i, '').replace(/\.$/, '') },
      });
      router.back();
    } catch {
      setError('Could not save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const input = [styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }];

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), backgroundColor: theme.card }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back">
          <ArrowLeft size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Weekly goal</ThemedText>
        <View style={{ width: 24 }} />
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: Spacing.six }} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.six }]} keyboardShouldPersistTaps="handled">
            {weekIntro ? (
              <View style={[styles.percyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.percyHead}>
                  <View style={[styles.percyAvatar, { backgroundColor: theme.cta }]}>
                    <Bird size={18} color={theme.onCta} />
                  </View>
                  <ThemedText style={styles.percyLabel} themeColor="textSecondary">
                    Week {currentWeek} · {weekIntro.theme}
                  </ThemedText>
                </View>
                <ThemedText style={styles.percyText}>
                  {userName ? weekIntro.intro.replace(/\{name\}/g, userName) : weekIntro.intro.replace(/ \{name\}/g, '')}
                </ThemedText>
                <ThemedText style={styles.percyCta}>{IF_THEN_INSTRUCTION}</ThemedText>
              </View>
            ) : (
              <ThemedText themeColor="textSecondary" style={styles.intro}>
                For the week of {formatWeekOf(weekOf)}. Choose one goal, then make a plan for exactly when and how you will act on it.
              </ThemedText>
            )}

            <ThemedText style={styles.label}>My goal this week</ThemedText>
            <TextInput
              value={goal}
              onChangeText={setGoal}
              maxLength={MAX}
              multiline
              placeholder="e.g. Reach out to a friend I haven't talked to in a while"
              placeholderTextColor={theme.textSecondary}
              style={[input, { minHeight: 80 }]}
            />

            <ThemedText style={styles.label}>My if-then plan</ThemedText>
            <View style={styles.ifRow}>
              <ThemedText style={styles.kw}>If</ThemedText>
              <TextInput
                value={ifPart}
                onChangeText={setIf}
                maxLength={MAX}
                multiline
                placeholder="I finish lunch on Wednesday"
                placeholderTextColor={theme.textSecondary}
                style={[input, styles.flex]}
              />
            </View>
            <View style={styles.ifRow}>
              <ThemedText style={styles.kw}>then</ThemedText>
              <TextInput
                value={thenPart}
                onChangeText={setThen}
                maxLength={MAX}
                multiline
                placeholder="I will text Sam to ask how they're doing"
                placeholderTextColor={theme.textSecondary}
                style={[input, styles.flex]}
              />
            </View>

            {error && <ThemedText style={{ color: theme.destructive }}>{error}</ThemedText>}

            <Pressable
              style={[styles.save, { backgroundColor: accent }, (!valid || saving) && { opacity: 0.5 }]}
              onPress={save}
              disabled={!valid || saving}
            >
              <ThemedText style={[styles.saveText, { color: theme.onCta }]}>
                {saving ? 'Saving…' : 'Save to my board'}
              </ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingBottom: 12 },
  headerTitle: { fontFamily: Fonts.serif, fontSize: 22, fontWeight: '700' },
  content: { padding: Spacing.four, gap: Spacing.two, maxWidth: 640, width: '100%', alignSelf: 'center' },
  intro: { fontSize: 15, lineHeight: 22, marginBottom: Spacing.two },
  percyCard: { borderWidth: 1, borderRadius: 18, padding: Spacing.three, gap: 10, marginBottom: Spacing.two },
  percyHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  percyAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  percyLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  percyText: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 25 },
  percyCta: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 15, fontWeight: '700', marginTop: Spacing.three },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: Fonts.sans, textAlignVertical: 'top' },
  ifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  kw: { fontFamily: Fonts.serif, fontSize: 20, fontWeight: '700', width: 44, paddingTop: 10 },
  flex: { flex: 1, minHeight: 56 },
  save: { borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: Spacing.four },
  saveText: { fontSize: 16, fontWeight: '700' },
});
