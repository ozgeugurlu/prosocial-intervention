import { storage, DailyProgress, StudyProgress } from '@/utils/storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface StudyContextType {
  startDate: string | null;
  currentDay: number;
  currentWeek: number;
  daysElapsed: number;
  isLoading: boolean;
  isOnboarded: boolean;
  userName: string | null;
  progress: StudyProgress;
  setStartDate: (date: string) => Promise<void>;
  setUserName: (name: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetStudy: () => Promise<void>;
  updateProgress: (day: number, task: keyof DailyProgress, completed: boolean) => Promise<void>;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [startDate, setStartDateState] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [progress, setProgressState] = useState<StudyProgress>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const onboarded = await storage.getItem('@percy_onboarded', false);
      setIsOnboarded(onboarded);

      const storedName = await storage.getItem('@percy_username', '');
      if (storedName) {
        setUserNameState(storedName);
      }

      const storedDate = await storage.getItem('@percy_start_date', '');
      if (storedDate) {
        setStartDateState(storedDate);
      } else if (onboarded) {
        // If onboarded but start date was somehow missing, set it to now
        const today = new Date().toISOString();
        await storage.setItem('@percy_start_date', today);
        setStartDateState(today);
      }

      const storedProgress = await storage.getItem('@percy_progress', {});
      setProgressState(storedProgress);

      setIsLoading(false);
    }
    init();
  }, []);

  const setStartDate = async (date: string) => {
    await storage.setItem('@percy_start_date', date);
    setStartDateState(date);
  };

  const setUserName = async (name: string) => {
    await storage.setItem('@percy_username', name);
    setUserNameState(name);
  };

  const completeOnboarding = async () => {
    const today = new Date().toISOString();
    await storage.setItem('@percy_onboarded', true);
    await storage.setItem('@percy_start_date', today);
    setStartDateState(today);
    setIsOnboarded(true);
  };

  const resetStudy = async () => {
    const today = new Date().toISOString();
    await storage.setItem('@percy_start_date', today);
    setStartDateState(today);
    await storage.setItem('@percy_progress', {});
    setProgressState({});
    await storage.setItem('@percy_daily_scores', {});
  };

  const updateProgress = async (day: number, task: keyof DailyProgress, completed: boolean) => {
    setProgressState((prev) => {
      const updated = {
        ...prev,
        [day]: {
          ...(prev[day] || {
            'morning chat': false,
            'morning video': false,
            'night chat': false,
            'night survey': false,
          }),
          [task]: completed,
        },
      };
      storage.setItem('@percy_progress', updated);
      return updated;
    });
  };

  // Calculate days elapsed using calendar-day math
  let daysElapsed = 0;
  if (startDate) {
    const start = new Date(startDate);
    const startLocal = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const today = new Date();
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffMs = todayLocal.getTime() - startLocal.getTime();
    daysElapsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  const currentDay = daysElapsed + 1;
  const currentWeek = Math.floor(daysElapsed / 7) + 1;

  return (
    <StudyContext.Provider
      value={{
        startDate,
        currentDay,
        currentWeek,
        daysElapsed,
        isLoading,
        isOnboarded,
        userName,
        progress,
        setStartDate,
        setUserName,
        completeOnboarding,
        resetStudy,
        updateProgress,
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
