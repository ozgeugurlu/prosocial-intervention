import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getFaq } from '@/utils/firestore';
import type { FaqItem } from '@/utils/schema';

export default function FaqScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<FaqItem[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    getFaq().then(setItems);
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScreenHeader title="FAQ" />
      {!items ? (
        <ActivityIndicator style={{ marginTop: Spacing.six }} />
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.six }]}>
          {items.map((it) => {
            const isOpen = open === it.id;
            return (
              <Pressable
                key={it.id}
                onPress={() => setOpen(isOpen ? null : it.id)}
                style={[styles.item, { backgroundColor: theme.card, borderColor: theme.border }]}
                accessibilityRole="button"
                accessibilityState={{ expanded: isOpen }}
              >
                <View style={styles.q}>
                  <ThemedText style={styles.qText}>{it.question}</ThemedText>
                  {isOpen ? <ChevronUp size={18} color={theme.textSecondary} /> : <ChevronDown size={18} color={theme.textSecondary} />}
                </View>
                {isOpen && (
                  <ThemedText themeColor="textSecondary" style={styles.a}>
                    {it.answer}
                  </ThemedText>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.two, maxWidth: 680, width: '100%', alignSelf: 'center' },
  item: { borderRadius: 16, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  q: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qText: { flex: 1, fontSize: 16, fontWeight: '600', lineHeight: 22 },
  a: { fontSize: 15, lineHeight: 23 },
});
