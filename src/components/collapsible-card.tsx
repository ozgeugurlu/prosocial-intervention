import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { PropsWithChildren, ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { HomeCard } from '@/components/home-card';
import { ThemedText } from '@/components/themed-text';
import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CollapsibleCardProps {
  /** Title text shown in the header */
  title: string;
  /** Element rendered to the left of the title (icon, dot, etc.) */
  leading?: ReactNode;
  /** Whether the card body starts expanded */
  defaultOpen?: boolean;
  /** Optional extra style for the outer card */
  style?: ViewStyle;
}

/**
 * A card with a pressable header that toggles visibility of its children.
 * Reused for Progress Status and Morning/Evening task cards.
 */
export function CollapsibleCard({
  title,
  leading,
  defaultOpen = true,
  children,
  style,
}: PropsWithChildren<CollapsibleCardProps>) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <HomeCard style={style}>
      <Pressable
        style={styles.header}
        onPress={() => setIsOpen((v) => !v)}
      >
        <View style={styles.headerLeft}>
          {leading}
          <ThemedText style={styles.title}>{title}</ThemedText>
        </View>
        {isOpen ? (
          <ChevronUp size={20} color={theme.textSecondary} />
        ) : (
          <ChevronDown size={20} color={theme.textSecondary} />
        )}
      </Pressable>

      {isOpen && (
        <Animated.View entering={FadeIn.duration(200)}>
          {children}
        </Animated.View>
      )}
    </HomeCard>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
});
