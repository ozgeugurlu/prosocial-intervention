import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { OnboardingFlow } from '@/components/onboarding-flow';
import { StudyProvider, useStudy } from '@/contexts/study-context';

function AppContent() {
  const { isOnboarded, isLoading, completeOnboarding } = useStudy();

  if (isLoading) {
    return null;
  }

  if (!isOnboarded) {
    return <OnboardingFlow onDone={completeOnboarding} />;
  }

  return <AppTabs />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  
  const [loaded, error] = useFonts({
    'DMSans': require('../../assets/fonts/DMSans-VariableFont_opsz,wght.ttf'),
    'DMSans-Italic': require('../../assets/fonts/DMSans-Italic-VariableFont_opsz,wght.ttf'),
    'CrimsonPro': require('../../assets/fonts/CrimsonPro-VariableFont_wght.ttf'),
    'CrimsonPro-Italic': require('../../assets/fonts/CrimsonPro-Italic-VariableFont_wght.ttf'),
  });

  if (!loaded && !error) {
    return null;
  }

  return (
    <StudyProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <AppContent />
      </ThemeProvider>
    </StudyProvider>
  );
}
