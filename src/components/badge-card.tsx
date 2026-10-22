import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Ear,
  Footprints,
  HandHelping,
  Heart,
  Lock,
  MessageCircle,
  Mountain,
  Smile,
  Sparkles,
  Sprout,
  Users,
  Droplets,
  type LucideIcon,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const ICONS = {
  sprout: Sprout,
  heart: Heart,
  ear: Ear,
  smile: Smile,
  helping: HandHelping,
  chat: MessageCircle,
  footprints: Footprints,
  sparkles: Sparkles,
  mountain: Mountain,
  users: Users,
  ripple: Droplets,
} satisfies Record<string, LucideIcon>;

export type BadgeIconType = keyof typeof ICONS | 'lock';

interface BadgeCardProps {
  title: string;
  subtitle: string;
  iconType: BadgeIconType;
  isEarned?: boolean;
}

export function BadgeCard({ title, subtitle, iconType, isEarned = true }: BadgeCardProps) {
  const theme = useTheme();

  // Earned badges glow in soft jade (the same as a completed day); locked ones stay muted.
  const color = isEarned ? '#79D2A9' : theme.textSecondary;
  const bg = isEarned ? '#79D2A930' : theme.muted;
  const Icon = isEarned && iconType !== 'lock' ? ICONS[iconType] : Lock;

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
      <View style={[styles.circle, { backgroundColor: bg }]}>
        <Icon size={26} color={color} strokeWidth={2} />
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
