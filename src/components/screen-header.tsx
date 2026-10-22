import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Back-arrow header for pushed screens. */
export function ScreenHeader({ title }: { title: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 16), backgroundColor: theme.card, borderBottomColor: theme.border }]}>
      <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Back" accessibilityRole="button">
        <ArrowLeft size={24} color={theme.text} />
      </Pressable>
      <ThemedText style={styles.title} numberOfLines={1}>
        {title}
      </ThemedText>
      <View style={{ width: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  title: { fontFamily: Fonts.serif, fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center' },
});
