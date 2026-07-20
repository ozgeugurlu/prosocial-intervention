import AsyncStorage from '@react-native-async-storage/async-storage';
import { SURVEY_EMOTIONS } from '@/constants/survey';

export const STUDY_LENGTH = 63;

/** Valid score on the 1–5 Likert scale */
export type LikertScore = 1 | 2 | 3 | 4 | 5;

/** Average daily score, between 1 and 5 inclusive */
export type DailyAverageScore = number;

/** Map of study day (1–63) to that day's average score */
export type StudyDailyScores = Partial<Record<number, DailyAverageScore>>;

export interface DailyProgress {
  'morning chat': boolean;
  'morning video': boolean;
  'night chat': boolean;
  'night survey': boolean;
}

export type StudyProgress = Record<number, DailyProgress>;

export interface StorageSchema {
  '@percy_credits': number;
  '@percy_status': string;
  '@percy_start_date': string;
  '@percy_onboarded': boolean;
  '@percy_username': string;
  '@percy_progress': StudyProgress;
  '@percy_daily_scores': StudyDailyScores;
}

const DAILY_SCORES_KEY = '@percy_daily_scores' as const;

export function isValidStudyDay(day: number): boolean {
  return Number.isInteger(day) && day >= 1 && day <= STUDY_LENGTH;
}

export function isValidLikertScore(score: number): score is LikertScore {
  return Number.isInteger(score) && score >= 1 && score <= 5;
}

/** Computes the average of 1–5 ratings, rounded to two decimal places. */
export function computeAverageScore(ratings: number[]): DailyAverageScore {
  if (ratings.length === 0) {
    throw new Error('Cannot compute average score from empty ratings');
  }

  for (const rating of ratings) {
    if (!isValidLikertScore(rating)) {
      throw new Error(`Invalid Likert score: ${rating}. Expected an integer from 1 to 5.`);
    }
  }

  let sum = 0;
  for (let i = 0; i < ratings.length; i++) {
    const rating = ratings[i];
    const isPositive = SURVEY_EMOTIONS[i]?.isPositive ?? true;
    const contribution = isPositive ? rating : (6 - rating);
    sum += contribution;
  }

  return Math.round((sum / ratings.length) * 100) / 100;
}

export const storage = {
  /**
   * Retrieves a typed value from local storage.
   * Parses JSON automatically. Returns defaultValue if the key is not found or fails to read.
   * Falls back to treating the stored value as a raw string if parsing fails and a string is expected.
   */
  async getItem<K extends keyof StorageSchema>(
    key: K,
    defaultValue: StorageSchema[K]
  ): Promise<StorageSchema[K]> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        return defaultValue;
      }
      try {
        return JSON.parse(value) as StorageSchema[K];
      } catch (parseError) {
        // Fallback for raw strings stored in storage before migration
        if (typeof defaultValue === 'string') {
          return value as unknown as StorageSchema[K];
        }
        throw parseError;
      }
    } catch (error) {
      console.error(`Error reading key "${key}" from AsyncStorage:`, error);
      return defaultValue;
    }
  },

  /**
   * Saves a typed value to local storage.
   * Serializes the value to JSON automatically.
   */
  async setItem<K extends keyof StorageSchema>(key: K, value: StorageSchema[K]): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing key "${key}" to AsyncStorage:`, error);
    }
  },

  /**
   * Removes a key from local storage.
   */
  async removeItem<K extends keyof StorageSchema>(key: K): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing key "${key}" from AsyncStorage:`, error);
    }
  },

  /**
   * Clears all items in local storage.
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  },

  /** Returns all stored daily average scores keyed by study day (1–63). */
  async getDailyScores(): Promise<StudyDailyScores> {
    return this.getItem(DAILY_SCORES_KEY, {});
  },

  /** Returns the average score for a given study day, or null if not recorded. */
  async getDayScore(day: number): Promise<DailyAverageScore | null> {
    if (!isValidStudyDay(day)) {
      throw new Error(`Invalid study day: ${day}. Expected an integer from 1 to ${STUDY_LENGTH}.`);
    }

    const scores = await this.getDailyScores();
    return scores[day] ?? null;
  },

  /** Stores the average score for a given study day (1–63). */
  async setDayScore(day: number, averageScore: DailyAverageScore): Promise<void> {
    if (!isValidStudyDay(day)) {
      throw new Error(`Invalid study day: ${day}. Expected an integer from 1 to ${STUDY_LENGTH}.`);
    }

    if (averageScore < 1 || averageScore > 5) {
      throw new Error(
        `Invalid average score: ${averageScore}. Expected a number from 1 to 5.`
      );
    }

    const scores = await this.getDailyScores();
    const updated: StudyDailyScores = {
      ...scores,
      [day]: averageScore,
    };
    await this.setItem(DAILY_SCORES_KEY, updated);
  },

  /** Computes and stores the average score for a study day from individual 1–5 ratings. */
  async setDayScoreFromRatings(day: number, ratings: number[]): Promise<DailyAverageScore> {
    const existing = await this.getDayScore(day);
    if (existing != null) {
      throw new Error(`Survey already completed for study day ${day}.`);
    }

    const averageScore = computeAverageScore(ratings);
    await this.setDayScore(day, averageScore);
    return averageScore;
  },

  /** Returns true if a survey score has already been recorded for the study day. */
  async hasDayScore(day: number): Promise<boolean> {
    return (await this.getDayScore(day)) != null;
  },
};
