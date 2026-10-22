import { useRouter, type Href } from 'expo-router';
import { Bell, BarChart3, ChevronRight, CircleHelp, Compass, LogOut, Mail, ShieldCheck, type LucideIcon } from 'lucide-react-native';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HomeCard } from '@/components/home-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useStudy } from '@/contexts/study-context';
import { useTheme } from '@/hooks/use-theme';
import { cancelReminders, formatTime } from '@/utils/notifications';

interface Row {
  icon: LucideIcon;
  label: string;
  detail?: string;
  href: Href;
}

export default function MeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signOut } = useAuth();
  const { studyId, userName, reminders, currentDay, hasStarted, clearLocalData } = useStudy();

  const rows: Row[] = [
    { icon: BarChart3, label: 'My participation', detail: 'Your progress and feedback', href: '/profile/feedback' },
    {
      icon: Bell,
      label: 'Reminder settings',
      detail: reminders ? `${formatTime(reminders.morning)} and ${formatTime(reminders.evening)}` : 'Not set',
      href: '/profile/reminders',
    },
    { icon: CircleHelp, label: 'FAQ', detail: 'Common questions', href: '/profile/faq' },
    { icon: Mail, label: 'Contact the research team', detail: 'Questions, problems, or to withdraw', href: '/profile/contact' },
    { icon: Compass, label: 'Replay the app tour', href: '/profile/tour' },
  ];

  const doSignOut = async () => {
    await cancelReminders();
    await clearLocalData();
    await signOut();
  };

  const confirmSignOut = () => {
    const msg = 'Your progress is saved to your study account. Reminders on this phone will stop until you sign back in.';
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) doSignOut();
      return;
    }
    Alert.alert('Sign out?', msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: doSignOut },
    ]);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.six }]}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>{userName ? `Hi, ${userName}` : 'Me'}</ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.subtitle}>
            Study ID {studyId} · {hasStarted ? `Day ${currentDay}` : 'Starts Sunday'}
          </ThemedText>
        </View>

        <HomeCard style={styles.list}>
          {rows.map((r, i) => (
            <Pressable
              key={r.label}
              onPress={() => router.push(r.href)}
              style={({ pressed }) => [styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
            >
              <View style={[styles.rowIcon, { backgroundColor: `${theme.primary}22` }]}>
                <r.icon size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.rowLabel}>{r.label}</ThemedText>
                {r.detail ? (
                  <ThemedText themeColor="textSecondary" style={styles.rowDetail}>
                    {r.detail}
                  </ThemedText>
                ) : null}
              </View>
              <ChevronRight size={18} color={theme.textSecondary} />
            </Pressable>
          ))}
        </HomeCard>

        <View style={[styles.privacy, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ShieldCheck size={20} color="#79D2A9" />
          <ThemedText themeColor="textSecondary" style={styles.privacyText}>
            Your responses are stored with your study ID only, in a secure database controlled by the research team.
            Your nickname stays on this phone. Percy is scripted, so your messages are never sent to an AI company.
          </ThemedText>
        </View>

        <Pressable onPress={confirmSignOut} style={[styles.signOut, { borderColor: theme.border }]} accessibilityRole="button">
          <LogOut size={18} color={theme.destructive} />
          <ThemedText style={{ color: theme.destructive, fontWeight: '600' }}>Sign out</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Spacing.four, gap: Spacing.four, maxWidth: 680, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', gap: 4 },
  title: { fontFamily: Fonts.serif, fontSize: 29, fontWeight: '700', lineHeight: 34, textAlign: 'center' },
  subtitle: { fontSize: 15 },
  list: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 16, fontWeight: '600' },
  rowDetail: { fontSize: 13 },
  privacy: { flexDirection: 'row', gap: 12, borderRadius: 16, borderWidth: 1, padding: Spacing.three },
  privacyText: { flex: 1, fontSize: 13, lineHeight: 19 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 16, paddingVertical: 14 },
});
