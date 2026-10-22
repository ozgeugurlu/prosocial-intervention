/**
 * Study state for the signed-in participant.
 *
 * Firestore (participants/{uid}) is the source of truth so data reaches the
 * research team and survives reinstalls. AsyncStorage is kept as a local cache
 * for fast startup and for the participant's nickname, which is deliberately
 * never uploaded.
 */
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import {
  getAllDays,
  getDailySurveys,
  getProfile,
  saveDayTask,
  updateProfile,
  type ReminderTimes,
} from '@/utils/participant-data';
import { DailyProgress, storage, StudyDailyScores, StudyProgress } from '@/utils/storage';

interface StudyContextType {
  uid: string | null;
  studyId: string | null;
  startDate: string | null;
  /** Study day 1–63; stays 1 until the program starts. */
  currentDay: number;
  currentWeek: number;
  daysElapsed: number;
  /** False between onboarding and the first Sunday (the baseline period). */
  hasStarted: boolean;
  daysUntilStart: number;
  isLoading: boolean;
  isOnboarded: boolean;
  isTutorialCompleted: boolean;
  userName: string | null;
  progress: StudyProgress;
  reminders: ReminderTimes | null;
  setUserName: (name: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  completeTutorial: () => Promise<void>;
  setReminders: (r: ReminderTimes) => Promise<void>;
  updateProgress: (day: number, task: keyof DailyProgress, completed: boolean) => Promise<void>;
  /** Clears this device's cached study data (used on sign-out). */
  clearLocalData: () => Promise<void>;
}

/** Midnight (local) of the given day if it is a Sunday, otherwise of the next Sunday. */
export function nextSundayOnOrAfter(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return d;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

const EMPTY_DAY: DailyProgress = {
  'morning chat': false,
  'morning video': false,
  'night chat': false,
  'night survey': false,
};

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user, studyId } = useAuth();
  const uid = user?.uid ?? null;

  const [startDate, setStartDateState] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isTutorialCompleted, setTutorialCompleted] = useState(false);
  const [reminders, setRemindersState] = useState<ReminderTimes | null>(null);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [progress, setProgressState] = useState<StudyProgress>({});
  // The uid whose data has finished loading. Deriving isLoading from it means a
  // freshly signed-in user never briefly sees another state (e.g. onboarding).
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const isLoading = !!uid && loadedFor !== uid;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!uid) return;

      // Local cache first so the UI isn't blank while offline.
      const storedName = await storage.getItem('@percy_username', '');
      if (!cancelled) setUserNameState(storedName || null);

      try {
        const [profile, days, surveys] = await Promise.all([
          getProfile(uid),
          getAllDays(uid),
          getDailySurveys(uid),
        ]);
        if (cancelled) return;
        setIsOnboarded(!!profile?.onboarded);
        setTutorialCompleted(!!profile?.tutorialCompleted);
        setStartDateState(profile?.startDate ?? null);
        setRemindersState(profile?.reminders ?? null);
        setProgressState(days);

        const scores: StudyDailyScores = {};
        surveys.forEach((s) => (scores[s.day] = s.average));
        await storage.setItem('@percy_progress', days);
        await storage.setItem('@percy_daily_scores', scores);
      } catch (e) {
        console.warn('Could not reach Firestore, using cached study data', e);
        const cached = await storage.getItem('@percy_progress', {});
        if (!cancelled) {
          setProgressState(cached);
          setIsOnboarded(await storage.getItem('@percy_onboarded', false));
          const cachedStart = await storage.getItem('@percy_start_date', '');
          setStartDateState(cachedStart || null);
        }
      }
      if (!cancelled) setLoadedFor(uid);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  const setUserName = async (name: string) => {
    // Nickname is only kept on this device.
    await storage.setItem('@percy_username', name);
    setUserNameState(name);
  };

  const completeOnboarding = async () => {
    // Everyone starts on a Sunday: the program begins on the next Sunday
    // (today, if onboarding happens on a Sunday). Days before it are baseline.
    const start = nextSundayOnOrAfter(new Date()).toISOString();
    setStartDateState(start);
    setIsOnboarded(true);
    await storage.setItem('@percy_onboarded', true);
    await storage.setItem('@percy_start_date', start);
    if (uid) await updateProfile(uid, { onboarded: true, startDate: start });
  };

  const completeTutorial = async () => {
    setTutorialCompleted(true);
    if (uid) await updateProfile(uid, { tutorialCompleted: true });
  };

  const setReminders = async (r: ReminderTimes) => {
    setRemindersState(r);
    if (uid) {
      await updateProfile(uid, {
        reminders: r,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
      });
    }
  };

  const updateProgress = useCallback(
    async (day: number, task: keyof DailyProgress, completed: boolean) => {
      setProgressState((prev) => {
        const updated = { ...prev, [day]: { ...(prev[day] || EMPTY_DAY), [task]: completed } };
        storage.setItem('@percy_progress', updated);
        return updated;
      });
      if (uid) {
        await saveDayTask(uid, day, task, completed).catch((e) => console.warn('Task sync failed', e));
      }
    },
    [uid],
  );

  const clearLocalData = async () => {
    await storage.clear();
    setUserNameState(null);
    setProgressState({});
    setStartDateState(null);
    setIsOnboarded(false);
    setTutorialCompleted(false);
    setRemindersState(null);
    setLoadedFor(null);
  };

  // Calendar-day math in the participant's local time zone
  let rawElapsed = 0;
  if (startDate) {
    const start = new Date(startDate);
    const startLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    rawElapsed = Math.round((todayLocal.getTime() - startLocal.getTime()) / 86_400_000);
  }
  const hasStarted = !!startDate && rawElapsed >= 0;
  const daysUntilStart = Math.max(0, -rawElapsed);
  const daysElapsed = Math.max(0, rawElapsed);
  const currentDay = daysElapsed + 1;
  const currentWeek = Math.floor(daysElapsed / 7) + 1;

  return (
    <StudyContext.Provider
      value={{
        uid,
        studyId,
        startDate,
        currentDay,
        currentWeek,
        daysElapsed,
        hasStarted,
        daysUntilStart,
        isLoading,
        isOnboarded,
        isTutorialCompleted,
        userName,
        progress,
        reminders,
        setUserName,
        completeOnboarding,
        completeTutorial,
        setReminders,
        updateProgress,
        clearLocalData,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const context = useContext(StudyContext);
  if (context === undefined) {
    throw new Error('useStudy must be used within a StudyProvider');
  }
  return context;
}
