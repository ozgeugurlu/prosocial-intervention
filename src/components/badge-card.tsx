import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Sprout, Heart, Ear, Lock } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type BadgeIconType = 'sprout' | 'heart' | 'ear' | 'lock';

interface BadgeCardProps {
  title: string;
  subtitle: string;
  iconType: BadgeIconType;
  isEarned?: boolean;
}

export function BadgeCard({ title, subtitle, iconType, isEarned = true }: BadgeCardProps) {
  const theme = useTheme();

  // Define color mapping for badge circles
  const badgeColors = {
    sprout: {
      bg: '#8B9A4725',
      icon: '#8B9A47',
    },
    heart: {
      bg: '#79D2A930',
      icon: '#79D2A9',
    },
    ear: {
      bg: '#E8980825',
      icon: '#E89808',
    },
    lock: {
      bg: theme.muted,
      icon: theme.textSecondary,
    },
  };

  const currentColors = isEarned ? badgeColors[iconType] : badgeColors.lock;

  const renderIcon = () => {
    const iconSize = 26;
    if (!isEarned) {
      return <Lock size={iconSize} color={currentColors.icon} />;
    }
    switch (iconType) {
      case 'sprout':
        return <Sprout size={iconSize} color={currentColors.icon} fill={currentColors.icon} />;
      case 'heart':
        return <Heart size={iconSize} color={currentColors.icon} fill={currentColors.icon} />;
      case 'ear':
        return <Ear size={iconSize} color={currentColors.icon} fill={currentColors.icon} />;
      default:
        return <Lock size={iconSize} color={currentColors.icon} />;
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={[styles.circle, { backgroundColor: currentColors.bg }]}>
        {renderIcon()}
      </View>
      <View style={styles.textGroup}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.subtitle} themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 105,
    height: 140,
    borderRadius: 20,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 12,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: {
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 18,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 15,
  },
});
