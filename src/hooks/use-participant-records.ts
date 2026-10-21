import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { DEFAULT_STUDY_CONFIG } from '@/constants/content-defaults';
import { useStudy } from '@/contexts/study-context';
import { getStudyConfig } from '@/utils/firestore';
import {
  getDailySurveys,
  getGoals,
  getWeeklySurveys,
  type DailySurveyRecord,
  type WeeklyGoal,
  type WeeklySurveyRecord,
} from '@/utils/participant-data';
import type { StudyConfig } from '@/utils/schema';

/** Goals, surveys and study config for the signed-in participant, refreshed whenever the screen gains focus. */
export function useParticipantRecords() {
  const { uid } = useStudy();
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [weekly, setWeekly] = useState<WeeklySurveyRecord[]>([]);
  const [daily, setDaily] = useState<DailySurveyRecord[]>([]);
  const [config, setConfig] = useState<StudyConfig>(DEFAULT_STUDY_CONFIG);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    if (!uid) return;
    try {
      const [g, w, d, c] = await Promise.all([getGoals(uid), getWeeklySurveys(uid), getDailySurveys(uid), getStudyConfig()]);
      setGoals(g);
      setWeekly(w);
      setDaily(d);
      setConfig(c);
    } catch (e) {
      console.warn('Could not load participant records', e);
    } finally {
      setLoaded(true);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { goals, weekly, daily, config, loaded, refresh };
}
