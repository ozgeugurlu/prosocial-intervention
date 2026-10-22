import { CalendarClock } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { HomeCard } from '@/components/home-card';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useStudy } from '@/contexts/study-context';
import { useTheme } from '@/hooks/use-theme';

/** Shown during the baseline period, between onboarding and the first Sunday. */
export function PrestartCard({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  const { startDate, daysUntilStart } = useStudy();
  const when = startDate
    ? new Date(startDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    : 'Sunday';
  const countdown = daysUntilStart === 1 ? 'tomorrow' : `in ${daysUntilStart} days`;

  return (
    <HomeCard style={styles.card}>
      <View style={[styles.icon, { backgroundColor: `${theme.primary}25` }]}>
        <CalendarClock size={28} color={theme.primary} />
      </View>
      <ThemedText style={styles.title}>Your program starts {when}</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.text}>
        {compact
          ? `That's ${countdown}. Percy will check in with you that morning.`
          : `That's ${countdown}. Everyone begins on a Sunday. Until then, feel free to look around the app and check your reminder times in the Me tab.`}
      </ThemedText>
    </HomeCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: Spacing.two },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.sans, fontSize: 20, lineHeight: 25, fontWeight: '700', textAlign: 'center' },
  text: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
});
