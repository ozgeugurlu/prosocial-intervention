import { HeartHandshake } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { CollapsibleCard } from '@/components/collapsible-card';
import { LineChart } from '@/components/line-chart';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DEMO } from '@/utils/demo';
import type { WeeklySurveyRecord } from '@/utils/participant-data';
import { formatWeekOf } from '@/utils/participation';

/** Weekly prosociality scores, from the weekly survey. */
const PROGRAM_WEEKS = 9;
/** Preview only: an illustrative nine-week trend for showing the design to collaborators. */
const EXAMPLE_TREND = [3.1, 3.4, 3.3, 3.6, 3.8, 3.7, 4.0, 4.1, 4.3];

export function ProsocialityCard({
  records,
  scaleMin = 1,
  scaleMax = 5,
  weeks = PROGRAM_WEEKS,
}: {
  records: WeeklySurveyRecord[];
  scaleMin?: number;
  scaleMax?: number;
  weeks?: number;
}) {
  const theme = useTheme();
  // Preview builds show an illustrative nine-week trend until there is real data to plot.
  const showExample = DEMO && records.length < 3;
  const shown: { week: number; score: number; label: string }[] = showExample
    ? EXAMPLE_TREND.map((score, i) => ({ week: i + 1, score, label: `Week ${i + 1}` }))
    : records.map((r) => ({ week: r.week, score: r.score, label: `Week of ${formatWeekOf(r.weekOf)}` }));
  const latest = shown.at(-1);
  const prev = shown.at(-2);
  const change = latest && prev ? Math.round((latest.score - prev.score) * 100) / 100 : null;

  // One point per program week (W1–W9); weeks without a survey yet stay empty.
  const byWeek = new Map(records.map((r) => [r.week, r.score]));
  const series = Array.from({ length: weeks }, (_, i) => ({
    label: `W${i + 1}`,
    value: showExample ? EXAMPLE_TREND[i] ?? null : byWeek.get(i + 1) ?? null,
  }));

  return (
    <CollapsibleCard
      title="Prosociality score"
      leading={
        <View style={[styles.icon, { backgroundColor: `${theme.primary}20` }]}>
          <HeartHandshake size={20} color={theme.primary} strokeWidth={2.2} />
        </View>
      }
    >
      <View style={styles.summary}>
        <View>
          <ThemedText style={styles.label} themeColor="textSecondary">
            {latest ? latest.label : 'Latest score'}
          </ThemedText>
          <ThemedText style={[styles.value, { color: theme.primary }]}>{latest ? latest.score.toFixed(2) : '—'}</ThemedText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {change != null && (
            <ThemedText style={styles.change}>
              {change > 0 ? '▲' : change < 0 ? '▼' : '•'} {Math.abs(change).toFixed(2)} from last week
            </ThemedText>
          )}
          <ThemedText style={styles.hint} themeColor="textSecondary">
            Scale: {scaleMin}–{scaleMax}
          </ThemedText>
        </View>
      </View>
      {shown.length > 0 ? (
        <>
          <LineChart data={series} minValue={scaleMin} maxValue={scaleMax} color={theme.primary} />
          <ThemedText style={styles.axis} themeColor="textSecondary">
            {showExample ? 'Program week · example data for preview' : 'Program week'}
          </ThemedText>
        </>
      ) : (
        <ThemedText style={styles.empty} themeColor="textSecondary">
          Your first score appears after the weekly survey that opens on Sunday.
        </ThemedText>
      )}
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: Spacing.three, marginBottom: Spacing.two },
  label: { fontSize: 13 },
  value: { fontFamily: Fonts.sans, fontSize: 34, fontWeight: '700', lineHeight: 40 },
  change: { fontSize: 13, fontWeight: '600' },
  hint: { fontSize: 12 },
  empty: { fontSize: 14, lineHeight: 20, paddingVertical: Spacing.two, textAlign: 'center' },
  axis: { fontSize: 12, textAlign: 'center', marginTop: -2 },
});
