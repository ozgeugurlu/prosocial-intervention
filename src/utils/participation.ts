/**
 * Participation metrics: streaks, completion rates, weekly cycles, and the
 * participant-facing evaluation.
 *
 * RESEARCH TEAM: `evaluateParticipation` is where the feedback logic lives.
 * The thresholds and wording below are placeholders for you to replace with
 * your own design.
 */
import type { DailySurveyRecord, WeeklySurveyRecord } from './participant-data';
import type { DailyProgress, StudyProgress } from './storage';

// ─── Weeks ──────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');
export const toDateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** YYYY-MM-DD of the most recent Sunday (today if today is Sunday), local time. */
export function weekOfFor(date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return toDateKey(d);
}

/** Days since this week's Sunday (0 on Sunday). */
export const daysIntoWeek = (date = new Date()) => date.getDay();

export function formatWeekOf(weekOf: string): string {
  const [y, m, d] = weekOf.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Local calendar date for a study day (day 1 = start date). */
export function dateForStudyDay(startDate: string, day: number): Date {
  const s = new Date(startDate);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + day - 1);
}

// ─── Days and streaks ───────────────────────────────────────────────────────

export const TASKS: (keyof DailyProgress)[] = ['morning chat', 'morning video', 'night chat', 'night survey'];

export const tasksDone = (p?: DailyProgress) => (p ? TASKS.filter((t) => p[t]).length : 0);
export const isActiveDay = (p?: DailyProgress) => tasksDone(p) > 0;

/**
 * Current streak: consecutive active days ending today, or ending yesterday if
 * today has no activity yet (so the streak isn't "lost" before the day is over).
 */
export function currentStreak(progress: StudyProgress, currentDay: number): number {
  let day = isActiveDay(progress[currentDay]) ? currentDay : currentDay - 1;
  let streak = 0;
  while (day >= 1 && isActiveDay(progress[day])) {
    streak++;
    day--;
  }
  return streak;
}

export function longestStreak(progress: StudyProgress, currentDay: number): number {
  let best = 0;
  let run = 0;
  for (let d = 1; d <= currentDay; d++) {
    run = isActiveDay(progress[d]) ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export type DayState = 'full' | 'partial' | 'missed' | 'today' | 'upcoming';

export function dayState(progress: StudyProgress, day: number, currentDay: number): DayState {
  const done = tasksDone(progress[day]);
  if (day > currentDay) return 'upcoming';
  if (done === TASKS.length) return 'full';
  if (done > 0) return 'partial';
  return day === currentDay ? 'today' : 'missed';
}

// ─── Metrics ────────────────────────────────────────────────────────────────

export interface ParticipationMetrics {
  daysElapsed: number; // completed study days (excludes today)
  activeDays: number;
  interactionRate: number; // active days / days so far
  chatRate: number; // chats completed / chats offered
  dailySurveyRate: number; // surveys completed / days so far
  behaviorRate: number | null; // "yes" adherence / surveys answered
  weeklySurveyRate: number | null;
  currentStreak: number;
  longestStreak: number;
}

const ratio = (a: number, b: number) => (b > 0 ? Math.min(1, a / b) : 0);

export function computeMetrics(
  progress: StudyProgress,
  currentDay: number,
  dailySurveys: DailySurveyRecord[],
  weeklySurveys: WeeklySurveyRecord[],
  weeklySurveysOffered: number,
): ParticipationMetrics {
  // Count today only once something has been done, so early-morning rates aren't penalised.
  const daysSoFar = isActiveDay(progress[currentDay]) ? currentDay : currentDay - 1;
  let activeDays = 0;
  let chats = 0;
  for (let d = 1; d <= currentDay; d++) {
    if (isActiveDay(progress[d])) activeDays++;
    if (progress[d]?.['morning chat']) chats++;
    if (progress[d]?.['night chat']) chats++;
  }
  const answered = dailySurveys.length;
  const yes = dailySurveys.filter((s) => s.adherence === 'yes').length;
  return {
    daysElapsed: currentDay - 1,
    activeDays,
    interactionRate: ratio(activeDays, daysSoFar),
    chatRate: ratio(chats, daysSoFar * 2),
    dailySurveyRate: ratio(answered, daysSoFar),
    behaviorRate: answered > 0 ? yes / answered : null,
    weeklySurveyRate: weeklySurveysOffered > 0 ? ratio(weeklySurveys.length, weeklySurveysOffered) : null,
    currentStreak: currentStreak(progress, currentDay),
    longestStreak: longestStreak(progress, currentDay),
  };
}

// ─── Evaluation (placeholder: research team to design) ─────────────────────

export interface Evaluation {
  level: 'starting' | 'building' | 'steady' | 'thriving';
  headline: string;
  message: string;
}

export function evaluateParticipation(m: ParticipationMetrics): Evaluation {
  // PLACEHOLDER thresholds and copy. Replace with the study's feedback design.
  if (m.daysElapsed < 3) {
    return {
      level: 'starting',
      headline: 'Off to a good start',
      message: 'Your summary will fill in over your first few days. Keep checking in with Percy each morning and evening.',
    };
  }
  const overall = (m.interactionRate + m.dailySurveyRate + (m.behaviorRate ?? m.interactionRate)) / 3;
  if (overall >= 0.85)
    return {
      level: 'thriving',
      headline: 'You are thriving',
      message: 'You have been showing up almost every day and following through on your activities. That consistency is what builds lasting habits.',
    };
  if (overall >= 0.6)
    return {
      level: 'steady',
      headline: 'Steady progress',
      message: 'You are engaging regularly. Try linking your check-ins to something you already do each day, like your morning coffee, to make them automatic.',
    };
  return {
    level: 'building',
    headline: 'Every day is a fresh start',
    message: 'Life gets busy. Even one short check-in a day makes a difference. Your reminder times can be changed in Reminder settings if they are not working for you.',
  };
}

// ─── Weekly survey windows ──────────────────────────────────────────────────

/**
 * The weekly survey opens each Sunday for `openDays` days, from the first
 * Sunday after the participant started.
 */
export function weeklySurveyWindow(startDate: string | null, openDays: number, now = new Date()) {
  const weekOf = weekOfFor(now);
  const startedBefore = !!startDate && toDateKey(new Date(startDate)) < weekOf;
  const isOpen = startedBefore && daysIntoWeek(now) < openDays;
  return { weekOf, isOpen };
}

/** How many weekly survey windows have opened so far (for completion rate). */
export function weeklySurveysOffered(startDate: string | null, now = new Date()): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const firstSunday = new Date(start.getFullYear(), start.getMonth(), start.getDate() + (7 - start.getDay()));
  if (now < firstSunday) return 0;
  return Math.floor((now.getTime() - firstSunday.getTime()) / (7 * 86_400_000)) + 1;
}

/** Mean score on the instrument scale, with reverse-keyed items flipped. */
export function scoreWeeklySurvey(
  items: { id: string; reverse?: boolean }[],
  responses: Record<string, number>,
  scaleMin: number,
  scaleMax: number,
): number {
  const vals = items.map((it) => {
    const v = responses[it.id];
    return it.reverse ? scaleMax + scaleMin - v : v;
  });
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
}
