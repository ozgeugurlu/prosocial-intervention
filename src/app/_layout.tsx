import { useFonts } from 'expo-font';
import { DarkTheme, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AuthScreen } from '@/components/auth-screen';
import { OnboardingFlow } from '@/components/onboarding-flow';
import { DemoPanel } from '@/components/demo-panel';
import { NavyBackdrop } from '@/components/navy-backdrop';
import { Tutorial } from '@/components/tutorial';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { StudyProvider, useStudy } from '@/contexts/study-context';
import { DEMO } from '@/utils/demo';
import { configureNotifications, scheduleReminders } from '@/utils/notifications';

configureNotifications();

// Screens and navigators are transparent so the navy backdrop shows through everywhere.
const NAV_THEME = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: 'transparent', card: 'transparent', border: 'transparent' },
};

function AppContent() {
  const { user, isLoading: authLoading } = useAuth();
  const { isOnboarded, isTutorialCompleted, isLoading, completeOnboarding, completeTutorial, reminders } = useStudy();

  // Re-apply reminders after reinstall / new device, from the times saved in the participant record.
  useEffect(() => {
    if (user && isTutorialCompleted && reminders) scheduleReminders(reminders).catch(() => undefined);
  }, [user, isTutorialCompleted, reminders]);

  if (authLoading || (user && isLoading)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }
  if (!user) return <AuthScreen />;
  if (!isOnboarded) return <OnboardingFlow onDone={completeOnboarding} />;
  if (!isTutorialCompleted) return <Tutorial onDone={completeTutorial} />;
  return <AppTabs />;
}

export default function RootLayout() {

  const [loaded, error] = useFonts({
    DMSans: require('../../assets/fonts/DMSans-VariableFont_opsz,wght.ttf'),
    'DMSans-Italic': require('../../assets/fonts/DMSans-Italic-VariableFont_opsz,wght.ttf'),
    CrimsonPro: require('../../assets/fonts/CrimsonPro-VariableFont_wght.ttf'),
    'CrimsonPro-Italic': require('../../assets/fonts/CrimsonPro-Italic-VariableFont_wght.ttf'),
  });

  if (!loaded && !error) {
    return null;
  }

  return (
    <AuthProvider>
      <StudyProvider>
        <ThemeProvider value={NAV_THEME}>
          <NavyBackdrop />
          <AnimatedSplashOverlay />
          <AppContent />
          {DEMO && <DemoPanel />}
        </ThemeProvider>
      </StudyProvider>
    </AuthProvider>
  );
}
