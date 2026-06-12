import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { storage } from '@/utils/storage';

interface StudyContextType {
  startDate: string | null;
  currentDay: number;
  currentWeek: number;
  daysElapsed: number;
  isLoading: boolean;
  isOnboarded: boolean;
  setStartDate: (date: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  resetStudy: () => Promise<void>;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [startDate, setStartDateState] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const onboarded = await storage.getItem('@peach_onboarded', false);
      setIsOnboarded(onboarded);

      const storedDate = await storage.getItem('@peach_start_date', '');
      if (storedDate) {
        setStartDateState(storedDate);
      } else if (onboarded) {
        // If onboarded but start date was somehow missing, set it to now
        const today = new Date().toISOString();
        await storage.setItem('@peach_start_date', today);
        setStartDateState(today);
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const setStartDate = async (date: string) => {
    await storage.setItem('@peach_start_date', date);
    setStartDateState(date);
  };

  const completeOnboarding = async () => {
    const today = new Date().toISOString();
    await storage.setItem('@peach_onboarded', true);
    await storage.setItem('@peach_start_date', today);
    setStartDateState(today);
    setIsOnboarded(true);
  };

  const resetStudy = async () => {
    const today = new Date().toISOString();
    await storage.setItem('@peach_start_date', today);
    setStartDateState(today);
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
        setStartDate,
        completeOnboarding,
        resetStudy,
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
