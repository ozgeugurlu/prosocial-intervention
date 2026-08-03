import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { RotateCw } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Flashcard } from '@/utils/schema';

interface FlashcardCardProps {
  /** Text to display on the front (used when type is 'text' or as fallback) */
  frontText: string;
  /** Text to display on the back */
  backText: string;
  /** Card type — determines how the front is rendered */
  type?: Flashcard['type'];
}

export function FlashcardCard({ frontText, backText, type = 'text' }: FlashcardCardProps) {
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

  const renderFrontContent = () => {
    if (type === 'image') {
      return (
        <>
          <Image
            source={{ uri: frontText }}
            style={styles.frontImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.flipPrompt}>
            <RotateCw size={12} color={theme.textSecondary} />
            <ThemedText style={styles.flipText} themeColor="textSecondary">
              Tap to flip
            </ThemedText>
          </View>
        </>
      );
    }

    return (
      <>
        <ThemedText style={styles.frontText}>{frontText}</ThemedText>
        <View style={styles.flipPrompt}>
          <RotateCw size={12} color={theme.textSecondary} />
          <ThemedText style={styles.flipText} themeColor="textSecondary">
            Tap to flip
          </ThemedText>
        </View>
      </>
    );
  };

  return (
    <Pressable onPress={flipCard} style={styles.cardWrapper}>
      <View style={[styles.cardContainer, { backgroundColor: theme.background }]}>
        {/* Front Side */}
        <Animated.View
          style={[
            styles.cardSide,
            type === 'image' && styles.cardSideImage,
            frontAnimatedStyle,
          ]}
        >
          {renderFrontContent()}
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
  cardSideImage: {
    padding: 0,
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
  frontImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
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
    paddingVertical: Spacing.two,
  },
  flipText: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
});
