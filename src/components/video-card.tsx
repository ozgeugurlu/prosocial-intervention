import { Play } from 'lucide-react-native';
import { Dimensions, Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { VideoPlayer } from './video-player';


interface VideoCardProps {
  title: string;
  metadata: string;
  videoId?: string;
  onPress?: () => void;
}

export function VideoCard({
  title,
  metadata,
  videoId = '6RypXcD_u1w',
  onPress,
}: VideoCardProps) {
  const theme = useTheme();

  const { width } = Dimensions.get('window');

  const handlePress = async () => {
    if (onPress) {
      onPress();
      return;
    }

    try {
      await Linking.openURL(videoUrl);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.background },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.playIconContainer, { backgroundColor: theme.primary }]}>
        <Play size={20} color="#FDFCF9" fill="#FDFCF9" style={styles.playIcon} />
      </View>
      <View style={styles.textContainer}>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.metadata} themeColor="textSecondary">
          {metadata}
        </ThemedText>
        <VideoPlayer
          videoId={videoId}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: 18,
    gap: 14,
  },
  pressed: {
    opacity: 0.8,
  },
  playIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    marginLeft: 3, // visual centering for triangle
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  metadata: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 16,
  },
});
