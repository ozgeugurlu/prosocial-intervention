import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { RotateCw } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface FlashcardCardProps {
  frontText: string;
  backText: string;
}

export function FlashcardCard({ frontText, backText }: FlashcardCardProps) {
  const theme = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const rotate = useSharedValue(0);

  const flipCard = () => {
    setIsFlipped(!isFlipped);
    rotate.value = withTiming(isFlipped ? 0 : 180, { duration: 400 });
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const spin = interpolate(rotate.value, [0, 180], [0, 180]);
    return {
      transform: [{ rotateY: `${spin}deg` }],
      opacity: rotate.value > 90 ? 0 : 1,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const spin = interpolate(rotate.value, [0, 180], [180, 360]);
    return {
      transform: [{ rotateY: `${spin}deg` }],
      opacity: rotate.value > 90 ? 1 : 0,
    };
  });

  return (
    <Pressable onPress={flipCard} style={styles.cardWrapper}>
      <View style={[styles.cardContainer, { backgroundColor: theme.background }]}>
        {/* Front Side */}
        <Animated.View style={[styles.cardSide, frontAnimatedStyle]}>
          <ThemedText style={styles.frontText}>{frontText}</ThemedText>
          <View style={styles.flipPrompt}>
            <RotateCw size={12} color={theme.textSecondary} />
            <ThemedText style={styles.flipText} themeColor="textSecondary">
              Tap to flip
            </ThemedText>
          </View>
        </Animated.View>

        {/* Back Side */}
        <Animated.View style={[styles.cardSide, styles.cardBack, backAnimatedStyle]}>
          <ThemedText style={styles.backText}>{backText}</ThemedText>
          <View style={styles.flipPrompt}>
            <RotateCw size={12} color={theme.textSecondary} />
            <ThemedText style={styles.flipText} themeColor="textSecondary">
              Tap to flip
            </ThemedText>
          </View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
  },
  cardContainer: {
    borderRadius: 18,
    minHeight: 110,
    overflow: 'hidden',
  },
  cardSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  frontText: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.two,
  },
  backText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.two,
  },
  flipPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  flipText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
