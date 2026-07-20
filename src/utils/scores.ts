import { StudyDailyScores } from '@/utils/storage';

export const ROLLING_WINDOW = 5;

export interface RollingAveragePoint {
  day: number;
  label: string;
  value: number | null;
}

/** Average of stored daily scores in the window ending on `endDay` (up to 5 days). */
export function computeRollingAverage(
  scores: StudyDailyScores,
  endDay: number,
  windowSize = ROLLING_WINDOW
): number | null {
  const values: number[] = [];
  const startDay = Math.max(1, endDay - windowSize + 1);

  for (let day = startDay; day <= endDay; day++) {
    const score = scores[day];
    if (score != null) {
      values.push(score);
    }
  }

  if (values.length === 0) {
    return null;
  }

  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100;
}

/** Rolling average for each study day in the most recent 5-day window. */
export function getRollingAverageSeries(
  scores: StudyDailyScores,
  currentDay: number,
  windowSize = ROLLING_WINDOW
): RollingAveragePoint[] {
  const startDay = Math.max(1, currentDay - windowSize + 1);
  const points: RollingAveragePoint[] = [];

  for (let day = startDay; day <= currentDay; day++) {
    points.push({
      day,
      label: `D${day}`,
      value: computeRollingAverage(scores, day, windowSize),
    });
  }

  return points;
}
