import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { ChevronRight, Lock } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface WeekDrawerProps {
  title: string;
  subtitle: string;
  isCurrent?: boolean;
  defaultOpen?: boolean;
  /** Locked weeks can't be opened; `subtitle` should say when they unlock. */
  locked?: boolean;
  children?: React.ReactNode;
}

const AnimatedChevron = Animated.createAnimatedComponent(ChevronRight);

export function WeekDrawer({
  title,
  subtitle,
  isCurrent = false,
  defaultOpen = false,
  locked = false,
  children,
}: WeekDrawerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const theme = useTheme();

  // Shared value for chevron rotation (0 deg is pointing right, 90 deg is pointing down)
  const rotation = useSharedValue(defaultOpen ? 90 : 0);

  useEffect(() => {
    rotation.value = withTiming(isOpen ? 90 : 0, { duration: 200 });
  }, [isOpen, rotation]);

  const animatedChevronStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.card, shadowColor: theme.text }, locked && styles.locked]}>
      <Pressable
        style={styles.header}
        onPress={() => !locked && setIsOpen((prev) => !prev)}
        disabled={locked}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen && !locked, disabled: locked }}
      >
        <View style={styles.headerLeft}>
          {locked ? (
            <Lock size={20} color={theme.textSecondary} strokeWidth={2} />
          ) : (
            <Animated.View style={animatedChevronStyle}>
              <ChevronRight size={22} color={theme.textSecondary} strokeWidth={2} />
            </Animated.View>
          )}
          <View style={styles.textGroup}>
            <ThemedText style={styles.title}>{title}</ThemedText>
            <ThemedText style={styles.subtitle} themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          </View>
        </View>

        {isCurrent && (
          <View style={[styles.badge, { backgroundColor: theme.secondary }]}>
            <ThemedText style={[styles.badgeText, { color: theme.primary }]}>
              Current
            </ThemedText>
          </View>
        )}
      </Pressable>

      {isOpen && !locked && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    paddingVertical: Spacing.three,
    paddingHorizontal: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 12,
  },
  locked: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textGroup: {
    gap: 2,
  },
  title: {
    fontFamily: Fonts.serif,
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 24,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeText: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    marginTop: Spacing.three,
    gap: 10,
  },
});
