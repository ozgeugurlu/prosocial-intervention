import { Heart, Sprout, Sun } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import AppIntroSlider from 'react-native-app-intro-slider';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface OnboardingFlowProps {
  onDone: () => void;
}

interface Slide {
  key: string;
  title: string;
  text: string;
  iconType: 'sprout' | 'sun' | 'heart';
}

const SLIDES: Slide[] = [
  {
    key: 'one',
    title: 'Welcome to PEACH',
    text: 'A prosocial study designed to help you cultivate kindness, empathy, and positive interpersonal connections in your daily life.',
    iconType: 'sprout',
  },
  {
    key: 'two',
    title: 'Daily Intentions',
    text: 'Receive morning intentions and reflect on your experiences in the evening. Keep your calendar slots filled to track your growth.',
    iconType: 'sun',
  },
  {
    key: 'three',
    title: 'Track Your Growth',
    text: 'Form positive habits over the next 7 weeks and earn unique milestone badges like First Steps, Empathy Builder, and Deep Listener.',
    iconType: 'heart',
  },
];

export function OnboardingFlow({ onDone }: OnboardingFlowProps) {
  const theme = useTheme();

  const renderIcon = (type: 'sprout' | 'sun' | 'heart') => {
    const size = 64;
    const color = theme.primary;
    switch (type) {
      case 'sprout':
        return <Sprout size={size} color={color} fill={color} />;
      case 'sun':
        return <Sun size={size} color={color} fill={color} />;
      case 'heart':
        return <Heart size={size} color={color} fill={color} />;
    }
  };

  const renderItem = ({ item }: { item: Slide }) => {
    return (
      <View style={[styles.slide, { backgroundColor: theme.background }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.secondary }]}>
          {renderIcon(item.iconType)}
        </View>
        <ThemedText style={styles.title}>{item.title}</ThemedText>
        <ThemedText style={styles.text} themeColor="textSecondary">
          {item.text}
        </ThemedText>
      </View>
    );
  };

  const renderNextButton = () => (
    <View style={[styles.button, { backgroundColor: theme.primary }]}>
      <ThemedText style={[styles.buttonText, { color: theme.background }]}>Next</ThemedText>
    </View>
  );

  const renderDoneButton = () => (
    <View style={[styles.button, { backgroundColor: theme.primary }]}>
      <ThemedText style={[styles.buttonText, { color: theme.background }]}>Done</ThemedText>
    </View>
  );

  const renderSkipButton = () => (
    <View style={styles.skipButton}>
      <ThemedText style={styles.skipText} themeColor="textSecondary">Skip</ThemedText>
    </View>
  );

  return (
    <AppIntroSlider
      data={SLIDES}
      renderItem={renderItem}
      onDone={onDone}
      onSkip={onDone}
      showSkipButton
      renderNextButton={renderNextButton}
      renderDoneButton={renderDoneButton}
      renderSkipButton={renderSkipButton}
      activeDotStyle={{ backgroundColor: theme.primary, width: 24 }}
      dotStyle={{ backgroundColor: theme.muted }}
    />
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.six,
    gap: Spacing.four,
  },
  iconContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 38,
  },
  text: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  buttonText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '700',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '600',
  },
});
