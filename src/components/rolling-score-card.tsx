import { useFocusEffect } from "expo-router";
import { TrendingUp } from "lucide-react-native";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";

import { CollapsibleCard } from "@/components/collapsible-card";
import { LineChart } from "@/components/line-chart";
import { ThemedText } from "@/components/themed-text";
import { Fonts, Spacing } from "@/constants/theme";
import { useStudy } from "@/contexts/study-context";
import { useTheme } from "@/hooks/use-theme";
import { computeRollingAverage, getRollingAverageSeries } from "@/utils/scores";
import { storage } from "@/utils/storage";

/**
 * Home card showing a 5-day rolling average score trend from daily reflections.
 */
export function RollingScoreCard() {
  const theme = useTheme();
  const { currentDay } = useStudy();
  const [series, setSeries] = useState(() =>
    getRollingAverageSeries({}, currentDay).map(({ label, value }) => ({
      label,
      value,
    })),
  );
  const [currentAverage, setCurrentAverage] = useState<number | null>(null);

  const loadScores = useCallback(async () => {
    const scores = await storage.getDailyScores();
    const rollingSeries = getRollingAverageSeries(scores, currentDay);
    setSeries(rollingSeries.map(({ label, value }) => ({ label, value })));
    setCurrentAverage(computeRollingAverage(scores, currentDay));
  }, [currentDay]);

  useFocusEffect(
    useCallback(() => {
      loadScores();
    }, [loadScores]),
  );

  const hasData = series.some((point) => point.value != null);

  return (
    <CollapsibleCard
      title="Daily well-being"
      leading={
        <View
          style={[styles.iconCircle, { backgroundColor: `${theme.primary}20` }]}
        >
          <TrendingUp size={20} color={theme.primary} strokeWidth={2.2} />
        </View>
      }
    >
      <View style={styles.summaryRow}>
        <View style={styles.summaryTextGroup}>
          <ThemedText style={styles.summaryLabel} themeColor="textSecondary">
            5-Day Rolling Average
          </ThemedText>
          <ThemedText style={[styles.summaryValue, { color: theme.primary }]}>
            {currentAverage != null ? currentAverage.toFixed(2) : "—"}
          </ThemedText>
        </View>
        <ThemedText style={styles.scaleHint} themeColor="textSecondary">
          Scale: 1–5
        </ThemedText>
      </View>

      {hasData ? (
        <LineChart data={series} color={theme.primary} />
      ) : (
        <View style={styles.emptyState}>
          <ThemedText style={styles.emptyText} themeColor="textSecondary">
            Complete your evening reflection to see how your days are going.
          </ThemedText>
        </View>
      )}
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryRow: {
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: Spacing.two,
  },
  summaryTextGroup: {
    gap: 4,
  },
  summaryLabel: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  summaryValue: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 38,
  },
  scaleHint: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: "500",
  },
  emptyState: {
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.two,
  },
  emptyText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
