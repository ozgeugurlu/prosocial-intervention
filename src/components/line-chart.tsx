import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface LineChartPoint {
  label: string;
  value: number | null;
}

interface LineChartProps {
  data: LineChartPoint[];
  /** Minimum y-axis value. Defaults to 1. */
  minValue?: number;
  /** Maximum y-axis value. Defaults to 5. */
  maxValue?: number;
  /** Chart height in points. Defaults to 160. */
  height?: number;
  /** Line and point color. Defaults to theme primary. */
  color?: string;
}

const CHART_PADDING = { top: 8, right: 8, bottom: 28, left: 28 };

/**
 * Simple themed line chart for small numeric series (e.g. 1–5 scores).
 */
export function LineChart({
  data,
  minValue = 1,
  maxValue = 5,
  height = 160,
  color,
}: LineChartProps) {
  const theme = useTheme();
  const strokeColor = color ?? theme.primary;
  const plotHeight = height - CHART_PADDING.top - CHART_PADDING.bottom;

  // Fit the chart to its container once measured, so it never overflows the card.
  const [measured, setMeasured] = useState(0);
  const plottedPoints = useMemo(
    () =>
      data
        .map((point, index) => ({ ...point, index }))
        .filter((point): point is LineChartPoint & { value: number; index: number } => point.value != null),
    [data]
  );

  if (plottedPoints.length === 0) {
    return (
      <View style={[styles.emptyState, { height }]}>
        <ThemedText style={styles.emptyText} themeColor="textSecondary">
          No data yet
        </ThemedText>
      </View>
    );
  }

  const chartWidth = measured > 0 ? measured : Math.max(240, data.length * 56);
  const plotWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;

  const toX = (index: number) =>
    CHART_PADDING.left +
    (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);

  const toY = (value: number) => {
    const range = maxValue - minValue || 1;
    const normalized = (value - minValue) / range;
    return CHART_PADDING.top + plotHeight - normalized * plotHeight;
  };

  const gridValues = Array.from({ length: maxValue - minValue + 1 }, (_, index) => minValue + index);

  const linePath = plottedPoints
    .map((point, index) => {
      const x = toX(point.index);
      const y = toY(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  return (
    <View style={styles.container} onLayout={(e) => setMeasured(Math.floor(e.nativeEvent.layout.width))}>
      <Svg width={chartWidth} height={height}>
        {gridValues.map((value) => {
          const y = toY(value);
          return (
            <Line
              key={value}
              x1={CHART_PADDING.left}
              y1={y}
              x2={chartWidth - CHART_PADDING.right}
              y2={y}
              stroke={theme.border}
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          );
        })}

        {gridValues.map((value) => (
          <SvgText
            key={`label-${value}`}
            x={CHART_PADDING.left - 8}
            y={toY(value) + 4}
            fontSize={11}
            fill={theme.textSecondary}
            textAnchor="end"
            fontFamily={Fonts.sans}
          >
            {value}
          </SvgText>
        ))}

        {linePath.length > 0 && (
          <Path d={linePath} stroke={strokeColor} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {data.map((point, index) => {
          if (point.value == null) {
            return null;
          }

          const x = toX(index);
          const y = toY(point.value);

          return (
            <Circle
              key={point.label}
              cx={x}
              cy={y}
              r={5}
              fill={strokeColor}
              stroke={theme.card}
              strokeWidth={2}
            />
          );
        })}

        {data.map((point, index) => (
          <SvgText
            key={`x-${point.label}`}
            x={toX(index)}
            y={height - 8}
            fontSize={11}
            fill={theme.textSecondary}
            textAnchor="middle"
            fontFamily={Fonts.sans}
          >
            {point.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
});
