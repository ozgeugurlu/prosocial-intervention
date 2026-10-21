import { HeartHandshake } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { CollapsibleCard } from '@/components/collapsible-card';
import { LineChart } from '@/components/line-chart';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { WeeklySurveyRecord } from '@/utils/participant-data';
import { formatWeekOf } from '@/utils/participation';

/** Weekly prosociality scores, from the weekly survey. */
export function ProsocialityCard({
  records,
  scaleMin = 1,
  scaleMax = 5,
}: {
  records: WeeklySurveyRecord[];
  scaleMin?: number;
  scaleMax?: number;
}) {
  const theme = useTheme();
  const latest = records.at(-1);
  const prev = records.at(-2);
  const change = latest && prev ? Math.round((latest.score - prev.score) * 100) / 100 : null;

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
            {latest ? `Week of ${formatWeekOf(latest.weekOf)}` : 'Latest score'}
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
      {records.length >= 2 ? (
        <LineChart
          data={records.slice(-9).map((r) => ({ label: `W${r.week}`, value: r.score }))}
          minValue={scaleMin}
          maxValue={scaleMax}
          color={theme.primary}
        />
      ) : (
        <ThemedText style={styles.empty} themeColor="textSecondary">
          {records.length === 0
            ? 'Your score appears here after your first weekly survey, which opens on Sunday.'
            : 'Your trend line appears after your second weekly survey.'}
        </ThemedText>
      )}
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: Spacing.three, marginBottom: Spacing.two },
  label: { fontSize: 13 },
  value: { fontFamily: Fonts.serif, fontSize: 34, fontWeight: '700', lineHeight: 40 },
  change: { fontSize: 13, fontWeight: '600' },
  hint: { fontSize: 12 },
  empty: { fontSize: 14, lineHeight: 20, paddingVertical: Spacing.two },
});
